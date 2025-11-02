/**
 * Case Assignment Routes
 * Admin routes for assigning mediators to cases
 */

import express from 'express';
import { pool } from '../db.js';
import { logActivity } from '../lib/activityLogger.js';

const router = express.Router();

/**
 * GET /api/case-assignments
 * List all case assignments (with filters)
 */
router.get('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { status, mediator_id, organization_id } = req.query;
    
    let query = `
      SELECT 
        ca.*,
  COALESCE(c.description, 'Case #' || c.short_id::text) as case_title,
        c.description as case_description,
        c.status as case_status,
        m.email as mediator_email,
        m.name as mediator_name,
        assigned_by_user.email as assigned_by_email
      FROM case_assignments ca
      JOIN cases c ON c.id = ca.case_id
      JOIN app_users m ON m.user_id = ca.mediator_id
      LEFT JOIN app_users assigned_by_user ON assigned_by_user.user_id = ca.assigned_by
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND ca.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (mediator_id) {
      query += ` AND ca.mediator_id = $${paramIndex}`;
      params.push(mediator_id);
      paramIndex++;
    }
    
    if (organization_id) {
      query += ` AND ca.organization_id = $${paramIndex}`;
      params.push(organization_id);
      paramIndex++;
    }
    
    query += ' ORDER BY ca.assigned_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      ok: true,
      assignments: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching case assignments:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch assignments' });
  }
});

/**
 * GET /api/case-assignments/unassigned
 * Get cases without a mediator assigned
 */
router.get('/unassigned', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { organization_id } = req.query;
    
    let query = `
      SELECT 
        c.*,
        o.name as organization_name,
        (SELECT COUNT(*) FROM case_participants WHERE case_id = c.id) as participant_count,
        NULL::text as created_by_email
      FROM cases c
      LEFT JOIN case_assignments ca ON ca.case_id = c.id AND ca.status = 'active'
      LEFT JOIN organizations o ON o.id = c.organization_id
      WHERE ca.id IS NULL
    `;
    
    const params = [];
    
    if (organization_id) {
      query += ' AND c.organization_id = $1';
      params.push(organization_id);
    }
    
    query += ' ORDER BY c.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      ok: true,
      unassignedCases: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching unassigned cases:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch unassigned cases' });
  }
});

/**
 * GET /api/case-assignments/mediator-workload
 * Get mediator workload stats for assignment decisions
 */
router.get('/mediator-workload', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { organization_id } = req.query;
    
    let query = `
      SELECT 
        m.user_id,
        m.email,
        m.name,
        m.organization_id,
        o.name as organization_name,
        COUNT(ca.id) FILTER (WHERE ca.status = 'active') as active_cases,
        COUNT(ca.id) FILTER (WHERE ca.status = 'completed') as completed_cases,
        o.max_active_cases as org_case_limit
      FROM app_users m
      LEFT JOIN case_assignments ca ON ca.mediator_id = m.user_id
      LEFT JOIN organizations o ON o.id = m.organization_id
      WHERE m.role = 'mediator'
    `;
    
    const params = [];
    
    if (organization_id) {
      query += ' AND m.organization_id = $1';
      params.push(organization_id);
    }
    
    query += ` 
      GROUP BY m.user_id, m.email, m.name, m.organization_id, o.name, o.max_active_cases
      ORDER BY active_cases ASC, m.name ASC
    `;
    
    const result = await pool.query(query, params);
    
    // Add availability flag
    const mediators = result.rows.map(mediator => ({
      ...mediator,
      available: mediator.org_case_limit === null || mediator.active_cases < mediator.org_case_limit
    }));
    
    res.json({
      ok: true,
      mediators
    });
    
  } catch (error) {
    console.error('Error fetching mediator workload:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch mediator workload' });
  }
});

/**
 * POST /api/case-assignments
 * Assign a mediator to a case
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { case_id, mediator_id, notes } = req.body;
    
    if (!case_id || !mediator_id) {
      return res.status(400).json({ 
        ok: false, 
        error: 'case_id and mediator_id are required' 
      });
    }
    
    await client.query('BEGIN');
    
    // Verify case exists and get organization
    const caseResult = await client.query(
      'SELECT id, organization_id, title FROM cases WHERE id = $1',
      [case_id]
    );
    
    if (caseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, error: 'Case not found' });
    }
    
    const caseData = caseResult.rows[0];
    
    // Verify mediator exists and belongs to same organization
    const mediatorResult = await client.query(
      'SELECT user_id, email, organization_id FROM app_users WHERE user_id = $1 AND role = $2',
      [mediator_id, 'mediator']
    );
    
    if (mediatorResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, error: 'Mediator not found' });
    }
    
    const mediatorData = mediatorResult.rows[0];
    
    // Check if mediator belongs to same organization
    if (mediatorData.organization_id !== caseData.organization_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        ok: false, 
        error: 'Mediator must belong to the same organization as the case' 
      });
    }
    
    // Check if case is already assigned
    const existingAssignment = await client.query(
      'SELECT id FROM case_assignments WHERE case_id = $1 AND status = $2',
      [case_id, 'active']
    );
    
    if (existingAssignment.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        ok: false, 
        error: 'Case is already assigned to a mediator. Use reassignment endpoint to change mediator.' 
      });
    }
    
    // Create assignment
    const assignmentResult = await client.query(`
      INSERT INTO case_assignments (
        case_id,
        mediator_id,
        organization_id,
        assigned_by,
        status,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      case_id,
      mediator_id,
      caseData.organization_id,
  req.user.id,
      'active',
      notes
    ]);
    
    // Update case with mediator_id
    await client.query(
      'UPDATE cases SET mediator_id = $1 WHERE id = $2',
      [mediator_id, case_id]
    );
    
    await client.query('COMMIT');
    
    await logActivity({
      userId: req.user.id,
      actionType: 'CASE_ASSIGNED',
      targetType: 'case',
      targetId: case_id,
      description: `Assigned case "${caseData.title}" to mediator ${mediatorData.email}`,
      metadata: {
        case_id,
        mediator_id,
        case_title: caseData.title,
        mediator_email: mediatorData.email,
        notes
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      ok: true,
      assignment: assignmentResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating case assignment:', error);
    res.status(500).json({ ok: false, error: 'Failed to assign case' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/case-assignments/:id/reassign
 * Reassign a case to a different mediator
 */
router.put('/:id/reassign', async (req, res) => {
  const client = await pool.connect();
  
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { id } = req.params;
    const { new_mediator_id, notes } = req.body;
    
    if (!new_mediator_id) {
      return res.status(400).json({ ok: false, error: 'new_mediator_id is required' });
    }
    
    await client.query('BEGIN');
    
    // Get current assignment
    const currentAssignment = await client.query(
      'SELECT * FROM case_assignments WHERE id = $1',
      [id]
    );
    
    if (currentAssignment.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, error: 'Assignment not found' });
    }
    
    const assignment = currentAssignment.rows[0];
    
    // Mark old assignment as reassigned
    await client.query(
      'UPDATE case_assignments SET status = $1, unassigned_at = NOW() WHERE id = $2',
      ['reassigned', id]
    );
    
    // Create new assignment
    const newAssignment = await client.query(`
      INSERT INTO case_assignments (
        case_id,
        mediator_id,
        organization_id,
        assigned_by,
        status,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      assignment.case_id,
      new_mediator_id,
      assignment.organization_id,
  req.user.id,
      'active',
      notes || 'Reassigned from previous mediator'
    ]);
    
    // Update case
    await client.query(
      'UPDATE cases SET mediator_id = $1 WHERE id = $2',
      [new_mediator_id, assignment.case_id]
    );
    
    await client.query('COMMIT');
    
    await logActivity({
      userId: req.user.id,
      actionType: 'CASE_REASSIGNED',
      targetType: 'case',
      targetId: assignment.case_id,
      description: `Reassigned case to new mediator`,
      metadata: {
        case_id: assignment.case_id,
        old_mediator_id: assignment.mediator_id,
        new_mediator_id,
        notes
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      ok: true,
      assignment: newAssignment.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reassigning case:', error);
    res.status(500).json({ ok: false, error: 'Failed to reassign case' });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/case-assignments/:id
 * Unassign a mediator from a case
 */
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE case_assignments
      SET status = 'unassigned', unassigned_at = NOW()
      WHERE id = $1 AND status = 'active'
      RETURNING case_id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Assignment not found' });
    }
    
    // Clear mediator from case
    await pool.query(
      'UPDATE cases SET mediator_id = NULL WHERE id = $1',
      [result.rows[0].case_id]
    );
    
    await logActivity({
      userId: req.user.id,
      actionType: 'CASE_UNASSIGNED',
      targetType: 'case',
      targetId: result.rows[0].case_id,
      description: `Unassigned case from mediator`,
      metadata: {
        assignment_id: id,
        case_id: result.rows[0].case_id
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      ok: true,
      message: 'Case unassigned successfully'
    });
    
  } catch (error) {
    console.error('Error unassigning case:', error);
    res.status(500).json({ ok: false, error: 'Failed to unassign case' });
  }
});

export default router;
