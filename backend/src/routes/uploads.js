import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { supabase, requireSupabaseOr500 } from '../lib/supabaseClient.js';
import { pool } from '../db.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
const router = express.Router();
router.use((req,res,next)=>{ if(!supabase) return requireSupabaseOr500(res); next(); });

router.use(authenticateUser);

const APP_USERS_DEFAULT_SELECT = 'id, email, name, role';

const normalizeAppUser = (row = {}) => ({
  id: row.id || null,
  email: row.email ?? null,
  name: row.name ?? null,
  role: row.role ?? null,
});

async function fetchAppUsersByIds(userIds = []) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return [];
  }

  let response = await supabase
    .from('app_users')
    .select(APP_USERS_DEFAULT_SELECT)
    .in('id', uniqueIds);

  if (response.error) {
    if (response.error.code === '42703') {
      const fallback = await supabase
        .from('app_users')
        .select('id, role')
        .in('id', uniqueIds);
      if (fallback.error) {
        console.error('App users fallback fetch error:', fallback.error);
        return [];
      }
      return (fallback.data || []).map(normalizeAppUser);
    }

    console.error('App users fetch error:', response.error);
    return [];
  }

  return (response.data || []).map(normalizeAppUser);
}

async function fetchAppUserById(userId) {
  if (!userId) return null;

  let response = await supabase
    .from('app_users')
    .select(APP_USERS_DEFAULT_SELECT)
    .eq('id', userId)
    .single();

  if (response.error) {
    if (response.error.code === '42703') {
      const fallback = await supabase
        .from('app_users')
        .select('id, role')
        .eq('id', userId)
        .single();
      if (fallback.error) {
        console.error('App user fallback fetch error:', fallback.error);
        return null;
      }
      return normalizeAppUser(fallback.data || {});
    }

    if (response.error.code !== 'PGRST116') {
      console.error('App user fetch error:', response.error);
    }
    return null;
  }

  return normalizeAppUser(response.data || {});
}

// Utility function to broadcast case update events for real-time dashboard sync
async function broadcastCaseUpdate(caseId, eventType, docType = null, userId = null) {
  try {
    const payload = {
      case_id: caseId,
      event_type: eventType, // 'upload_confirmed', 'upload_rejected', 'requirement_updated', etc.
      doc_type: docType,     // 'mortgage_statement', 'tax_return', etc. (optional)
      user_id: userId,       // Who triggered the change (optional)
      timestamp: new Date().toISOString()
    };

    // Broadcast to case-specific realtime channel
    const channel = supabase.channel(`case-${caseId}-updates`);
    await channel.send({
      type: 'broadcast',
      event: 'case_update',
      payload: payload
    });
    
    console.log(`📡 Broadcasted case_update event for case ${caseId}:`, payload);
  } catch (error) {
    console.error('Error broadcasting case update:', error);
  }
}

// Helper function to create notifications
async function createNotification(userId, message, type) {
  try {
    console.log(`📢 Creating notification: ${type} for user ${userId} - ${message}`);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        message: message,
        type: type
      }])
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error creating notification:', error);
      return null;
    }
    
    console.log(`✅ Notification created successfully: ID ${data.id}`);
    return data;
  } catch (err) {
    console.error('❌ Notification creation failed:', err);
    return null;
  }
}

