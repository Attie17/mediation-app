import express from 'express';
import { supabase, requireSupabaseOr500 } from '../lib/supabaseClient.js';

const router = express.Router();
router.use((req,res,next)=>{ if(!supabase) return requireSupabaseOr500(res); next(); });

// Simple test endpoint to verify dashboard routes work
router.get('/test', async (req, res) => {
  res.json({ message: 'Dashboard routes are working!', timestamp: new Date() });
});

// Simple test endpoint to verify dashboard routes work
router.get('/test', async (req, res) => {
  res.json({ message: 'Dashboard routes are working!', timestamp: new Date() });
});

// GET /cases/:caseId/dashboard - comprehensive case dashboard data
router.get('/cases/:caseId/dashboard', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { userId, userRole } = req.query; // In real app, this would come from auth middleware
    
    // Validate caseId is an integer
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt) || caseIdInt <= 0) {
      return res.status(400).json({ 
        error: 'Invalid case ID. Must be a positive integer.' 
      });
    }

    console.log(`📊 Fetching dashboard data for case ID: ${caseIdInt}, user: ${userId}, role: ${userRole}`);
    
    // 1. Fetch case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseIdInt)
      .single();

    if (caseError) {
      console.error('Error fetching case:', caseError);
      return res.status(500).json({ error: caseError.message });
    }

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // 2. Fetch participants (without joins to avoid schema issues)
    let participants = [];
    try {
      const { data: participantsData, error: participantsError } = await supabase
        .from('case_participants')
        .select('*')
        .eq('case_id', caseIdInt);

      if (participantsError) {
        console.log('📝 case_participants table may not exist yet, continuing without participants data');
      } else {
        participants = participantsData || [];
      }
    } catch (err) {
      console.log('📝 Participants table not accessible, continuing without participants data');
    }

    // 3. Fetch case requirements
    const { data: requirements, error: requirementsError } = await supabase
      .from('case_requirements')
      .select('*')
      .eq('case_id', caseIdInt)
      .order('created_at', { ascending: true });

    if (requirementsError) {
      console.error('Error fetching requirements:', requirementsError);
      return res.status(500).json({ error: requirementsError.message });
    }

    // 4. Fetch uploads (without complex joins to avoid schema cache issues)
    let uploadsQuery = supabase
      .from('uploads')
      .select('*')
      .eq('case_id', caseIdInt)
      .order('created_at', { ascending: false });

    // If user is a divorcee, only show their uploads
    if (userRole === 'divorcee' && userId) {
      uploadsQuery = uploadsQuery.eq('user_id', userId);
    }

    const { data: uploads, error: uploadsError } = await uploadsQuery;

    if (uploadsError) {
      console.error('Error fetching uploads:', uploadsError);
      return res.status(500).json({ error: uploadsError.message });
    }

    // 5. Process requirements with status based on uploads
    const requirementsWithStatus = requirements?.map(requirement => {
      // Find the latest upload for this doc type
      const latestUpload = uploads?.find(upload => upload.doc_type === requirement.doc_type);
      
      let status = 'missing';
      if (latestUpload) {
        if (latestUpload.status === 'confirmed') {
          status = 'confirmed';
        } else if (latestUpload.status === 'rejected') {
          status = 'rejected';
        } else {
          status = 'uploaded';
        }
      }
      
      return {
        ...requirement,
        status,
        latestUpload
      };
    });

    // 6. Group uploads by document type (latest version of each)
    const uploadsByDocType = {};
    uploads?.forEach(upload => {
      if (!uploadsByDocType[upload.doc_type] || 
          new Date(upload.created_at) > new Date(uploadsByDocType[upload.doc_type].created_at)) {
        uploadsByDocType[upload.doc_type] = upload;
      }
    });

    const processedUploads = Object.values(uploadsByDocType);

    const dashboardData = {
      case: {
        id: caseData.id,
        title: caseData.title || `Case #${caseData.id}`,
        created_at: caseData.created_at,
        description: caseData.description
      },
      participants: participants?.map(p => ({
        id: p.id,
        user_id: p.user_id,
        role: p.role,
        created_at: p.created_at,
        user: {
          id: p.user_id,
          email: 'Unknown', // We'll fetch this separately if needed
          full_name: 'Unknown User'
        }
      })) || [],
      requirements: requirementsWithStatus,
      uploads: processedUploads || [],
      stats: {
        totalRequirements: requirements?.length || 0,
        confirmedCount: requirementsWithStatus.filter(r => r.status === 'confirmed').length,
        rejectedCount: requirementsWithStatus.filter(r => r.status === 'rejected').length,
        uploadedCount: requirementsWithStatus.filter(r => r.status === 'uploaded').length,
        missingCount: requirementsWithStatus.filter(r => r.status === 'missing').length,
        totalParticipants: participants?.length || 0,
        totalUploads: processedUploads?.length || 0
      }
    };

    console.log(`📊 Dashboard data compiled:`, {
      caseId: caseIdInt,
      participants: dashboardData.participants.length,
      requirements: dashboardData.requirements.length,
      uploads: dashboardData.uploads.length
    });
    
    return res.json(dashboardData);
    
  } catch (err) {
    console.error('Dashboard route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /:userId : Mediator Dashboard summary
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Fetch user record
    let userResponse = await supabase
      .from('app_users')
      .select('id, email, name, role, created_at')
      .eq('id', userId)
      .single();

    if (userResponse.error && userResponse.error.code === '42703') {
      userResponse = await supabase
        .from('app_users')
        .select('id, role, created_at')
        .eq('id', userId)
        .single();
    }

    if (userResponse.error) {
      console.error('Dashboard user error:', userResponse.error);
      return res.status(500).json({ success: false, error: userResponse.error.message });
    }

    const user = userResponse.data;

    // Fetch intake answers
    const { data: intakeAnswers, error: intakeError } = await supabase
      .from('intake_answers')
      .select('*')
      .eq('user_id', userId);
    if (intakeError) {
      console.error('Dashboard intake error:', intakeError);
      return res.status(500).json({ success: false, error: intakeError.message });
    }

    // Fetch uploads
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId);
    if (uploadsError) {
      console.error('Dashboard uploads error:', uploadsError);
      return res.status(500).json({ success: false, error: uploadsError.message });
    }

    // Find latestIntake by created_at
    let latestIntake = null;
    if (intakeAnswers && intakeAnswers.length > 0) {
      latestIntake = intakeAnswers.reduce((a, b) => (a.created_at > b.created_at ? a : b));
    }

    // Find latestUpload by uploaded_at
    let latestUpload = null;
    if (uploads && uploads.length > 0) {
      latestUpload = uploads.reduce((a, b) => (a.uploaded_at > b.uploaded_at ? a : b));
    }

    const summary = {
      user,
      intakeCount: intakeAnswers ? intakeAnswers.length : 0,
      uploadsCount: uploads ? uploads.length : 0,
      latestIntake,
      latestUpload
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /cases/:caseId/dashboard - comprehensive case dashboard data
router.get('/cases/:caseId/dashboard', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { userId, userRole } = req.query; // In real app, this would come from auth middleware
    
    // Validate caseId is an integer
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt) || caseIdInt <= 0) {
      return res.status(400).json({ 
        error: 'Invalid case ID. Must be a positive integer.' 
      });
    }

    console.log(`📊 Fetching dashboard data for case ID: ${caseIdInt}, user: ${userId}, role: ${userRole}`);
    
    // 1. Fetch case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseIdInt)
      .single();

    if (caseError) {
      console.error('Error fetching case:', caseError);
      return res.status(500).json({ error: caseError.message });
    }

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // 2. Fetch participants (without joins to avoid schema issues)
    let participants = [];
    try {
      const { data: participantsData, error: participantsError } = await supabase
        .from('case_participants')
        .select('*')
        .eq('case_id', caseIdInt);

      if (participantsError) {
        console.log('📝 case_participants table may not exist yet, continuing without participants data');
      } else {
        participants = participantsData || [];
      }
    } catch (err) {
      console.log('📝 Participants table not accessible, continuing without participants data');
    }

    // 3. Fetch case requirements
    const { data: requirements, error: requirementsError } = await supabase
      .from('case_requirements')
      .select('*')
      .eq('case_id', caseIdInt)
      .order('created_at', { ascending: true });

    if (requirementsError) {
      console.error('Error fetching requirements:', requirementsError);
      return res.status(500).json({ error: requirementsError.message });
    }

    // 4. Fetch uploads (without complex joins to avoid schema cache issues)
    let uploadsQuery = supabase
      .from('uploads')
      .select('*')
      .eq('case_id', caseIdInt)
      .order('created_at', { ascending: false });

    // If user is a divorcee, only show their uploads
    if (userRole === 'divorcee' && userId) {
      uploadsQuery = uploadsQuery.eq('user_id', userId);
    }

    const { data: uploads, error: uploadsError } = await uploadsQuery;

    if (uploadsError) {
      console.error('Error fetching uploads:', uploadsError);
      return res.status(500).json({ error: uploadsError.message });
    }

    // 5. Process requirements with upload status
    const requirementsWithStatus = (requirements || []).map(requirement => {
      // Find uploads for this document type
      const docUploads = uploads?.filter(upload => upload.doc_type === requirement.doc_type) || [];
      
      let status = 'missing';
      let latestUpload = null;

      if (docUploads.length > 0) {
        // Get the latest upload for this doc type
        latestUpload = docUploads[0]; // Already ordered by created_at desc
        
        switch (latestUpload.status) {
          case 'confirmed':
            status = 'confirmed';
            break;
          case 'rejected':
            status = 'rejected';
            break;
          case 'pending':
          default:
            status = 'uploaded';
            break;
        }
      }

      return {
        ...requirement,
        status,
        latestUpload
      };
    });

    // 6. Group uploads by document type (latest version of each)
    const uploadsByDocType = {};
    uploads?.forEach(upload => {
      if (!uploadsByDocType[upload.doc_type] || 
          new Date(upload.created_at) > new Date(uploadsByDocType[upload.doc_type].created_at)) {
        uploadsByDocType[upload.doc_type] = upload;
      }
    });

    const processedUploads = Object.values(uploadsByDocType);

    const dashboardData = {
      case: {
        id: caseData.id,
        title: caseData.title || `Case #${caseData.id}`,
        created_at: caseData.created_at,
        description: caseData.description
      },
      participants: participants?.map(p => ({
        id: p.id,
        user_id: p.user_id,
        role: p.role,
        created_at: p.created_at,
        user: {
          id: p.user_id,
          email: 'Unknown', // We'll fetch this separately if needed
          full_name: 'Unknown User'
        }
      })) || [],
      requirements: requirementsWithStatus,
      uploads: processedUploads || [],
      stats: {
        totalRequirements: requirements?.length || 0,
        confirmedCount: requirementsWithStatus.filter(r => r.status === 'confirmed').length,
        rejectedCount: requirementsWithStatus.filter(r => r.status === 'rejected').length,
        uploadedCount: requirementsWithStatus.filter(r => r.status === 'uploaded').length,
        missingCount: requirementsWithStatus.filter(r => r.status === 'missing').length,
        totalParticipants: participants?.length || 0,
        totalUploads: processedUploads?.length || 0
      }
    };

    console.log(`📊 Dashboard data compiled:`, {
      caseId: caseIdInt,
      participants: dashboardData.participants.length,
      requirements: dashboardData.requirements.length,
      uploads: dashboardData.uploads.length
    });
    
    return res.json(dashboardData);
    
  } catch (err) {
    console.error('Dashboard route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROLE-SPECIFIC DASHBOARD STATS ENDPOINTS
// ============================================

console.log('📊 Dashboard stats routes loading...');
console.log('  - GET /dashboard/stats/admin');
console.log('  - GET /dashboard/stats/mediator/:userId');
console.log('  - GET /dashboard/stats/lawyer/:userId');
console.log('  - GET /dashboard/stats/divorcee/:userId');

/**
 * GET /dashboard/stats/admin
 * Returns system-wide statistics for admin dashboard
 */
router.get('/stats/admin', async (req, res) => {
  try {
    console.log('📊 Fetching admin dashboard stats');

    // Get total users count
    const { data: usersData, error: usersError } = await supabase
      .from('app_users')
      .select('user_id', { count: 'exact', head: true });

    if (usersError) {
      console.error('Error counting users:', usersError);
      return res.status(500).json({ error: usersError.message });
    }

    // Get active cases count (assuming status field exists)
    const { data: activeCasesData, error: activeCasesError, count: activeCasesCount } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeCasesError) {
      console.error('Error counting active cases:', activeCasesError);
      // Continue anyway, will return 0
    }

    // Get resolved cases count
    const { data: resolvedCasesData, error: resolvedCasesError, count: resolvedCasesCount } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved');

    if (resolvedCasesError) {
      console.error('Error counting resolved cases:', resolvedCasesError);
    }

    // Get pending invites count (if invites table exists)
    let pendingInvitesCount = 0;
    try {
      const { count: invitesCount, error: invitesError } = await supabase
        .from('invites')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!invitesError) {
        pendingInvitesCount = invitesCount || 0;
      }
    } catch (err) {
      console.log('Invites table may not exist, continuing with 0');
    }

    const stats = {
      totalUsers: usersData?.length || 0,
      activeCases: activeCasesCount || 0,
      resolvedCases: resolvedCasesCount || 0,
      pendingInvites: pendingInvitesCount
    };

    console.log('✅ Admin stats:', stats);

    return res.json({
      ok: true,
      stats
    });

  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message 
    });
  }
});

