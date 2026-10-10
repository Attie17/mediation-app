import express from 'express';
import caseParticipantsRouter from './caseParticipants.js';
import { supabase, requireSupabaseOr500 } from '../lib/supabaseClient.js';
import { pool } from '../db.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { withTransaction } from '../utils/tx.js';

async function verifiedPracticeAdmin(db, req, caseId) {
  const { rows } = await db.query(`SELECT c.id FROM cases c JOIN app_users u
    ON COALESCE(to_jsonb(u)->>'user_id',to_jsonb(u)->>'id')=$2
    WHERE c.id::text=$1 AND to_jsonb(u)->>'role'='admin'
      AND to_jsonb(u)->>'organization_id'=to_jsonb(c)->>'organization_id'
    FOR UPDATE OF c,u`, [caseId,req.user?.id]);
  return rows.length === 1;
}

const router = express.Router();
// Ensure supabase client exists for all downstream handlers
router.use((req, res, next) => {
  if (!supabase) return requireSupabaseOr500(res);
  next();
});
const inviteAliasRouter = express.Router({ mergeParams: true });

// Admin-only: Close case
router.patch('/:id/close', async (req, res) => {
  // Require admin role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  const caseId = req.params.id;
  if (!/^[0-9a-fA-F-]{36}$/.test(caseId)) return res.status(400).json({ error: 'Invalid case ID' });

  // Check for final report in case_notes
  const { data: report, error: reportErr } = await supabase
    .from('case_notes')
    .select('id')
    .eq('case_id', caseId)
    .eq('type', 'final_report')
    .single();
  if (reportErr || !report) {
    return res.status(400).json({ error: 'Final report required before closing.' });
  }
  // Update case status and closed_at
  const { error: caseErr } = await supabase
    .from('cases')
    .update({ status: 'completed', closed_at: new Date().toISOString() })
    .eq('id', caseId);
  if (caseErr) {
    return res.status(500).json({ error: 'Failed to close case.' });
  }
  // Update all participants to removed
  const { error: partErr } = await supabase
    .from('case_participants')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('case_id', caseId);
  if (partErr) {
    return res.status(500).json({ error: 'Failed to update participants.' });
  }
  res.json({ success: true, caseId, closedAt: new Date().toISOString() });
});

// Admin-only: Reopen case
router.patch('/:id/reopen', authenticateUser, async (req, res) => {
  const caseId = req.params.id;
  if (!/^[0-9a-fA-F-]{36}$/.test(caseId)) return res.status(400).json({ error: 'Invalid case ID' });
  try {
    await withTransaction(pool, async client => {
      if (!await verifiedPracticeAdmin(client, req, caseId))
        throw Object.assign(new Error('Admin access required'), { status:403 });
      await client.query("UPDATE cases SET status='active',closed_at=NULL WHERE id=$1", [caseId]);
    });
  } catch (error) {
    return res.status(error.status || 503).json({ error: 'Case reopening unavailable' });
  }
  // Reopening does not restore revoked membership. Re-activation is explicit.
  res.json({ success: true, caseId, reopenedAt: new Date().toISOString() });
});



inviteAliasRouter.post('/', (req, res, next) => {
  const originalUrl = req.url;
  const originalBaseUrl = req.baseUrl;
  const caseId = req.params?.id;

  req.url = '/invite';
  req.baseUrl = `${originalBaseUrl.replace(/\/invite$/, '')}/participants`;

  const restore = () => {
    req.url = originalUrl;
    req.baseUrl = originalBaseUrl;
  };

  res.once('finish', restore);
  res.once('close', restore);

  caseParticipantsRouter(req, res, (err) => {
    res.removeListener('finish', restore);
    res.removeListener('close', restore);
    restore();
    if (err) {
      next(err);
    }
  });
});



