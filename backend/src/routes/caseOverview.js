import { Router } from 'express';
import { pool } from '../db.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = Router();
router.use(authenticateUser);

// Helper to keep snake_case or map to camelCase if preferred
const asCamel = (row) => row;

/**
 * Resolve case ID - accept either UUID or short_id (integer)
 * Returns { id: uuid, short_id: number } or null if not found
 */
async function resolveCaseId(caseIdInput) {
  // Check if it looks like a UUID (contains hyphens)
  const isUUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(caseIdInput);
  
  if (isUUID) {
    const result = await pool.query(
      'SELECT id, short_id FROM public.cases WHERE id = $1',
      [caseIdInput]
    );
    return result.rows[0] || null;
  } else {
    // Treat as short_id (integer)
    const result = await pool.query(
      'SELECT id, short_id FROM public.cases WHERE short_id = $1',
      [parseInt(caseIdInput, 10)]
    );
    return result.rows[0] || null;
  }
}

/**
 * GET /api/cases/:caseId
 * Returns composite view: case metadata, participants, document summary
 */
router.get('/:caseId', async (req, res) => {
  const { caseId } = req.params;
  console.log('[cases:overview] enter', { caseId, user: req.user?.user_id });
  
  try {
    // Resolve case ID (handles both UUID and short_id)
    const resolved = await resolveCaseId(caseId);
    if (!resolved) {
      console.log('[cases:overview] case not found', { caseId });
      return res.status(404).json({ 
        ok: false, 
        error: { code: 'CASE_NOT_FOUND', message: 'Case not found' }
      });
    }
    
    const caseUUID = resolved.id;
    const caseShortId = resolved.short_id;
    
    // Query case metadata
    const caseQ = `
      SELECT id, short_id, description AS title, status, updated_at, created_at
      FROM public.cases 
      WHERE id = $1
    `;
    
    // Query participants with user details
    const partQ = `
      SELECT 
        p.user_id, 
        p.role, 
        p.created_at AS joined_at, 
        p.updated_at AS last_activity_at, 
        au.name AS display_name, 
        au.email
      FROM public.case_participants p
      LEFT JOIN public.app_users au ON au.user_id = p.user_id
      WHERE p.case_id = $1
      ORDER BY p.created_at ASC
    `;
    
    // Query document summary by doc_type from uploads
    // uploads now has case_uuid (UUID) - use that instead of case_id (bigint)
    const docQ = `
      SELECT 
        doc_type AS topic,
        SUM(CASE WHEN status='complete' OR status='accepted' OR confirmed=true THEN 1 ELSE 0 END)::int AS complete,
        COUNT(*)::int AS total
      FROM public.uploads
      WHERE case_uuid = $1 AND deleted_at IS NULL
      GROUP BY doc_type
      ORDER BY doc_type ASC
    `;
    
    const [c1, c2, c3] = await Promise.all([
      pool.query(caseQ, [caseUUID]),
      pool.query(partQ, [caseUUID]),
      pool.query(docQ, [caseUUID]),
    ]);
    
    // Derive overall completion percentage and next action
    const topicSumm = c3.rows;
    const totals = topicSumm.reduce(
      (a, r) => ({ complete: a.complete + r.complete, total: a.total + r.total }),
      { complete: 0, total: 0 }
    );
    const overallPct = totals.total ? Math.round((totals.complete / totals.total) * 100) : 0;
    const nextAction = topicSumm.find(t => t.complete < t.total)?.topic || 'Waiting on mediator';
    
    console.log('[cases:overview] ok', { caseId, caseUUID, caseShortId, participants: c2.rowCount, topics: topicSumm.length, overallPct });
    
    return res.json({
      ok: true,
      case: asCamel(c1.rows[0]),
      participants: c2.rows.map(asCamel),
      documents: { 
        topics: topicSumm, 
        overallPct, 
        nextAction 
      },
    });
  } catch (e) {
    console.error('[cases:overview] error', { caseId, error: e.message, stack: e.stack });
    res.status(500).json({ 
      ok: false, 
      error: { code: 'CASE_OVERVIEW_FAILED', message: e.message }
    });
  }
});

/**
 * GET /api/cases/:caseId/activity
 * Returns normalized timeline feed from uploads, messages, notifications
 * Query params: limit (default 50, max 200), type (docs|messages|system)
 */
router.get('/:caseId/activity', async (req, res) => {
  const { caseId } = req.params;
  const { limit = '50', type } = req.query;
  console.log('[cases:activity] enter', { caseId, type, limit, user: req.user?.user_id });
  
  try {
    // Resolve case ID (handles both UUID and short_id)
    const resolved = await resolveCaseId(caseId);
    if (!resolved) {
      console.log('[cases:activity] case not found', { caseId });
      return res.status(404).json({ 
        ok: false, 
        error: { code: 'CASE_NOT_FOUND', message: 'Case not found' }
      });
    }
    
    const caseUUID = resolved.id;
    const lim = Math.min(parseInt(String(limit), 10) || 50, 200);
    
    // Pull uploads feed (uses case_uuid now)
    const uploads = (!type || type === 'docs') ? await pool.query(
      `SELECT 
        id, 
        'upload' AS kind, 
        user_id, 
        doc_type AS topic, 
        created_at AS at
       FROM public.uploads 
       WHERE case_uuid = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC 
       LIMIT $2`, 
      [caseUUID, lim]
    ) : { rows: [] };
    
    // Return uploads sorted by timestamp
    const items = uploads.rows
      .sort((a, b) => new Date(b.at).valueOf() - new Date(a.at).valueOf())
      .slice(0, lim);
    
    console.log('[cases:activity] ok', { caseId, type, items: items.length });
    
    res.json({ ok: true, items });
  } catch (e) {
    console.error('[cases:activity] error', { caseId, error: e.message, stack: e.stack });
    res.status(500).json({ 
      ok: false, 
      error: { code: 'CASE_ACTIVITY_FAILED', message: e.message }
    });
  }
});

/**
 * GET /api/cases/:caseId/events
 * Returns upcoming and past events for a case
 * Note: events table doesn't exist yet, returning empty arrays
 */
router.get('/:caseId/events', async (req, res) => {
  const { caseId } = req.params;
  console.log('[cases:events] enter', { caseId, user: req.user?.user_id });
  
  // TODO: Implement when events/sessions table is properly linked to cases
  res.json({ ok: true, upcoming: [], past: [] });
});

export default router;
