import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { getRecentActivity } from '../lib/activityLogger.js';
import { supabase, requireSupabaseOr500 } from '../lib/supabaseClient.js';
import logger from '../lib/logger.js';
import crypto from 'crypto';

const router = express.Router();

router.use(authenticateUser);

// Ensure supabase client exists
router.use((req, res, next) => {
  if (!supabase) return requireSupabaseOr500(res);
  next();
});

// GET /api/admin/activity - Get recent admin activity
router.get('/activity', async (req, res) => {
  try {
    // Only admins can view activity logs
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const activities = await getRecentActivity(limit);

    return res.json({
      ok: true,
      activities
    });
  } catch (err) {
    console.error('[admin:activity] error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats - Get system-wide statistics
router.get('/stats', async (req, res) => {
  try {
    // Only admins can view stats
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    logger.debug('[admin:stats] Fetching system statistics');

    // Run all queries in parallel for performance
    const [usersResult, casesResult, uploadsResult, sessionsResult, orgsResult] = await Promise.all([
      // Total users by role
      supabase.from('app_users').select('role', { count: 'exact', head: false }),
      // Cases by status
      supabase.from('cases').select('status', { count: 'exact', head: false }),
      // Uploads by status
      supabase.from('uploads').select('status', { count: 'exact', head: false }),
      // Sessions count
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
      // Organizations count
      supabase.from('organizations').select('id', { count: 'exact', head: true })
    ]);

    // Count users by role
    const usersByRole = {
      admin: 0,
      mediator: 0,
      divorcee: 0,
      lawyer: 0,
      total: 0
    };

    if (usersResult.data) {
      usersResult.data.forEach(user => {
        const role = user.role?.toLowerCase();
        if (usersByRole.hasOwnProperty(role)) {
          usersByRole[role]++;
        }
        usersByRole.total++;
      });
    }

    // Count cases by status
    const casesByStatus = {
      active: 0,
      pending: 0,
      completed: 0,
      archived: 0,
      total: 0
    };

    if (casesResult.data) {
      casesResult.data.forEach(caseItem => {
        const status = caseItem.status?.toLowerCase();
        if (casesByStatus.hasOwnProperty(status)) {
          casesByStatus[status]++;
        }
        casesByStatus.total++;
      });
    }

    // Count uploads by status
    const uploadsByStatus = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    if (uploadsResult.data) {
      uploadsResult.data.forEach(upload => {
        const status = upload.status?.toLowerCase();
        if (uploadsByStatus.hasOwnProperty(status)) {
          uploadsByStatus[status]++;
        }
        uploadsByStatus.total++;
      });
    }

    const stats = {
      users: usersByRole,
      cases: casesByStatus,
      uploads: uploadsByStatus,
      sessions: {
        total: sessionsResult.count || 0
      },
      organizations: {
        total: orgsResult.count || 0
      },
      timestamp: new Date().toISOString()
    };

    logger.debug('[admin:stats] Success', { stats });

    return res.json({
      ok: true,
      stats
    });

  } catch (err) {
    logger.error('[admin:stats] error', { error: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/invite - Send user invitation
router.post('/invite', async (req, res) => {
  try {
    // Only admins can invite users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { email, role, name } = req.body;

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate role
    const validRoles = ['admin', 'mediator', 'divorcee', 'lawyer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('app_users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Create invitation record (if invitations table exists)
    // For now, we'll just log it and return success
    // In production, you would:
    // 1. Store the invitation in database
    // 2. Send email via SendGrid/Mailgun
    // 3. Include a link with the token

    logger.info('[admin:invite] Invitation created', {
      email,
      role,
      name,
      invitedBy: req.user?.id || req.user?.user_id,
      token: inviteToken.substring(0, 8) + '...' // Log partial token for debugging
    });

    // TODO: Implement email sending
    // await sendInvitationEmail(email, name, role, inviteToken);

    // For development, return the invite link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${inviteToken}`;

    return res.json({
      ok: true,
      message: 'Invitation created successfully',
      // In production, don't return the link - send it via email instead
      invite: {
        email,
        role,
        name,
        expiresAt: expiresAt.toISOString(),
        // Return link only in development
        ...(process.env.NODE_ENV === 'development' && { inviteLink })
      }
    });

  } catch (err) {
    logger.error('[admin:invite] error', { error: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