/**
 * GET /dashboard/stats/mediator/:userId
 * Returns mediator-specific statistics
 */
router.get('/stats/mediator/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📊 Fetching mediator stats for user: ${userId}`);

    // Get active cases where user is mediator
    const { count: activeCasesCount, error: activeCasesError } = await supabase
      .from('case_participants')
      .select('case_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'mediator');

    if (activeCasesError) {
      console.error('Error counting mediator active cases:', activeCasesError);
    }

    // Get pending reviews (cases needing mediator review)
    const { count: pendingReviewsCount, error: pendingReviewsError } = await supabase
      .from('case_participants')
      .select('case_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'mediator')
      .eq('review_status', 'pending');

    if (pendingReviewsError) {
      console.log('review_status field may not exist, using 0');
    }

    // Get today's sessions (if sessions table exists)
    let todaySessionsCount = 0;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('mediator_id', userId)
        .gte('session_date', today)
        .lt('session_date', new Date(Date.now() + 86400000).toISOString().split('T')[0]);

      if (!error) {
        todaySessionsCount = count || 0;
      }
    } catch (err) {
      console.log('Sessions table may not exist, using 0');
    }

    // Get resolved this month
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: resolvedThisMonthCount, error: resolvedError } = await supabase
      .from('case_participants')
      .select('case_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'mediator')
      .eq('case_status', 'resolved')
      .gte('updated_at', firstDayOfMonth);

    if (resolvedError) {
      console.log('Error counting resolved cases, using 0');
    }

    const stats = {
      activeCases: activeCasesCount || 0,
      pendingReviews: pendingReviewsCount || 0,
      todaySessions: todaySessionsCount,
      resolvedThisMonth: resolvedThisMonthCount || 0
    };

    console.log('✅ Mediator stats:', stats);

    return res.json({
      ok: true,
      stats
    });

  } catch (err) {
    console.error('Error fetching mediator stats:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message 
    });
  }
});

