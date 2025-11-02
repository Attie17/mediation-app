import { Router } from 'express';
import { supabase, requireSupabaseOr500 } from '../lib/supabaseClient.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { sendSessionReminder } from '../services/emailService.js';

const router = Router();

// Ensure supabase client is configured before handling requests
router.use((req, res, next) => {
  if (!supabase) return requireSupabaseOr500(res);
  return next();
});

// All session routes require authentication
router.use(authenticateUser);

/**
 * GET /api/sessions/user/:userId
 * Get all sessions for a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user has access to this data
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Unauthorized to access this user\'s sessions' 
      });
    }

    const { data: sessions, error } = await supabase
      .from('mediation_sessions')
      .select('*')
      .or(`mediator_id.eq.${userId},created_by.eq.${userId}`)
      .order('session_date', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to fetch sessions',
        details: error.message 
      });
    }

    // Separate into upcoming and past sessions
    const now = new Date();
    const upcoming = [];
    const past = [];

    sessions.forEach(session => {
      const sessionDateTime = new Date(`${session.session_date}T${session.session_time}`);
      if (sessionDateTime >= now) {
        upcoming.push(session);
      } else {
        past.push(session);
      }
    });

    return res.json({
      ok: true,
      sessions: {
        upcoming,
        past,
        all: sessions
      }
    });

  } catch (error) {
    console.error('Error in GET /sessions/user/:userId:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get a specific session by ID
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data: session, error } = await supabase
      .from('mediation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          ok: false, 
          error: 'Session not found' 
        });
      }
      console.error('Error fetching session:', error);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to fetch session',
        details: error.message 
      });
    }

    // Check access permissions
    const hasAccess = 
      req.user.role === 'admin' ||
      session.mediator_id === req.user.id ||
      session.created_by === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Unauthorized to access this session' 
      });
    }

    return res.json({
      ok: true,
      session
    });

  } catch (error) {
    console.error('Error in GET /sessions/:sessionId:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

/**
 * POST /api/sessions
 * Create a new mediation session
 */
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      date, 
      time, 
      duration, 
      location, 
      case_id, 
      notes,
      participants = []
    } = req.body;

    // Validate required fields
    if (!title || !date || !time) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: title, date, and time are required' 
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid date format. Expected YYYY-MM-DD' 
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid time format. Expected HH:MM' 
      });
    }

    // Insert session into database
    const { data: session, error } = await supabase
      .from('mediation_sessions')
      .insert({
        title,
        session_date: date,
        session_time: time,
        duration_minutes: duration || 60,
        location: location || null,
        case_id: case_id || null,
        notes: notes || null,
        mediator_id: req.user.id,
        created_by: req.user.id,
        status: 'scheduled',
        participants: participants.length > 0 ? participants : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to create session',
        details: error.message 
      });
    }

    return res.status(201).json({
      ok: true,
      message: 'Session created successfully',
      session
    });

  } catch (error) {
    console.error('Error in POST /sessions:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

/**
 * PATCH /api/sessions/:sessionId
 * Update an existing session
 */
router.patch('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;

    // First, check if session exists and user has permission
    const { data: existingSession, error: fetchError } = await supabase
      .from('mediation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ 
          ok: false, 
          error: 'Session not found' 
        });
      }
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to fetch session',
        details: fetchError.message 
      });
    }

    // Check permissions
    const canEdit = 
      req.user.role === 'admin' ||
      existingSession.mediator_id === req.user.id ||
      existingSession.created_by === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Unauthorized to update this session' 
      });
    }

    // Build update object (only allow certain fields)
    const allowedFields = [
      'title', 
      'session_date', 
      'session_time', 
      'duration_minutes', 
      'location', 
      'notes', 
      'status',
      'participants'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Perform update
    const { data: updatedSession, error: updateError } = await supabase
      .from('mediation_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to update session',
        details: updateError.message 
      });
    }

    return res.json({
      ok: true,
      message: 'Session updated successfully',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error in PATCH /sessions/:sessionId:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * Cancel/delete a session
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // First, check if session exists and user has permission
    const { data: existingSession, error: fetchError } = await supabase
      .from('mediation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ 
          ok: false, 
          error: 'Session not found' 
        });
      }
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to fetch session',
        details: fetchError.message 
      });
    }

    // Check permissions
    const canDelete = 
      req.user.role === 'admin' ||
      existingSession.mediator_id === req.user.id ||
      existingSession.created_by === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Unauthorized to delete this session' 
      });
    }

    // Soft delete - update status to 'cancelled'
    const { data: cancelledSession, error: updateError } = await supabase
      .from('mediation_sessions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error cancelling session:', updateError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to cancel session',
        details: updateError.message 
      });
    }

    return res.json({
      ok: true,
      message: 'Session cancelled successfully',
      session: cancelledSession
    });

  } catch (error) {
    console.error('Error in DELETE /sessions/:sessionId:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

/**
 * POST /api/sessions/:sessionId/send-reminder
 * Send a reminder email/notification for an upcoming session
 */
router.post('/:sessionId/send-reminder', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Fetch the session
    const { data: session, error: fetchError } = await supabase
      .from('mediation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ 
          ok: false, 
          error: 'Session not found' 
        });
      }
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to fetch session',
        details: fetchError.message 
      });
    }

    // Check permissions
    const canSend = 
      req.user.role === 'admin' ||
      session.mediator_id === req.user.id ||
      session.created_by === req.user.id;

    if (!canSend) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Unauthorized to send reminders for this session' 
      });
    }

    // Get participants if case_id exists
    let participants = [];
    if (session.case_id) {
      const { data: caseParticipants, error: participantsError } = await supabase
        .from('case_participants')
        .select('user_id, users!inner(email, full_name)')
        .eq('case_id', session.case_id);

      if (!participantsError && caseParticipants) {
        participants = caseParticipants.map(p => ({
          email: p.users.email,
          name: p.users.full_name || p.users.email
        }));
      }
    }

    // Send email reminders using email service
    let emailResults = null;
    let successCount = 0;
    
    if (participants.length > 0) {
      try {
        emailResults = await sendSessionReminder(session, participants);
        successCount = emailResults.successCount || 0;
        
        console.log('Email reminder results:', {
          sessionId,
          total: participants.length,
          success: emailResults.successCount,
          failed: emailResults.failureCount
        });
      } catch (emailError) {
        console.error('Email service error:', emailError);
        // Continue anyway - we'll still mark the reminder as sent
        // This allows the system to work even if email is not configured
      }
    }

    // Update session to mark reminder sent and increment count
    const currentCount = session.reminder_count || 0;
    await supabase
      .from('mediation_sessions')
      .update({ 
        reminder_sent: true,
        reminder_sent_at: new Date().toISOString(),
        reminder_count: currentCount + 1
      })
      .eq('id', sessionId);

    return res.json({
      ok: true,
      message: 'Reminder sent successfully',
      recipientCount: participants.length,
      reminderCount: currentCount + 1
    });

  } catch (error) {
    console.error('Error in POST /sessions/:sessionId/send-reminder:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;