async function filterUserIdsPresentInUsersTables(userIds = []) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const textIds = userIds.map((id) => id?.toString()).filter(Boolean);
  if (textIds.length === 0) {
    return [];
  }

  const validIds = new Set();
  let validationAttempted = false;

  const tryTable = async (qualifiedTable) => {
    try {
      const result = await pool.query(
        `SELECT id::text AS id FROM ${qualifiedTable} WHERE id::text = ANY($1::text[])`,
        [textIds]
      );
      validationAttempted = true;
      for (const row of result.rows || []) {
        if (row.id) {
          validIds.add(row.id);
        }
      }
    } catch (error) {
      validationAttempted = true;
      if (['42P01', '42703', '42501'].includes(error.code) || /does not exist/i.test(error.message)) {
        console.warn(`[uploads] Skipping ${qualifiedTable} validation: ${error.message}`);
      } else {
        console.error(`[uploads] Failed to validate mediator IDs via ${qualifiedTable}:`, error);
      }
    }
  };

  await tryTable('users');
  if (validIds.size < textIds.length) {
    await tryTable('auth.users');
  }

  if (!validationAttempted) {
    return null;
  }

  if (validIds.size === 0) {
    return [];
  }

  return userIds.filter((id) => validIds.has(id.toString()));
}

// Helper function to get all mediator user IDs
async function getMediatorUserIds() {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('id')
      .eq('role', 'mediator');

    if (error) {
      console.error('Error fetching mediator app_users:', error);
      return [];
    }

    const mediatorIds = (data || [])
      .map((row) => row.id)
      .filter(Boolean);

    if (mediatorIds.length === 0) {
      return [];
    }

    const verifiedIds = await filterUserIdsPresentInUsersTables(mediatorIds);
    if (verifiedIds === null) {
      console.warn('[uploads] Unable to verify mediator IDs against users tables; using full app_users list');
      return mediatorIds;
    }

    if (verifiedIds.length === 0) {
      console.warn('[uploads] No mediator IDs matched users/auth.users tables; skipping mediator notifications');
      return [];
    }

    if (verifiedIds.length !== mediatorIds.length) {
      const skippedCount = mediatorIds.length - verifiedIds.length;
      console.warn(`[uploads] Skipping notifications for ${skippedCount} mediator(s) missing from users/auth.users tables.`);
    }

    return verifiedIds;
  } catch (err) {
    console.error('Error in getMediatorUserIds:', err);
    return [];
  }
}

// Helper function to format document type for display
function formatDocTypeForNotification(docType) {
  const labels = {
    id_document: "ID Document",
    marriage_certificate: "Marriage Certificate", 
    bank_statement: "Bank Statement",
    proof_of_address: "Proof of Address",
    income_statement: "Income Statement",
    proof_of_income: "Proof of Income"
  };
  return labels[docType] || docType.replace(/_/g, " ");
}