/**
 * GET /dashboard/stats/lawyer/:userId
 * Returns lawyer-specific statistics
 */
router.get('/stats/lawyer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📊 Fetching lawyer stats for user: ${userId}`);

    // Get client cases count
    const { count: clientCasesCount, error: casesError } = await supabase
      .from('case_participants')
      .select('case_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'lawyer');

    if (casesError) {
      console.error('Error counting lawyer cases:', casesError);
    }

    // Get pending documents count
    let pendingDocumentsCount = 0;
    try {
      const { count, error } = await supabase
        .from('uploads')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_lawyer_id', userId)
        .eq('review_status', 'pending');

      if (!error) {
        pendingDocumentsCount = count || 0;
      }
    } catch (err) {
      console.log('Document review fields may not exist, using 0');
    }

    // Get upcoming sessions
    let upcomingSessionsCount = 0;
    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const { count, error } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('lawyer_id', userId)
        .gte('session_date', new Date().toISOString());

      if (!error) {
        upcomingSessionsCount = count || 0;
      }
    } catch (err) {
      console.log('Sessions table may not exist, using 0');
    }

    // Get completed this month
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: completedThisMonthCount, error: completedError } = await supabase
      .from('case_participants')
      .select('case_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'lawyer')
      .eq('case_status', 'completed')
      .gte('updated_at', firstDayOfMonth);

    if (completedError) {
      console.log('Error counting completed cases, using 0');
    }

    const stats = {
      clientCases: clientCasesCount || 0,
      pendingDocuments: pendingDocumentsCount,
      upcomingSessions: upcomingSessionsCount,
      completedThisMonth: completedThisMonthCount || 0
    };

    console.log('✅ Lawyer stats:', stats);

    return res.json({
      ok: true,
      stats
    });

  } catch (err) {
    console.error('Error fetching lawyer stats:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message 
    });
  }
});

