import express from 'express';
import { pool } from '../db.js';
import { insertNotifications } from '../utils/notifications.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for caseNotes routes');
}

const parseCaseId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const ensureUserCanAccessCase = async (caseId, userId) => {
  const { rows } = await pool.query(
    `SELECT 1 FROM cases WHERE id = $1 AND mediator_id = $2
     UNION
     SELECT 1 FROM case_participants WHERE case_id = $1 AND user_id = $2`,
    [caseId, userId]
  );
  return rows.length > 0;
};

router.use(authenticateUser);

router.post('/:id/notes', async (req, res) => {
  const caseId = parseCaseId(req.params.id);
  const noteBody = typeof req.body?.body === 'string' ? req.body.body.trim() : '';

  if (!caseId) {
    return res.status(400).json({ error: 'Invalid case ID' });
  }

  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!noteBody) {
    return res.status(400).json({ error: 'body is required' });
  }

  try {
    const hasAccess = await ensureUserCanAccessCase(caseId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have access to this case.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO case_notes (case_id, author_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, case_id, author_id, body, created_at`,
      [caseId, req.user.id, noteBody],
    );

    const inserted = rows[0];

    const preview = noteBody.length > 120 ? `${noteBody.slice(0, 117)}...` : noteBody;
    const authorLabel = req.user?.email || req.user?.id || 'A participant';

    try {
      const { rows: recipientRows } = await pool.query(
        `SELECT user_id
           FROM case_participants
          WHERE case_id = $1 AND user_id <> $2
         UNION
         SELECT mediator_id AS user_id
           FROM cases
          WHERE id = $1 AND mediator_id IS NOT NULL AND mediator_id <> $2`,
        [caseId, req.user.id]
      );

      const recipientIds = recipientRows.map((row) => row.user_id).filter(Boolean);

      if (recipientIds.length > 0) {
        await insertNotifications(
          recipientIds,
          `${authorLabel} added a new note on case ${caseId}: "${preview}"`,
          'note'
        );
      }
    } catch (notifyError) {
      console.error('Failed to notify note creation:', notifyError);
    }

    return res.status(201).json({ success: true, data: inserted });
  } catch (err) {
    console.error('Error creating case note:', err);
    return res.status(500).json({ error: 'Failed to create case note' });
  }
});

router.get('/:id/notes', async (req, res) => {
  const caseId = parseCaseId(req.params.id);

  if (!caseId) {
    return res.status(400).json({ error: 'Invalid case ID' });
  }

  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const hasAccess = await ensureUserCanAccessCase(caseId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have access to this case.' });
    }

    const { rows } = await pool.query(
      `SELECT cn.id,
              cn.case_id,
              cn.author_id,
              au.name AS author_name,
              cn.body,
              cn.created_at
       FROM case_notes cn
       JOIN app_users au ON au.id = cn.author_id
       WHERE cn.case_id = $1
       ORDER BY cn.created_at DESC`,
      [caseId],
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching case notes:', err);
    return res.status(500).json({ error: 'Failed to fetch case notes' });
  }
});

router.delete('/:id/notes/:noteId', async (req, res) => {
  const caseId = parseCaseId(req.params.id);
  const { noteId } = req.params;

  if (!caseId) {
    return res.status(400).json({ error: 'Invalid case ID' });
  }

  if (!noteId) {
    return res.status(400).json({ error: 'noteId is required' });
  }

  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { rows } = await pool.query(
      `DELETE FROM case_notes
       WHERE id = $1 AND case_id = $2 AND author_id = $3
       RETURNING id, case_id, author_id, body, created_at`,
      [noteId, caseId, req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or not authorized to delete' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error deleting case note:', err);
    return res.status(500).json({ error: 'Failed to delete case note' });
  }
});

export default router;