// PUT /api/cases/:caseId - Mediator-only updates
router.put('/:caseId', async (req, res) => {
  const { caseId } = req.params;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User authentication required.' });
    }
    // Fetch case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
    if (caseError || !caseData) {
      if (caseError?.code === 'PGRST116' || caseError?.message?.includes('No rows')) {
        return res.status(404).json({ error: 'Case not found' });
      }
      console.error('❌ Error fetching case:', caseError);
      return res.status(500).json({ error: 'Failed to fetch case.' });
    }
    // Access control: only mediator can update
    if (caseData.mediator_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: only mediator can update case.' });
    }
    const { status, mediator_id, requirements = [] } = req.body;
    // 1. Update case status if provided
    const allowedStatuses = ['open', 'in_progress', 'closed', 'archived'];
    const validTransitions = {
      open: ['in_progress'],
      in_progress: ['closed'],
      closed: ['archived'],
      archived: ['closed']
    };
    if (status && allowedStatuses.includes(status)) {
      // Only allow valid transitions
      const currentStatus = caseData.status;
      if (status !== currentStatus) {
        const allowedNext = validTransitions[currentStatus] || [];
        if (!allowedNext.includes(status)) {
          return res.status(400).json({ error: 'Invalid status transition' });
        }
      }
      const { error: statusErr } = await supabase
        .from('cases')
        .update({ status })
        .eq('id', caseId);
      if (statusErr) {
        console.error('❌ Error updating case status:', statusErr);
        return res.status(500).json({ error: 'Failed to update case status.' });
      }
    }
    // 2. Update mediator_id if provided
    if (mediator_id && mediator_id !== caseData.mediator_id) {
      // Check user exists and is a mediator
      const { data: mediatorUser, error: medErr } = await supabase
        .from('app_users')
        .select('user_id, role')
        .eq('user_id', mediator_id)
        .eq('role', 'mediator')
        .single();
      if (medErr || !mediatorUser) {
        return res.status(400).json({ error: 'Mediator not found or not a mediator.' });
      }
      const { error: medUpdateErr } = await supabase
        .from('cases')
        .update({ mediator_id })
        .eq('id', caseId);
      if (medUpdateErr) {
        console.error('❌ Error updating mediator_id:', medUpdateErr);
        return res.status(500).json({ error: 'Failed to update mediator.' });
      }
    }
    // 3. Requirements update
    for (const req of requirements) {
      if (req.deleted && req.id) {
        // Delete
        const { error: delErr } = await supabase
          .from('case_requirements')
          .delete()
          .eq('id', req.id);
        if (delErr) {
          console.error('❌ Error deleting requirement:', delErr);
          return res.status(500).json({ error: 'Failed to delete requirement.' });
        }
      } else if (req.id) {
        // Update
        const { error: updErr } = await supabase
          .from('case_requirements')
          .update(req)
          .eq('id', req.id);
        if (updErr) {
          console.error('❌ Error updating requirement:', updErr);
          return res.status(500).json({ error: 'Failed to update requirement.' });
        }
      } else if (!req.id && !req.deleted) {
        // Insert
        const { error: insErr } = await supabase
          .from('case_requirements')
          .insert({ ...req, case_id: caseId });
        if (insErr) {
          console.error('❌ Error inserting requirement:', insErr);
          return res.status(500).json({ error: 'Failed to add requirement.' });
        }
      }
    }
    // Fetch updated case and requirements
    const { data: updatedCase } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
    const { data: updatedReqs } = await supabase
      .from('case_requirements')
      .select('*')
      .eq('case_id', caseId);
    res.json({
      case_id: updatedCase.id,
      status: updatedCase.status,
      mediator_id: updatedCase.mediator_id,
      requirements: updatedReqs || []
    });
  } catch (err) {
    console.error('❌ Error in case update:', err);
    res.status(500).json({ error: 'Internal server error while updating case.' });
  }
});




// GET ROUTES