/**
 * GET /dashboard/stats/divorcee/:userId
 * Returns divorcee-specific statistics
 */
router.get('/stats/divorcee/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📊 Fetching divorcee stats for user: ${userId}`);

    // Get user's case
    const { data: caseData, error: caseError } = await supabase
      .from('case_participants')
      .select('case_id, case_status')
      .eq('user_id', userId)
      .eq('role', 'divorcee')
      .limit(1)
      .single();

    if (caseError || !caseData) {
      console.log('No case found for divorcee');
      return res.json({
        ok: true,
        stats: {
          caseStatus: 'no_case',
          documentsUploaded: 0,
          documentsPending: 0,
          unreadMessages: 0
        }
      });
    }

    const caseId = caseData.case_id;

    // Get documents uploaded by this user
    const { count: documentsUploadedCount, error: uploadedError } = await supabase
      .from('uploads')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', caseId)
      .eq('user_id', userId);

    if (uploadedError) {
      console.error('Error counting uploaded documents:', uploadedError);
    }

    // Get pending document requirements
    const { count: documentsPendingCount, error: pendingError } = await supabase
      .from('case_requirements')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', caseId)
      .eq('status', 'pending');

    if (pendingError) {
      console.log('Error counting pending requirements, using 0');
    }

    // Get unread messages
    let unreadMessagesCount = 0;
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('case_id', caseId)
        .eq('recipient_id', userId)
        .eq('read', false);

      if (!error) {
        unreadMessagesCount = count || 0;
      }
    } catch (err) {
      console.log('Messages table may not exist, using 0');
    }

    const stats = {
      caseStatus: caseData.case_status || 'active',
      documentsUploaded: documentsUploadedCount || 0,
      documentsPending: documentsPendingCount || 0,
      unreadMessages: unreadMessagesCount
    };

    console.log('✅ Divorcee stats:', stats);

    return res.json({
      ok: true,
      stats
    });

  } catch (err) {
    console.error('Error fetching divorcee stats:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message 
    });
  }
});

export default router;
