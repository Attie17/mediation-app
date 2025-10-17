import express from 'express';
import { Pool } from 'pg';
import { authenticateUser } from '../middleware/authenticateUser.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for caseDashboard routes');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined,
});

const router = express.Router({ mergeParams: true });

const parseCaseId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const mapUploadStatus = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
      return 'confirmed';
    case 'rejected':
      return 'rejected';
    case 'pending':
      return 'pending';
    default:
      return status ? status.toLowerCase() : 'uploaded';
  }
};

const isActiveStatus = (status) => {
  if (!status) return true;
  return status === 'active';
};

const ensureCaseMembership = async (client, caseId, userId, requestedRole = 'participant') => {
  let caseRecord;
  try {
    const caseResult = await client.query(
      `SELECT row_to_json(c) AS data
       FROM cases c
       WHERE c.id = $1
       LIMIT 1`,
      [caseId]
    );

    if (caseResult.rowCount === 0) {
      return { allowed: false, status: 404, body: { error: 'Case not found' } };
    }

    const rawCase = caseResult.rows[0]?.data || {};
    caseRecord = {
      id: rawCase.id,
      mediator_id: rawCase.mediator_id ?? null,
      status: rawCase.status ?? null,
      created_at: rawCase.created_at ?? null,
      title: rawCase.title ?? null,
      description: rawCase.description ?? null,
    };
  } catch (error) {
    if (error.code === '42P01') {
      console.error('[dashboard] cases table missing while checking access', error);
      throw error;
    }
    if (error.code === '42703') {
      console.warn('[dashboard] cases table missing optional columns; retrying with minimal metadata');
      const fallbackResult = await client.query(
        `SELECT id, mediator_id, status, created_at
         FROM cases
         WHERE id = $1
         LIMIT 1`,
        [caseId]
      );
      if (fallbackResult.rowCount === 0) {
        return { allowed: false, status: 404, body: { error: 'Case not found' } };
      }
      const fallbackRow = fallbackResult.rows[0];
      caseRecord = {
        id: fallbackRow.id,
        mediator_id: fallbackRow.mediator_id ?? null,
        status: fallbackRow.status ?? null,
        created_at: fallbackRow.created_at ?? null,
        title: null,
        description: null,
      };
    } else {
      throw error;
    }
    throw error;
  }

  let membership = null;
  let participantsTableMissing = false;
  try {
    const membershipResult = await client.query(
      `SELECT role, status FROM case_participants WHERE case_id = $1 AND user_id = $2 LIMIT 1`,
      [caseId, userId]
    );
    membership = membershipResult.rows[0] || null;
  } catch (error) {
    if (error.code === '42P01') {
      participantsTableMissing = true;
      console.warn('[dashboard] case_participants table missing; proceeding without membership data');
    } else {
      throw error;
    }
  }

  const isCaseMediator = caseRecord.mediator_id === userId;
  const isParticipantMediator =
    membership && membership.role === 'mediator' && isActiveStatus(membership.status);

  if (isCaseMediator || isParticipantMediator) {
    return { allowed: true, role: 'mediator', membership, caseRecord };
  }

  if (membership) {
    const allowed = isActiveStatus(membership.status);
    if (!allowed) {
      return {
        allowed: false,
        status: 403,
        body: { error: 'Inactive participants cannot access this case.' },
      };
    }
    return { allowed: true, role: membership.role || 'participant', membership, caseRecord };
  }

  if (participantsTableMissing) {
    console.warn('[dashboard] Allowing degraded dashboard access because case_participants is unavailable');
    return {
      allowed: true,
      role: requestedRole || 'participant',
      membership: null,
      caseRecord,
      degraded: true,
    };
  }

  return {
    allowed: false,
    status: 403,
    body: { error: 'You do not have access to this case.' },
    caseRecord,
  };
};