// GET /api/cases/user/:userId - Get all cases for a specific user
router.get('/user/:userId', async (req, res) => {
  console.log('📋 GET /api/cases/user/:userId - Fetching user cases');
  try {
    const { userId } = req.params;
    const { role } = req.query; // Optional filter by role (mediator, divorcee, etc.)

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Helper function to enrich cases with participant surnames
    const enrichCasesWithSurnames = async (casesToEnrich) => {
      return await Promise.all(casesToEnrich.map(async (caseItem) => {
        console.log(`🔍 Processing case ${caseItem.id}, title: "${caseItem.title}"`);
        
        // Get participants for this case (exclude mediator - only get divorcees)
        const { data: caseParticipants, error: cpError } = await supabase
          .from('case_participants')
          .select('user_id, role')
          .eq('case_id', caseItem.id)
          .eq('role', 'divorcee');

        console.log(`  👥 Found ${caseParticipants?.length || 0} divorcee participants`);
        
        if (cpError) {
          console.log(`  ❌ Error fetching participants:`, cpError);
          return { ...caseItem, couple_name: caseItem.title || 'Untitled Case' };
        }
        
        if (!caseParticipants || caseParticipants.length === 0) {
          console.log(`  ⚠️ No divorcee participants found, using title`);
          return { ...caseItem, couple_name: caseItem.title || 'Untitled Case' };
        }

        // Get user details for participants
        const participantIds = caseParticipants.map(cp => cp.user_id);
        console.log(`  🔍 Searching for user IDs:`, participantIds);
        
        const { data: users, error: usersError } = await supabase
          .from('app_users')
          .select('name')
          .in('user_id', participantIds);

        console.log(`  👤 Found ${users?.length || 0} users with names:`, users?.map(u => u.name));
        console.log(`  🔍 Users query error:`, usersError);
        
        if (usersError) {
          console.log(`  ❌ Error fetching users:`, usersError);
          return { ...caseItem, couple_name: caseItem.title || 'Untitled Case' };
        }
        
        if (!users || users.length === 0) {
          console.log(`  ⚠️ No users found, using title`);
          return { ...caseItem, couple_name: caseItem.title || 'Untitled Case' };
        }

        // Extract surnames (last word of name)
        const surnames = users
          .map(u => u.name?.trim().split(' ').pop())
          .filter(Boolean);

        console.log(`  📛 Extracted surnames:`, surnames);

        // Format couple name
        let coupleName;
        if (surnames.length === 0) {
          coupleName = caseItem.title || 'Untitled Case';
        } else if (surnames.length === 1) {
          coupleName = surnames[0];
        } else {
          coupleName = surnames.join(' & ');
        }

        console.log(`  ✅ Final couple_name: "${coupleName}"`);
        return { ...caseItem, couple_name: coupleName };
      }));
    };

    // If role=mediator is specified, get cases where user is the mediator
    if (role === 'mediator') {
      console.log(`🎯 Filtering for mediator cases only. mediator_id: ${userId}`);
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .eq('mediator_id', userId)
        .order('created_at', { ascending: false });

      console.log(`📊 Found ${cases?.length || 0} cases for mediator ${userId}`);
      
      if (casesError) {
        console.error('❌ Error fetching mediator cases:', casesError);
        return res.status(500).json({ error: 'Failed to fetch mediator cases' });
      }

      // Enrich cases with participant surnames
      const enrichedCases = await enrichCasesWithSurnames(cases || []);
      return res.json({ cases: enrichedCases });
    }

    // Default behavior: Get all cases where user is a participant
    const { data: participants, error: participantsError } = await supabase
      .from('case_participants')
      .select('case_id')
      .eq('user_id', userId);

    if (participantsError) {
      console.error('❌ Error fetching user cases:', participantsError);
      return res.status(500).json({ error: 'Failed to fetch user cases' });
    }

    if (!participants || participants.length === 0) {
      return res.json({ cases: [] });
    }

    // Get case details for all case IDs
    const caseIds = participants.map(p => p.case_id);
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .in('id', caseIds)
      .order('created_at', { ascending: false });

    if (casesError) {
      console.error('❌ Error fetching case details:', casesError);
      return res.status(500).json({ error: 'Failed to fetch case details' });
    }

    // Enrich cases with participant surnames (use the helper function already defined above)
    const enrichedCases = await enrichCasesWithSurnames(cases);

    console.log(`✅ Found ${enrichedCases?.length || 0} cases for user ${userId}`);
    return res.json({ cases: enrichedCases || [] });

  } catch (err) {
    console.error('❌ Error in GET /api/cases/user/:userId:', err);
    return res.status(500).json({ error: 'Failed to fetch user cases (server error)' });
  }
});

