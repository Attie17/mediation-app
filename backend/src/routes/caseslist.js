import express from 'express';
import { supabase, requireSupabaseOr500 } from '../lib/supabaseClient.js';
import logger from '../lib/logger.js';

const router = express.Router();

// Ensure supabase client exists
router.use((req, res, next) => {
  if (!supabase) return requireSupabaseOr500(res);
  next();
});

/**
 * GET /api/caseslist - List all cases with role-based filtering
 * Query params:
 *   - role: Filter by user role (admin, mediator, divorcee, lawyer)
 *   - userId: Filter by user ID (for divorcees and lawyers)
 *   - mediatorId: Filter by mediator ID
 *   - status: Filter by case status (active, completed, pending)
 *   - limit: Number of results (default: 50)
 *   - offset: Pagination offset (default: 0)
 */
router.get('/', async (req, res) => {
  try {
    const { role, userId, mediatorId, status, limit = 50, offset = 0 } = req.query;
    const userRole = req.user?.role || role;

    logger.debug('[caseslist] GET request', { role: userRole, userId, mediatorId, status });

    let query = supabase
      .from('cases')
      .select(`
        id,
        title,
        description,
        status,
        mediator_id,
        created_at,
        updated_at,
        closed_at,
        case_participants!inner (
          id,
          user_id,
          role,
          status,
          app_users (
            user_id,
            email,
            full_name,
            role
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Role-based filtering
    if (userRole === 'mediator' && mediatorId) {
      // Mediators see their assigned cases
      query = query.eq('mediator_id', mediatorId);
    } else if (userRole === 'divorcee' && userId) {
      // Divorcees see only their cases
      query = query.eq('case_participants.user_id', userId)
                   .eq('case_participants.role', 'divorcee');
    } else if (userRole === 'lawyer' && userId) {
      // Lawyers see cases where they are participants
      query = query.eq('case_participants.user_id', userId)
                   .eq('case_participants.role', 'lawyer');
    } else if (userRole === 'admin') {
      // Admins see all cases (no additional filtering)
    } else if (userId) {
      // Generic user filter
      query = query.eq('case_participants.user_id', userId);
    }

    // Status filtering
    if (status) {
      query = query.eq('status', status);
    }

    // Pagination
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const offsetNum = parseInt(offset, 10) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: cases, error, count } = await query;

    if (error) {
      logger.error('[caseslist] Database error', { error: error.message });
      return res.status(500).json({ error: 'Failed to fetch cases', details: error.message });
    }

    // Transform data to flatten participants
    const transformedCases = cases.map(caseItem => ({
      id: caseItem.id,
      title: caseItem.title,
      description: caseItem.description,
      status: caseItem.status,
      mediator_id: caseItem.mediator_id,
      created_at: caseItem.created_at,
      updated_at: caseItem.updated_at,
      closed_at: caseItem.closed_at,
      participants: caseItem.case_participants.map(p => ({
        id: p.id,
        user_id: p.user_id,
        role: p.role,
        status: p.status,
        user: p.app_users ? {
          user_id: p.app_users.user_id,
          email: p.app_users.email,
          full_name: p.app_users.full_name,
          role: p.app_users.role
        } : null
      }))
    }));

    logger.debug('[caseslist] Success', { count: transformedCases.length, total: count });

    return res.json({
      success: true,
      cases: transformedCases,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: count || transformedCases.length
      }
    });

  } catch (err) {
    logger.error('[caseslist] Unexpected error', { error: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