router.get('/:id/dashboard', authenticateUser, async (req, res) => {
  const caseId = parseCaseId(req.params.id);

  if (!caseId) {
    return res.status(400).json({ error: 'Invalid case ID' });
  }

  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = req.user.id;

  try {
    const client = await pool.connect();
    try {
      const runOptionalQuery = async (label, sql, params = [], { fallbackRows = [], fallbackSql } = {}) => {
        try {
          const { rows } = await client.query(sql, params);
          return { rows, available: true };
        } catch (error) {
          if (error.code === '42P01') {
            if (fallbackSql) {
              console.warn(`[dashboard] ${label} falling back due to missing relation: ${error.message}`);
              try {
                const { rows } = await client.query(fallbackSql, params);
                return { rows, available: true, degraded: true };
              } catch (fallbackError) {
                if (fallbackError.code === '42P01') {
                  console.warn(`[dashboard] ${label} fallback unavailable (missing table)`);
                  return { rows: fallbackRows, available: false };
                }
                throw fallbackError;
              }
            }
            console.warn(`[dashboard] ${label} unavailable (missing table)`);
            return { rows: fallbackRows, available: false };
          }
          if (error.code === '42703') {
            console.warn(`[dashboard] ${label} unavailable (missing column): ${error.message}`);
            return { rows: fallbackRows, available: false };
          }
          console.error(`[dashboard] ${label} query failed`, error);
          throw error;
        }
      };

      const access = await ensureCaseMembership(client, caseId, userId, req.user?.role);
      if (!access.allowed) {
        return res.status(access.status).json(access.body);
      }

      const caseRecord = access.caseRecord;

      const participantsQuery = await runOptionalQuery(
        'case participants and app_users',
        `SELECT cp.user_id,
                cp.role,
                cp.status,
                cp.created_at,
                cp.updated_at,
                au.name,
                au.email
         FROM case_participants cp
         LEFT JOIN app_users au ON au.id = cp.user_id
         WHERE cp.case_id = $1
         ORDER BY cp.created_at ASC`,
        [caseId],
        {
          fallbackSql: `SELECT user_id,
                               role,
                               status,
                               created_at,
                               updated_at
                        FROM case_participants
                        WHERE case_id = $1
                        ORDER BY created_at ASC`,
        }
      );

      const notesQuery = await runOptionalQuery(
        'case notes',
        `SELECT cn.id,
                cn.body,
                cn.created_at,
                cn.author_id,
                au.name AS author_name
         FROM case_notes cn
         LEFT JOIN app_users au ON au.id = cn.author_id
         WHERE cn.case_id = $1
         ORDER BY cn.created_at DESC
         LIMIT 5`,
        [caseId],
        { fallbackRows: [] }
      );

      const uploadsQuery = await runOptionalQuery(
        'uploads',
        `SELECT id, doc_type, status, created_at, updated_at, user_id, notes
         FROM uploads
         WHERE case_id = $1
         ORDER BY created_at DESC`,
        [caseId],
        { fallbackRows: [] }
      );

      const requirementsQuery = await runOptionalQuery(
        'case requirements',
        `SELECT id, case_id, doc_type, required, created_at, updated_at, deleted_at
         FROM case_requirements
         WHERE case_id = $1
         ORDER BY created_at ASC`,
        [caseId],
        { fallbackRows: [] }
      );

      const uploads = uploadsQuery.rows;
      const latestUploadByDocType = new Map();
      uploads.forEach((upload) => {
        if (!latestUploadByDocType.has(upload.doc_type)) {
          latestUploadByDocType.set(upload.doc_type, upload);
        }
      });

      const requirements = requirementsQuery.available
        ? requirementsQuery.rows.map((reqRow) => {
            const latestUpload = latestUploadByDocType.get(reqRow.doc_type) || null;
            return {
              ...reqRow,
              status: latestUpload ? mapUploadStatus(latestUpload.status) : 'missing',
              latest_upload: latestUpload,
            };
          })
        : [];

      const response = {
        case: {
          id: caseRecord.id,
          status: caseRecord.status,
          created_at: caseRecord.created_at,
          mediator_id: caseRecord.mediator_id,
          title: caseRecord.title ?? null,
          description: caseRecord.description ?? null,
        },
        viewer_role: access.role || (req.user.role ?? 'participant'),
        participants: participantsQuery.rows.map((row) => ({
          user_id: row.user_id,
          role: row.role,
          status: row.status,
          is_active: isActiveStatus(row.status),
          created_at: row.created_at,
          updated_at: row.updated_at,
          name: row.name,
          email: row.email,
        })),
        uploads_summary: Array.from(latestUploadByDocType.values()).map((upload) => ({
          id: upload.id,
          doc_type: upload.doc_type,
          status: mapUploadStatus(upload.status),
          created_at: upload.created_at,
          updated_at: upload.updated_at,
          user_id: upload.user_id,
          notes: upload.notes,
        })),
        uploads,
        requirements,
        requirements_available: requirementsQuery.available,
      };

      if (notesQuery.available) {
        response.notes = notesQuery.rows.map((row) => ({
          id: row.id,
          body: row.body,
          created_at: row.created_at,
          author_id: row.author_id,
          author_name: row.author_name,
        }));
      }

      return res.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error building case dashboard:', error);
    return res.status(500).json({ error: 'Failed to load case dashboard.' });
  }
});

export default router;