// POST ROUTES FIRST - Must be before parameterized routes to avoid conflicts
// POST / - Create a new case with seeded requirements
// POST /api/cases - Full Divorcee Intake Integration
router.post('/', authenticateUser, async (req, res) => {
  console.log('🆕 POST /api/cases - Creating new case (intake, v4, uses req.user.id)');
  try {
    // Accept new payload structure
    const {
      title = 'Untitled Case',
      description = '',
      personalInfo = {},
      marriageDetails = {},
      children = [],
      financialSituation = {},
      uploads = [],
      preferences = {},
      status = 'open'
    } = req.body;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User authentication required.' });
    }
    const userId = req.user.id;
    const profile = await pool.query(`SELECT to_jsonb(u)->>'organization_id' AS organization_id
      FROM app_users u JOIN auth.users a
        ON a.id::text=COALESCE(to_jsonb(u)->>'user_id',to_jsonb(u)->>'id')
      WHERE a.id::text=$1 AND a.email_confirmed_at IS NOT NULL
        AND to_jsonb(u)->>'role'='divorcee'`, [userId]);
    const organizationId = profile.rows[0]?.organization_id;
    if (!organizationId) return res.status(403).json({ error: 'Verified identity and practice membership required' });
    // Validate required personal info
    if (!personalInfo.name || !personalInfo.dateOfBirth || !personalInfo.email || !personalInfo.phone || !personalInfo.address) {
      return res.status(400).json({ error: 'Missing required personal info.' });
    }
    // Persist the case and its explicit membership together, or neither.
    const caseInsert = await withTransaction(pool, async client => {
      const verified = await client.query(`SELECT to_jsonb(u)->>'organization_id' AS organization_id
        FROM app_users u JOIN auth.users a
          ON a.id::text=COALESCE(to_jsonb(u)->>'user_id',to_jsonb(u)->>'id')
        WHERE a.id::text=$1 AND a.email_confirmed_at IS NOT NULL
          AND lower(a.email)=lower(u.email) AND to_jsonb(u)->>'role'='divorcee'
        FOR SHARE OF u,a`, [userId]);
      const practice = verified.rows[0]?.organization_id;
      if (!practice) throw Object.assign(new Error('Verified practice membership required'), { status:403 });
      const inserted = await client.query(`INSERT INTO cases(title,description,status,mediator_id,organization_id)
        VALUES($1,$2,$3,NULL,$4) RETURNING *`, [title,description,status,practice]);
      await client.query(`INSERT INTO case_participants(case_id,user_id,role,status)
        VALUES($1,$2,'divorcee','invited')`, [inserted.rows[0].id,userId]);
      return inserted.rows[0];
    });
    const case_id = caseInsert.id;
    // 2. Seed requirements from requirement_templates (Default Divorce)
    const { data: templates, error: templateError } = await supabase
      .from('requirement_templates')
      .select('doc_type, required')
      .eq('template_name', 'Default Divorce');
    if (templateError) {
      console.error('❌ Error fetching requirement templates:', templateError);
      return res.status(500).json({ error: 'Failed to seed requirements.' });
    }
    if (templates && templates.length > 0) {
      const reqRows = templates.map(t => ({ case_id, doc_type: t.doc_type, required: t.required }));
      const { error: reqSeedError } = await supabase.from('case_requirements').insert(reqRows);
      if (reqSeedError) {
        console.error('❌ Error seeding requirements:', reqSeedError);
      }
    }
    // 3. Initial membership was committed atomically with the case above.
    // 4. Add children
    let childrenRows = [];
    if (Array.isArray(children) && children.length > 0) {
      const { randomUUID } = await import('crypto');
      childrenRows = children.map(child => ({
        id: randomUUID(),
        case_id,
        name: child.name,
        birthdate: child.birthdate,
        notes: child.notes || ''
      }));
      const { error: childError } = await supabase.from('case_children').insert(childrenRows);
      if (childError) {
        console.error('❌ Error inserting children:', childError);
      }
    }
    // 5. Auto-link all uploads for this user with case_id IS NULL
    const { error: uploadLinkError } = await supabase
      .from('uploads')
      .update({ case_id })
      .eq('user_id', userId)
      .is('case_id', null);
    if (uploadLinkError) {
      console.error('❌ Error auto-linking uploads:', uploadLinkError);
    }

    // 6. Auto-create conversations for the case
    try {
      console.log('💬 Creating conversations for new case...');
      
      // Get all participants for the case
      const { data: caseParticipants } = await supabase
        .from('case_participants')
        .select('user_id, role')
        .eq('case_id', case_id);

      const divorcees = caseParticipants?.filter(p => p.role === 'divorcee') || [];
      const mediators = caseParticipants?.filter(p => p.role === 'mediator') || [];

      const conversationsToCreate = [];

      // Create group conversation if we have at least 2 participants
      if (caseParticipants && caseParticipants.length >= 2) {
        conversationsToCreate.push({
          type: 'group',
          title: 'All Participants',
          participant_ids: caseParticipants.map(p => p.user_id)
        });
      }

      // Create private conversations between divorcees and mediator
      if (mediators.length > 0) {
        const mediator = mediators[0];
        for (const divorcee of divorcees) {
          conversationsToCreate.push({
            type: 'divorcee_to_mediator',
            title: 'Private Conversation',
            participant_ids: [divorcee.user_id, mediator.user_id]
          });
        }
      }

      // Create private conversation between divorcees (if there are 2)
      if (divorcees.length === 2) {
        conversationsToCreate.push({
          type: 'divorcee_to_divorcee',
          title: 'Private Discussion',
          participant_ids: [divorcees[0].user_id, divorcees[1].user_id]
        });
      }

      // Insert conversations
      for (const conv of conversationsToCreate) {
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .insert({
            case_id,
            conversation_type: conv.type,
            title: conv.title
          })
          .select('id')
          .single();

        if (convError) {
          console.error(`❌ Error creating ${conv.type} conversation:`, convError);
          continue;
        }

        // Add participants to conversation
        const participantRows = conv.participant_ids.map(uid => ({
          conversation_id: convData.id,
          user_id: uid
        }));

        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert(participantRows);

        if (partError) {
          console.error(`❌ Error adding participants to ${conv.type} conversation:`, partError);
        } else {
          console.log(`   ✅ Created ${conv.type} conversation with ${conv.participant_ids.length} participants`);
        }
      }

      console.log(`💬 Created ${conversationsToCreate.length} conversations for case`);
    } catch (convErr) {
      console.error('❌ Error creating conversations:', convErr);
      // Don't fail the case creation if conversation creation fails
    }

    // 7. Fetch all for response
    const { data: participants } = await supabase
      .from('case_participants')
      .select('*')
      .eq('case_id', case_id);
    const { data: childrenOut } = await supabase
      .from('case_children')
      .select('*')
      .eq('case_id', case_id);
    const { data: requirements } = await supabase
      .from('case_requirements')
      .select('*')
      .eq('case_id', case_id);
    const { data: uploadsOut } = await supabase
      .from('uploads')
      .select('*')
      .eq('case_id', case_id);
    
    // 8. Respond
    res.status(201).json({
      case_id,
      status: caseInsert.status,
      participants: participants || [],
      children: childrenOut || [],
      requirements: requirements || [],
      uploads: uploadsOut || []
    });
  } catch (err) {
    console.error('❌ Error creating case:', err);
    res.status(err.status || (['42703','42P01'].includes(err.code) ? 503 : 500))
      .json({ error: 'Case creation unavailable.' });
  }
});