// GET /api/uploads/:uploadId/versions : fetch all versions for an upload
router.get('/:uploadId/versions', async (req, res) => {
  const { uploadId } = req.params;
  try {
    // Fetch the base upload to get user_id and doc_type
    const { data: baseUpload, error: baseError } = await supabase
      .from('uploads')
      .select('user_id, doc_type')
      .eq('id', uploadId)
      .single();
      
    if (baseError || !baseUpload) {
      console.error('Supabase base upload fetch error:', baseError);
      return res.status(404).json({ error: 'Upload not found.' });
    }
    
    // Fetch all versions for that user_id/doc_type combination
    const { data: versions, error: versionsError } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', baseUpload.user_id)
      .eq('doc_type', baseUpload.doc_type)
      .order('version', { ascending: false });
      
    if (versionsError) {
      console.error('Supabase versions fetch error:', versionsError);
      return res.status(500).json({ error: versionsError.message });
    }
    
    return res.json({ versions: versions || [] });
  } catch (err) {
    console.error('Versions route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

const replaceUpload = multer({ storage: multer.memoryStorage() });
router.post('/:docType/replace', replaceUpload.single('document'), async (req, res) => {
  if (!req.user || req.user.role !== 'divorcee') return res.status(403).json({ error: 'Forbidden' });
  const userId = req.user.id;
  const docType = req.params.docType;
  try {
    // Find current row
    const { data: currentRows, error: findError } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId)
      .eq('doc_type', docType)
      .eq('current', true)
      .single();
    if (findError || !currentRows) return res.status(404).json({ error: 'No current upload found.' });

    // Set current = false for previous row
    const { error: updateError } = await supabase
      .from('uploads')
      .update({ current: false })
      .eq('id', currentRows.id);
    if (updateError) return res.status(500).json({ error: updateError.message });

    // Insert new row with incremented version
    const newVersion = (currentRows.version || 1) + 1;
    // Generate file path
    const filePath = `/uploads/${userId}/${docType}_v${newVersion}.pdf`;

    // Upload to Supabase storage
    const { data: uploadRes, error: storageError } = await supabase.storage
      .from('uploads')
      .upload(`${userId}/${docType}_v${newVersion}.pdf`, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });
    if (storageError) return res.status(500).json({ error: storageError.message });

    // Insert new row in DB
    const { data: newRows, error: insertError } = await supabase
      .from('uploads')
      .insert([
        {
          user_id: userId,
          doc_type: docType,
          file_name: req.file.originalname,
          file_path: filePath,
          privacy_tier: req.body.privacy_tier || 'Mediator-Only',
          confirmed: false,
          uploaded_at: new Date().toISOString(),
          version: newVersion,
          current: true
        }
      ])
      .select();
    if (insertError || !newRows || !newRows[0]) return res.status(500).json({ error: insertError?.message || 'Failed to insert new upload.' });

    // Insert audit record
    const { error: auditError } = await supabase
      .from('upload_audit')
      .insert([
        {
          upload_id: newRows[0].id,
          actor_id: userId,
          actor_role: 'divorcee',
          action: 'replaced',
          reason: null,
          metadata: {
            old_upload_id: currentRows.id,
            new_upload_id: newRows[0].id,
            docType,
            old_version: currentRows.version,
            new_version: newRows[0].version
          },
          created_at: new Date().toISOString()
        }
      ]);
    if (auditError) {
      console.error('Failed to insert audit record for replace operation:', auditError.message);
    }

    // Generate signed URL for preview/download
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('uploads')
      .createSignedUrl(`${userId}/${docType}_v${newVersion}.pdf`, 60 * 60); // 1 hour expiry
    if (signedUrlError) return res.status(500).json({ error: signedUrlError.message });

    res.json({ upload: { ...newRows[0], signedUrl: signedUrlData.signedUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Placeholder notification job enqueuer
function enqueueNotification({ type, userId, payload }) {
  // TODO: Integrate with notification system
  console.log('Enqueue notification:', { type, userId, payload });
}
// POST /api/uploads/:uploadId/confirm : mediator confirms an upload
router.post('/:uploadId/confirm', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'mediator') return res.status(403).json({ error: 'Forbidden' });
  const { uploadId } = req.params;
  try {
    // Fetch current upload
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .single();
    if (fetchError || !upload) return res.status(404).json({ error: 'Upload not found.' });

    // Update upload status
    const { data: updated, error: updateError } = await supabase
      .from('uploads')
      .update({
        status: 'confirmed',
        rejection_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', uploadId)
      .select();
    if (updateError || !updated || !updated[0]) return res.status(500).json({ error: updateError?.message || 'Failed to update upload.' });

    // Insert audit row
    const metadata = {
      previous_status: upload.status,
      doc_type: upload.doc_type
    };
    const { error: auditError } = await supabase
      .from('upload_audit')
      .insert([
        {
          upload_id: upload.id,
          actor_id: req.user.id,
          actor_role: req.user.role,
          action: 'confirmed',
          reason: null,
          metadata,
          created_at: new Date().toISOString()
        }
      ]);
    if (auditError) return res.status(500).json({ error: auditError.message });

    // Broadcast case update for real-time dashboard sync
    if (upload.case_id) {
      await broadcastCaseUpdate(upload.case_id, 'upload_confirmed', upload.doc_type, req.user.id);
    }

    res.json({ success: true, data: updated[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /api/uploads/:uploadId/reject : mediator rejects an upload
router.post('/:uploadId/reject', async (req, res) => {
  // Require mediator role
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'mediator') return res.status(403).json({ error: 'Forbidden' });
  const { uploadId } = req.params;
  const { reason } = req.body;
  try {
    // Fetch current upload
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .single();
    if (fetchError || !upload) return res.status(404).json({ error: 'Upload not found.' });

    // Update upload status
    const { data: updated, error: updateError } = await supabase
      .from('uploads')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', uploadId)
      .select();
    if (updateError || !updated || !updated[0]) return res.status(500).json({ error: updateError?.message || 'Failed to update upload.' });

    // Insert audit row
    const metadata = {
      previous_status: upload.status,
      doc_type: upload.doc_type
    };
    const { error: auditError } = await supabase
      .from('upload_audit')
      .insert([
        {
          upload_id: upload.id,
          actor_id: req.user.id,
          actor_role: req.user.role,
          action: 'rejected',
          reason,
          metadata,
          created_at: new Date().toISOString()
        }
      ]);
    if (auditError) return res.status(500).json({ error: auditError.message });

    // Enqueue notification job for divorcee
    enqueueNotification({
      type: 'upload_rejected',
      userId: upload.user_id,
      payload: {
        uploadId: upload.id,
        docType: upload.doc_type,
        reason
      }
    });

    // Broadcast case update for real-time dashboard sync
    if (upload.case_id) {
      await broadcastCaseUpdate(upload.case_id, 'upload_rejected', upload.doc_type, req.user.id);
    }

    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error('Reject route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads/:id/file : stream uploaded file
router.get('/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'Upload not found.' });
    }
    // Access control
    if (user.role === 'divorcee' && data.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Construct file path
    const filePath = path.resolve('uploads', String(data.user_id), `${data.doc_type}.pdf`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(400).json({ error: 'Error sending file.' });
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id;
    const docType = req.body.doc_type;
    const uploadDir = path.join('uploads', String(userId));
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const docType = req.body.doc_type;
    cb(null, `${docType}.pdf`);
  }
});
const upload = multer({ storage });
// POST /api/uploads/file : handle file upload
router.post('/file', upload.single('document'), async (req, res) => {
  console.log('POST /api/uploads/file hit');
  try {
    const userId = req.user?.id;
    const docType = req.body.doc_type;
    if (!userId || !docType || !req.file) {
      return res.status(400).json({ error: 'Missing userId, docType, or file.' });
    }
    const filePath = `/${req.file.path.replace(/\\/g, '/')}`;
    
    // Insert upload record
    console.log('Inserting upload record for user:', userId, 'docType:', docType);
    const { data: uploadData, error: uploadError } = await supabase
      .from('uploads')
      .insert([
        {
          user_id: userId,
          doc_type: docType,
          file_name: req.file.filename,
          file_path: filePath,
          privacy_tier: req.body.privacy_tier || 'Mediator-Only',
          confirmed: false,
          uploaded_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
      
    if (uploadError) {
      console.error('Upload insert error:', uploadError);
      return res.status(400).json({ error: uploadError.message });
    }
    
    console.log('Upload record created with ID:', uploadData.id);
    
    // Insert corresponding audit record
    const actorId = req.user?.id || req.body.userId;
    
    console.log('Inserting audit record for upload ID:', uploadData.id);
    const auditRecord = {
      upload_id: uploadData.id,
      action: 'uploaded',
      actor_role: 'divorcee',
      reason: null,
      metadata: { docType: docType }
    };
    
    // Add actor_id if available, otherwise let database generate UUID
    if (actorId) {
      auditRecord.actor_id = actorId;
    }
    
    const { data: auditData, error: auditError } = await supabase
      .from('upload_audit')
      .insert([auditRecord])
      .select();
      
    if (auditError) {
      console.error('Audit insert error:', auditError);
      // If audit fails, we should ideally roll back the upload
      // Since Supabase doesn't support transactions directly, we'll delete the upload
      console.log('Rolling back upload due to audit failure...');
      await supabase.from('uploads').delete().eq('id', uploadData.id);
      return res.status(500).json({ error: 'Failed to create audit trail: ' + auditError.message });
    }
    
    console.log('Audit record created successfully:', auditData);
    res.json({ success: true, data: uploadData });
  } catch (err) {
    console.error('Upload route error:', err);
    res.status(400).json({ error: err.message });
  }
});
// Access control middleware
function canListUploads(req, res, next) {
  if (req.user?.role === 'mediator') return next();
  if (req.user?.role === 'divorcee' && req.query.userId && Number(req.query.userId) === req.user.id) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

function canCreateUpload(req, res, next) {
  if (req.user?.role === 'mediator') return next();
  if (req.user?.role === 'divorcee') {
    req.body.userId = req.user.id; // force user_id
    return next();
  }
  return res.status(403).json({ error: 'Forbidden' });
}

function canConfirmUpload(req, res, next) {
  if (req.user?.role === 'mediator') return next();
  return res.status(403).json({ error: 'Forbidden' });
}
// GET /list : list uploads, optionally filtered by userId
router.get('/list', canListUploads, async (req, res) => {
  const { userId } = req.query;
  try {
    let query = supabase
      .from('uploads')
      .select('id, user_id, doc_type, confirmed, uploaded_at')
      .order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data: uploadsData, error: uploadsError } = await query;
    
    if (uploadsError) {
      return res.status(400).json({ error: uploadsError.message });
    }
    
    // Get user emails for uploads
    const userIds = [...new Set(uploadsData.map(upload => upload.user_id))].filter(Boolean);
    
    if (userIds.length > 0) {
      const usersData = await fetchAppUsersByIds(userIds);

      const uploadsWithUsers = uploadsData.map((upload) => ({
        ...upload,
        users: usersData.find((user) => user.id === upload.user_id) || null,
      }));

      return res.json({ success: true, data: uploadsWithUsers });
    }

    res.json({ success: true, data: uploadsData || [] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST / : save upload metadata
// POST / : accept { userId, docType, privacyTier, caseId }
router.post('/', canCreateUpload, async (req, res) => {
  const { userId, docType, privacyTier, caseId } = req.body;
  try {
    const storagePath = caseId
      ? `cases/${caseId}/${docType}_${Date.now()}.pdf`
      : `uploads/${userId}/${docType}_${Date.now()}.pdf`;
    const originalFilename = `${docType}.pdf`;
    
    // Check for existing uploads for this user_id + doc_type to determine version
    console.log('Checking for existing uploads for user:', userId, 'docType:', docType);
    const { data: existingUploads, error: existingError } = await supabase
      .from('uploads')
      .select('id, version')
      .eq('user_id', userId)
      .eq('doc_type', docType)
      .order('version', { ascending: false })
      .limit(1);
    
    if (existingError) {
      console.error('Error checking existing uploads:', existingError);
      return res.status(500).json({ success: false, error: existingError.message });
    }
    
    // Determine next version number
    const nextVersion = existingUploads.length > 0 ? existingUploads[0].version + 1 : 1;
    const previousUploadId = existingUploads.length > 0 ? existingUploads[0].id : null;
    
    console.log('Creating new upload version', nextVersion, 'for user:', userId, 'docType:', docType);
    
    // Insert new upload record with version
    const { data: uploadData, error: uploadError } = await supabase
      .from('uploads')
      .insert([
        {
          user_id: userId,
          doc_type: docType,
          storage_path: storagePath,
          original_filename: originalFilename,
          status: 'pending',
          confirmed: false,
          uploaded_at: new Date().toISOString(),
          version: nextVersion,
          case_id: caseId // Include case_id for proper case association
        }
      ])
      .select()
      .single();
      
    if (uploadError) {
      console.error('Upload POST error:', uploadError);
      return res.status(500).json({ success: false, error: uploadError.message });
    }
    
    console.log('Upload metadata record created with ID:', uploadData.id, 'version:', nextVersion);
    
    // Insert corresponding audit record for upload
    const actorId = req.user?.id || userId;
    
    console.log('Inserting audit record for upload ID:', uploadData.id);
    const auditRecords = [];
    
    // Add upload audit record
    auditRecords.push({
      upload_id: uploadData.id,
      action: 'uploaded',
      actor_id: actorId,
      actor_role: 'divorcee',
      reason: null,
      metadata: { docType: docType, version: nextVersion }
    });
    
    // If this is a replacement (version > 1), add replacement audit record
    if (nextVersion > 1 && previousUploadId) {
      auditRecords.push({
        upload_id: previousUploadId,
        action: 'replaced',
        actor_id: actorId,
        actor_role: 'divorcee',
        reason: null,
        metadata: { 
          oldUploadId: previousUploadId, 
          newUploadId: uploadData.id,
          oldVersion: nextVersion - 1,
          newVersion: nextVersion,
          docType: docType
        }
      });
    }
    
    const { data: auditData, error: auditError } = await supabase
      .from('upload_audit')
      .insert(auditRecords)
      .select();
      
    if (auditError) {
      console.error('Audit insert error:', auditError);
      // Roll back the upload on audit failure
      console.log('Rolling back upload due to audit failure...');
      await supabase.from('uploads').delete().eq('id', uploadData.id);
      return res.status(500).json({ success: false, error: 'Failed to create audit trail: ' + auditError.message });
    }
    
    console.log('Audit record created successfully:', auditData);
    
    // Create notifications for mediators about new upload
    const mediatorIds = await getMediatorUserIds();
    const docTypeDisplay = formatDocTypeForNotification(docType);
    const notificationMessage = `New document uploaded: ${docTypeDisplay}`;
    
    console.log(`📢 Notifying ${mediatorIds.length} mediators about new upload`);
    for (const mediatorId of mediatorIds) {
      await createNotification(mediatorId, notificationMessage, 'upload');
    }

    // Broadcast case update for real-time dashboard sync
    if (caseId) {
      await broadcastCaseUpdate(caseId, 'upload_created', docType, userId);
    }
    
    res.json({ success: true, data: uploadData });
  } catch (err) {
    console.error('Upload POST error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/uploads/history : fetch audit history for an upload
router.get("/history", async (req, res) => {
  const { uploadId } = req.query;
  console.log("Fetching history for uploadId:", uploadId);

  const id = parseInt(uploadId, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid uploadId" });
  }

  try {
    const { data, error } = await supabase
      .from("upload_audit")
      .select(`
        *,
        uploads (
          id,
          doc_type,
          user_id
        )
      `)
      .eq("upload_id", id)
      .order("created_at", { ascending: true });

    console.log("Supabase response:", { data, error });

    if (error) {
      console.error("Supabase error fetching upload history:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.json(data || []);
  } catch (err) {
    console.error("History fetch failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /:userId : fetch all uploads for that user_id
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Get uploads data
    const { data: uploadsData, error: uploadsError } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId);
      
    if (uploadsError) {
      console.error('Upload GET error:', uploadsError);
      return res.status(500).json({ success: false, error: uploadsError.message });
    }
    
    // Get user details from app_users
    const userData = await fetchAppUserById(userId);

    const uploadsWithUser = uploadsData.map((upload) => ({
      ...upload,
      users: userData,
    }));
    
    res.json({ success: true, data: uploadsWithUser || [] });
  } catch (err) {
    console.error('Upload GET error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /:userId/latest : fetch latest upload for that user_id
router.get('/:userId/latest', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error('Upload GET latest error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, data: data?.[0] || null });
  } catch (err) {
    console.error('Upload GET latest error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// PATCH /confirm/:id : confirm an upload
router.patch('/confirm/:id', canConfirmUpload, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('uploads')
      .update({ confirmed: true })
      .eq('id', id)
      .select();
    if (error || !data || data.length === 0) {
      return res.status(400).json({ error: error?.message || 'Upload not found or could not be confirmed.' });
    }
    res.json({ success: true, data: data[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/uploads/:id : update upload with mediator notes
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  try {
    // Validate notes field - should be a string if provided
    if (notes !== undefined && typeof notes !== 'string') {
      return res.status(400).json({ error: 'Notes must be a string' });
    }
    
    // Update the upload record
    const { data, error } = await supabase
      .from('uploads')
      .update({ notes: notes || null })
      .eq('id', id)
      .select();
      
    if (error || !data || data.length === 0) {
      return res.status(400).json({ error: error?.message || 'Upload not found or could not be updated.' });
    }
    
    // Create audit record for the annotation
    const actorId = req.user?.id || '00000000-0000-0000-0000-000000000000'; // Use null UUID for system actions
    const auditRecord = {
      upload_id: id,
      action: 'annotated',
      actor_role: 'mediator',
      reason: null,
      metadata: { notes: notes || null },
      actor_id: actorId
    };
    
    const { error: auditError } = await supabase
      .from('upload_audit')
      .insert([auditRecord]);
      
    if (auditError) {
      console.error('Audit insert error:', auditError);
      // Note: We don't roll back the upload update since annotation is less critical
      console.warn('Upload updated but audit trail creation failed');
    }
    
    res.json({ success: true, data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads/:uploadId/audit : fetch audit trail for an upload
router.get('/:uploadId/audit', async (req, res) => {
  const { uploadId } = req.params;
  try {
    const { data, error } = await supabase
      .from('upload_audit')
      .select('id, action, reason, actor_id, actor_role, created_at, metadata')
      .eq('upload_id', uploadId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('Supabase audit fetch error:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.json({ audit: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads : fetch all uploads (latest versions only for main view)
router.get('/', async (req, res) => {
  try {
    // Get the latest version for each user_id + doc_type combination
    // We'll use a window function approach or multiple queries since Supabase may not support complex window functions
    
    // First, get all uploads
    const { data: allUploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('*')
      .order('user_id, doc_type, version', { ascending: false });
      
    if (uploadsError) {
      console.error('Supabase uploads fetch error:', uploadsError);
      return res.status(500).json({ error: uploadsError.message });
    }
    
    // Filter to only keep the latest version for each user_id + doc_type
    const latestUploads = [];
    const seen = new Set();
    
    for (const upload of allUploads) {
      const key = `${upload.user_id}-${upload.doc_type}`;
      if (!seen.has(key)) {
        latestUploads.push(upload);
        seen.add(key);
      }
    }
    
    // Then get user emails for each unique user_id
    const userIds = [...new Set(latestUploads.map(upload => upload.user_id))].filter(Boolean);
    
    if (userIds.length > 0) {
      const usersData = await fetchAppUsersByIds(userIds);

      const uploadsWithUsers = latestUploads.map((upload) => ({
        ...upload,
        users: usersData.find((user) => user.id === upload.user_id) || null,
      }));

      return res.json({ uploads: uploadsWithUsers });
    }

    return res.json({ uploads: latestUploads || [] });
  } catch (err) {
    console.error('Uploads route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/uploads/confirm : confirm an upload
router.post('/confirm', async (req, res) => {
  try {
    const { uploadId } = req.body;
    
    if (!uploadId) {
      return res.status(400).json({ error: 'uploadId is required' });
    }

    // First get the upload to check its current state and user/doc_type
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (fetchError) {
      console.error('Error fetching upload:', fetchError);
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Check if this upload is already confirmed
    if (upload.status === 'confirmed') {
      return res.json({ data: upload, message: 'Upload already confirmed' });
    }

    // Check if there's already a confirmed upload for this user and doc_type
    // If so, first unconfirm it (set status to 'pending')
    const { error: unconfirmError } = await supabase
      .from('uploads')
      .update({ status: 'pending', confirmed: false })
      .eq('user_id', upload.user_id)
      .eq('doc_type', upload.doc_type)
      .eq('status', 'confirmed');

    if (unconfirmError) {
      console.error('Error unconfirming previous upload:', unconfirmError);
      // Continue anyway - this might not be a critical error
    }

    // Now update this upload to confirmed
    const { data: updatedUpload, error: updateError } = await supabase
      .from('uploads')
      .update({
        status: 'confirmed',
        confirmed: true
      })
      .eq('id', uploadId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase confirm update error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // Insert audit record
    const actorId = req.user?.id; // Don't fallback to 'system' string
    const auditRecord = {
      upload_id: uploadId,
      action: 'confirmed',
      actor_role: 'mediator'
    };
    
    // Only add actor_id if we have a valid UUID
    if (actorId) {
      auditRecord.actor_id = actorId;
    }

    const { error: auditError } = await supabase
      .from('upload_audit')
      .insert(auditRecord);

    if (auditError) {
      console.error('Supabase audit insert error:', auditError);
      // Don't fail the request for audit errors, just log
    }

    // Create notification for the divorcee about confirmation
    const docTypeDisplay = formatDocTypeForNotification(upload.doc_type);
    const confirmMessage = `Your ${docTypeDisplay} has been confirmed.`;
    await createNotification(upload.user_id, confirmMessage, 'confirm');

    return res.json({ data: updatedUpload });
  } catch (err) {
    console.error('Confirm route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/uploads/reject : reject an upload
router.post('/reject', async (req, res) => {
  try {
    const { uploadId, reason } = req.body;
    
    if (!uploadId || !reason) {
      return res.status(400).json({ error: 'uploadId and reason are required' });
    }

    // First get the upload to know doc_type and user_id for notification
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (fetchError) {
      console.error('Error fetching upload for rejection:', fetchError);
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Update uploads row
    const { data: updatedUpload, error: updateError } = await supabase
      .from('uploads')
      .update({
        status: 'rejected',
        rejection_reason: reason
      })
      .eq('id', uploadId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase reject update error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // Insert audit record
    const actorId = req.user?.id; // Don't fallback to 'system' string
    const auditRecord = {
      upload_id: uploadId,
      action: 'rejected',
      reason: reason,
      actor_role: 'mediator'
    };
    
    // Only add actor_id if we have a valid UUID
    if (actorId) {
      auditRecord.actor_id = actorId;
    }

    const { error: auditError } = await supabase
      .from('upload_audit')
      .insert(auditRecord);

    if (auditError) {
      console.error('Supabase audit insert error:', auditError);
      // Don't fail the request for audit errors, just log
    }

    // Create notification for the divorcee about rejection
    const docTypeDisplay = formatDocTypeForNotification(upload.doc_type);
    const rejectMessage = `Your ${docTypeDisplay} has been rejected. Reason: ${reason}`;
    await createNotification(upload.user_id, rejectMessage, 'reject');

    return res.json({ data: updatedUpload });
  } catch (err) {
    console.error('Reject route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', canConfirmUpload, async (req, res) => {
  const { id } = req.params;

  try {
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !upload) {
      console.error('Supabase upload fetch error (delete):', fetchError);
      return res.status(404).json({ error: 'Upload not found.' });
    }

    const { error: auditDeleteError } = await supabase
      .from('upload_audit')
      .delete()
      .eq('upload_id', id);

    if (auditDeleteError) {
      console.error('Supabase audit delete error:', auditDeleteError);
      return res.status(500).json({ error: auditDeleteError.message });
    }

    const { error: deleteError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase upload delete error:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    if (upload.case_id) {
      await broadcastCaseUpdate(upload.case_id, 'upload_deleted', upload.doc_type, req.user?.id || null);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