// Simple test POST route
router.post('/test', (req, res) => {
  console.log('📋 TEST POST route hit');
  res.json({ message: 'POST route working', body: req.body });
});

// Legacy invite alias: POST /api/cases/:id/invite
router.use('/:id/invite', inviteAliasRouter);

// Mount participant management router under /:id/participants
router.use('/:id/participants', caseParticipantsRouter);

// Utility function to broadcast case update events for real-time dashboard sync
async function broadcastCaseUpdate(caseId, eventType, docType = null, userId = null) {
  try {
    const payload = {
      case_id: caseId,
      event_type: eventType, // 'upload_confirmed', 'upload_rejected', 'requirement_updated', 'participant_added', etc.
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


/*
// LEGACY DASHBOARD CODE - REPLACED WITH fn_case_dashboard RPC CALL
// The following complex manual data assembly logic has been replaced
// with a single Supabase stored function call for better performance
// and maintainability. Keep commented for reference if needed.
*/

// Helper function to create notifications for users in a case
async function notifyUsersOfRequirementChange(caseId, docType, action, required = null) {
  try {
    console.log(`🔔 Creating notifications for case ${caseId} requirement change: ${docType} ${action}`);
    
    // Find all users associated with this case through uploads
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('user_id')
      .eq('case_id', caseId);
    
    if (uploadsError) {
      console.error('Error fetching case uploads for notifications:', uploadsError);
      return;
    }
    
    // Get unique user IDs
    const userIds = [...new Set(uploads?.map(upload => upload.user_id) || [])];
    
    if (userIds.length === 0) {
      console.log('📭 No users found associated with this case');
      return;
    }
    
    // For now, notify all users associated with the case
    // In a real app, you'd filter by role, but since role column doesn't exist,
    // we'll assume all users associated with case uploads are divorcees
    console.log(`� Found ${userIds.length} users associated with case ${caseId}`);
    
    // Create notification message
    let message;
    if (action === 'created' || action === 'updated') {
      const status = required ? 'required' : 'optional';
      message = `Mediator updated case requirements: ${docType.replace(/_/g, ' ')} set to ${status}`;
    } else if (action === 'deleted') {
      message = `Mediator updated case requirements: ${docType.replace(/_/g, ' ')} requirement removed`;
    }
    
    // Create notifications for all users
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: 'upload', // Using 'upload' as it's a valid type in the check constraint
      message: message,
      read: false
    }));
    
    const { data: createdNotifications, error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();
      
    if (notificationError) {
      console.error('Error creating notifications:', notificationError);
      return;
    }
    
    console.log(`🔔 Created ${createdNotifications?.length || 0} notifications for users in case ${caseId}`);
    
  } catch (err) {
    console.error('Error in notifyUsersOfRequirementChange:', err);
  }
}

// GET /api/cases/:id/uploads - fetch uploads for a specific case with audit history
router.get('/:id/uploads', async (req, res) => {
  try {
    const { id: caseId } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(caseId)) {
      return res.status(400).json({ error: 'Invalid case ID format' });
    }

    console.log(`📂 Fetching uploads for case ID: ${caseId}`);
    
    // First try with upload_audit join - use case_uuid for UUID format case IDs
    let uploads;
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select(`
          *,
          upload_audit (*)
        `)
        .eq('case_uuid', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      uploads = (data || []).map(upload => ({
        ...upload,
        audit_history: upload.upload_audit || []
      }));
      
    } catch (auditError) {
      // Fallback: fetch uploads without audit history
      console.warn('upload_audit table not available, fetching without audit:', auditError.message);
      
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('case_uuid', caseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching case uploads:', error);
        return res.status(500).json({ error: error.message });
      }
      
      uploads = (data || []).map(upload => ({
        ...upload,
        audit_history: []
      }));
    }

    console.log(`📂 Found ${uploads?.length || 0} uploads for case ${caseId}`);

    return res.json({ 
      caseId,
      uploads 
    });
    
  } catch (err) {
    console.error('Cases uploads route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/cases/:id - fetch case details (basic endpoint for future use)
router.get('/:id', async (req, res) => {
  try {
    const { id: caseId } = req.params;
    
    // Validate caseId is an integer
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt) || caseIdInt <= 0) {
      return res.status(400).json({ 
        error: 'Invalid case ID. Must be a positive integer.' 
      });
    }

    console.log(`📋 Fetching case details for ID: ${caseIdInt}`);
    
    // Query case details
    const { data: caseData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseIdInt)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Case not found' });
      }
      console.error('Error fetching case:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`📋 Found case: ${caseData.id}`);
    return res.json({ case: caseData });
    
  } catch (err) {
    console.error('Cases route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Case Requirements Section

// GET /api/cases/:id/requirements - fetch all requirements for a case
router.get('/:id/requirements', async (req, res) => {
  try {
    const { id: caseId } = req.params;
    
    // Validate caseId is an integer
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt) || caseIdInt <= 0) {
      return res.status(400).json({ 
        error: 'Invalid case ID. Must be a positive integer.' 
      });
    }

    console.log(`📋 Fetching requirements for case ID: ${caseIdInt}`);
    
    // Query case requirements
    const { data: requirements, error } = await supabase
      .from('case_requirements')
      .select('*')
      .eq('case_id', caseIdInt)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching case requirements:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`📋 Found ${requirements?.length || 0} requirements for case ${caseIdInt}`);
    
    return res.json({ 
      caseId: caseIdInt,
      requirements: requirements || []
    });
    
  } catch (err) {
    console.error('Cases requirements route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/cases/:id/requirements - create or update a requirement for a case
router.post('/:id/requirements', async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const { doc_type, required } = req.body;
    
    // Validate caseId is an integer
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt) || caseIdInt <= 0) {
      return res.status(400).json({ 
        error: 'Invalid case ID. Must be a positive integer.' 
      });
    }

    // Validate required fields
    if (!doc_type || typeof doc_type !== 'string') {
      return res.status(400).json({ 
        error: 'doc_type is required and must be a string.' 
      });
    }

    if (typeof required !== 'boolean') {
      return res.status(400).json({ 
        error: 'required must be a boolean value.' 
      });
    }

    console.log(`📋 Creating/updating requirement for case ${caseIdInt}, doc_type: ${doc_type}, required: ${required}`);
    
    // Check if requirement already exists to determine if this is create or update
    const { data: existingRequirement } = await supabase
      .from('case_requirements')
      .select('*')
      .eq('case_id', caseIdInt)
      .eq('doc_type', doc_type)
      .single();
    
    const isUpdate = !!existingRequirement;
    const action = isUpdate ? 'updated' : 'created';
    
    // Use upsert to handle conflict (case_id, doc_type)
    const { data: requirement, error } = await supabase
      .from('case_requirements')
      .upsert({
        case_id: caseIdInt,
        doc_type: doc_type,
        required: required
      }, {
        onConflict: 'case_id,doc_type'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating case requirement:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`📋 Successfully ${action} requirement: ${requirement.id}`);
    
    // Create notifications for users
    await notifyUsersOfRequirementChange(caseIdInt, doc_type, action, required);
    
    // Broadcast case update for real-time dashboard sync
    await broadcastCaseUpdate(caseIdInt, 'requirement_updated', doc_type);
    
    return res.json({ 
      success: true,
      requirement: requirement
    });
    
  } catch (err) {
    console.error('Cases requirements POST route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cases/:id - Not allowed (no hard delete)
router.delete('/:id', (req, res) => {
  res.status(405).json({ error: 'Hard delete of cases is not allowed.' });
});

// DELETE /api/cases/:id/requirements/:docType - delete a requirement for a case
router.delete('/:id/requirements/:docType', async (req, res) => {
  try {
    const { id: caseId, docType } = req.params;
    
    // Validate caseId is an integer
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt) || caseIdInt <= 0) {
      return res.status(400).json({ 
        error: 'Invalid case ID. Must be a positive integer.' 
      });
    }

    // Validate docType
    if (!docType || typeof docType !== 'string') {
      return res.status(400).json({ 
        error: 'docType is required and must be a string.' 
      });
    }

    console.log(`📋 Deleting requirement for case ${caseIdInt}, doc_type: ${docType}`);
    
    // Delete the requirement
    const { data, error } = await supabase
      .from('case_requirements')
      .delete()
      .eq('case_id', caseIdInt)
      .eq('doc_type', docType)
      .select();

    if (error) {
      console.error('Error deleting case requirement:', error);
      return res.status(500).json({ error: error.message });
    }

    // Check if any rows were deleted
    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: 'Requirement not found for this case and document type.' 
      });
    }

    console.log(`📋 Successfully deleted requirement for case ${caseIdInt}, doc_type: ${docType}`);
    
    // Create notifications for users
    await notifyUsersOfRequirementChange(caseIdInt, docType, 'deleted');
    
    // Broadcast case update for real-time dashboard sync
    await broadcastCaseUpdate(caseIdInt, 'requirement_deleted', docType);
    
    return res.json({ 
      success: true,
      message: `Requirement for ${docType} has been removed from case ${caseIdInt}.`,
      deleted: data[0]
    });
    
  } catch (err) {
    console.error('Cases requirements DELETE route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ================================
// CHILDREN & VOICE OF CHILD ENDPOINTS
// ================================

// Helper function to validate mediator role
const validateMediatorRole = (req, res, next) => {
  // TODO: In production, get role from JWT token or session
  // For now, we'll accept any request (assuming mediator role)
  // if (!req.user || req.user.role !== 'mediator') {
  //   return res.status(403).json({ error: 'Only mediators can manage children records.' });
  // }
  next();
};

// GET /api/cases/:caseId/children - Get all children for a case
router.get('/:caseId/children', validateMediatorRole, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Validate caseId
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt) || caseIdInt <= 0) {
      return res.status(400).json({ 
        error: 'Invalid case ID. Must be a positive integer.' 
      });
    }

    console.log(`👶 Fetching children for case ID: ${caseIdInt}`);
    
    // Query children for this case
    const { data: children, error } = await supabase
      .from('case_children')
      .select('*')
      .eq('case_id', caseIdInt)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching case children:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`👶 Found ${children?.length || 0} children for case ${caseIdInt}`);
    
    return res.json({ 
      success: true,
      children: children || []
    });
    
  } catch (err) {
    console.error('Cases children GET route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/cases/:caseId/children - Add a child to a case
router.post('/:caseId/children', validateMediatorRole, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { name, birthdate, notes } = req.body;
    
    // Validate caseId
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt) || caseIdInt <= 0) {
      return res.status(400).json({ 
        error: 'Invalid case ID. Must be a positive integer.' 
      });
    }

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        error: 'name is required and must be a non-empty string.' 
      });
    }

    // Validate birthdate if provided
    if (birthdate && isNaN(Date.parse(birthdate))) {
      return res.status(400).json({ 
        error: 'birthdate must be a valid date.' 
      });
    }

    console.log(`👶 Adding child to case ${caseIdInt}: ${name}`);
    
    // Insert child record
    const { data: child, error } = await supabase
      .from('case_children')
      .insert({
        case_id: caseIdInt,
        name: name.trim(),
        birthdate: birthdate || null,
        notes: notes ? notes.trim() : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding case child:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`👶 Successfully added child: ${child.id}`);
    
    // Broadcast case update for real-time dashboard sync
    await broadcastCaseUpdate(caseIdInt, 'child_added', null, null);
    
    return res.json({ 
      success: true,
      child: child
    });
    
  } catch (err) {
    console.error('Cases children POST route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/cases/:caseId/children/:childId/voice - Get voice-of-child entries for a specific child
router.get('/:caseId/children/:childId/voice', validateMediatorRole, async (req, res) => {
  try {
    const { caseId, childId } = req.params;
    
    // Validate caseId
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt) || caseIdInt <= 0) {
      return res.status(400).json({ 
        error: 'Invalid case ID. Must be a positive integer.' 
      });
    }

    // Validate childId (UUID format)
    if (!childId || childId.length !== 36) {
      return res.status(400).json({ 
        error: 'Invalid child ID format.' 
      });
    }

    console.log(`🗣️ Fetching voice entries for child ${childId} in case ${caseIdInt}`);
    
    // Query voice-of-child entries
    const { data: voiceEntries, error } = await supabase
      .from('voice_of_child')
      .select('*')
      .eq('case_id', caseIdInt)
      .eq('child_id', childId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching voice entries:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`🗣️ Found ${voiceEntries?.length || 0} voice entries for child ${childId}`);
    
    return res.json({ 
      success: true,
      voiceEntries: voiceEntries || []
    });
    
  } catch (err) {
    console.error('Voice entries GET route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/cases/:caseId/children/:childId/voice - Add a voice-of-child entry
router.post('/:caseId/children/:childId/voice', validateMediatorRole, async (req, res) => {
  try {
    const { caseId, childId } = req.params;
    const { type, content } = req.body;
    
    // Validate caseId
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt) || caseIdInt <= 0) {
      return res.status(400).json({ 
        error: 'Invalid case ID. Must be a positive integer.' 
      });
    }

    // Validate childId (UUID format)
    if (!childId || childId.length !== 36) {
      return res.status(400).json({ 
        error: 'Invalid child ID format.' 
      });
    }

    // Validate required fields
    if (!type || !['report', 'drawing', 'interview', 'observation', 'other'].includes(type)) {
      return res.status(400).json({ 
        error: 'type is required and must be one of: report, drawing, interview, observation, other.' 
      });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'content is required and must be a non-empty string.' 
      });
    }

    console.log(`🗣️ Adding voice entry for child ${childId} in case ${caseIdInt}: ${type}`);
    
    // Insert voice-of-child record
    const { data: voiceEntry, error } = await supabase
      .from('voice_of_child')
      .insert({
        case_id: caseIdInt,
        child_id: childId,
        type: type,
        content: content.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding voice entry:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`🗣️ Successfully added voice entry: ${voiceEntry.id}`);
    
    // Broadcast case update for real-time dashboard sync
    await broadcastCaseUpdate(caseIdInt, 'voice_added', type, null);
    
    return res.json({ 
      success: true,
      voiceEntry: voiceEntry
    });
    
  } catch (err) {
    console.error('Voice entry POST route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/cases/:id/status - Update case status/phase
router.patch('/:id/status', async (req, res) => {
  try {
    const caseId = req.params.id;
    const { status, phase } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.id || req.user?.user_id;

    if (!/^[0-9a-fA-F-]{36}$/.test(caseId)) {
      return res.status(400).json({ error: 'Invalid case ID format' });
    }

    // Only mediators and admins can update case status
    if (userRole !== 'mediator' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Mediator or Admin access required' });
    }

    // Fetch the case
    const { data: existingCase, error: fetchError } = await supabase
      .from('cases')
      .select('id, status, phase, mediator_id')
      .eq('id', caseId)
      .single();

    if (fetchError || !existingCase) {
      console.error('Case fetch error:', fetchError);
      return res.status(404).json({ error: 'Case not found' });
    }

    // If mediator, verify they are assigned to this case
    if (userRole === 'mediator' && existingCase.mediator_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Not assigned to this case' });
    }

    // Validate status
    const validStatuses = ['pending', 'active', 'completed', 'archived', 'on_hold'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        validStatuses 
      });
    }

    // Build update object
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      // If marking as completed, set closed_at
      if (status === 'completed') {
        updateData.closed_at = new Date().toISOString();
      }
    }

    if (phase !== undefined) {
      updateData.phase = phase;
    }

    // Update the case
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update(updateData)
      .eq('id', caseId)
      .select()
      .single();

    if (updateError) {
      console.error('Case update error:', updateError);
      return res.status(500).json({ error: 'Failed to update case' });
    }

    // Create notifications for all participants
    const { data: participants } = await supabase
      .from('case_participants')
      .select('user_id')
      .eq('case_id', caseId)
      .eq('status', 'active');

    if (participants && participants.length > 0) {
      const notifications = participants.map(p => ({
        user_id: p.user_id,
        message: `Case status updated to: ${status || existingCase.status}`,
        type: 'case_status_update',
        related_id: caseId,
        created_at: new Date().toISOString()
      }));

      await supabase.from('notifications').insert(notifications);
    }

    console.log(`[cases:status] Updated case ${caseId} to status ${status || existingCase.status} by ${userRole} ${userId}`);

    return res.json({
      success: true,
      case: updatedCase,
      message: 'Case status updated successfully'
    });

  } catch (err) {
    console.error('Case status update error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
