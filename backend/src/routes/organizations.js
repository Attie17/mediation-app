/**
 * Organization Management Routes
 * Admin-only routes for managing mediator organizations
 */

import express from 'express';
import { pool } from '../db.js';
import { logActivity } from '../lib/activityLogger.js';
import { validateCreateOrganization, validateUpdateOrganization, validators, validateRequest } from '../middleware/validation.js';
import { createLimiter } from '../middleware/security.js';
import logger from '../lib/logger.js';

const router = express.Router();

/**
 * GET /api/organizations
 * List all organizations (admin only)
 */
router.get('/', async (req, res) => {
  try {
    // Only admins can list all organizations
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { status, tier, search } = req.query;
    
    let query = `
      SELECT 
        o.*,
        sp.display_name as plan_name,
        sp.price_monthly_cents,
        (SELECT COUNT(*) FROM app_users WHERE organization_id = o.id AND role = 'mediator') as mediator_count,
        (SELECT COUNT(*) FROM cases WHERE organization_id = o.id AND status NOT IN ('closed', 'archived')) as active_cases_count,
        (SELECT COUNT(*) FROM app_users WHERE organization_id = o.id) as total_users
      FROM organizations o
      LEFT JOIN subscriptions s ON s.organization_id = o.id AND s.status = 'active'
      LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
      WHERE o.deleted_at IS NULL
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND o.subscription_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (tier) {
      query += ` AND o.subscription_tier = $${paramIndex}`;
      params.push(tier);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (o.name ILIKE $${paramIndex} OR o.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ' ORDER BY o.created_at DESC';
    
    const result = await pool.query(query, params);
    
    await logActivity({
      userId: req.user.id,
      actionType: 'ORGANIZATION_LIST_VIEWED',
      targetType: 'organization',
      targetId: null,
      description: `Viewed organizations list (${result.rows.length} results)`,
      metadata: { 
        count: result.rows.length,
        filters: { status, tier, search }
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      ok: true,
      organizations: result.rows
    });
    
  } catch (error) {
    logger.error('Error fetching organizations', { error: error.message });
    res.status(500).json({ ok: false, error: 'Failed to fetch organizations' });
  }
});

/**
 * GET /api/organizations/:id
 * Get single organization details
 */
router.get('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        o.*,
        sp.display_name as plan_name,
        sp.price_monthly_cents,
        s.billing_cycle,
        s.current_period_end,
        (SELECT COUNT(*) FROM app_users WHERE organization_id = o.id) as total_users,
        (SELECT COUNT(*) FROM app_users WHERE organization_id = o.id AND role = 'mediator') as mediator_count,
        (SELECT COUNT(*) FROM app_users WHERE organization_id = o.id AND role = 'divorcee') as divorcee_count,
        (SELECT COUNT(*) FROM cases WHERE organization_id = o.id) as total_cases,
  (SELECT COUNT(*) FROM cases WHERE organization_id = o.id AND status IN ('open', 'in_progress')) as active_cases
      FROM organizations o
      LEFT JOIN subscriptions s ON s.organization_id = o.id AND s.status = 'active'
      LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
      WHERE o.id = $1 AND o.deleted_at IS NULL
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Organization not found' });
    }
    
    res.json({
      ok: true,
      organization: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Error fetching organization', { error: error.message, organizationId: req.params?.id });
    res.status(500).json({ ok: false, error: 'Failed to fetch organization' });
  }
});

/**
 * POST /api/organizations
 * Create new organization
 */
router.post('/', createLimiter, validateCreateOrganization, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const {
      name,
      display_name,
      email,
      phone,
      subscription_tier = 'trial',
      max_active_cases,
      max_mediators,
      storage_limit_mb
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ ok: false, error: 'Organization name is required' });
    }
    
    // Set defaults based on tier
    const tierDefaults = {
      trial: { cases: 5, mediators: 1, storage: 1000 },
      basic: { cases: 20, mediators: 1, storage: 5000 },
      pro: { cases: 100, mediators: 5, storage: 20000 },
      enterprise: { cases: null, mediators: null, storage: null }
    };
    
    const defaults = tierDefaults[subscription_tier] || tierDefaults.trial;
    
    const result = await pool.query(`
      INSERT INTO organizations (
        name,
        display_name,
        email,
        phone,
        subscription_tier,
        subscription_status,
        max_active_cases,
        max_mediators,
        storage_limit_mb,
        trial_ends_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      name,
      display_name || name,
      email,
      phone,
      subscription_tier,
      subscription_tier === 'trial' ? 'trialing' : 'active',
      max_active_cases || defaults.cases,
      max_mediators || defaults.mediators,
      storage_limit_mb || defaults.storage,
      subscription_tier === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null
    ]);
    
    await logActivity({
      userId: req.user.id,
      actionType: 'ORGANIZATION_CREATED',
      targetType: 'organization',
      targetId: result.rows[0].id,
      description: `Created organization: ${result.rows[0].name}`,
      metadata: {
        organization_id: result.rows[0].id,
        name: result.rows[0].name,
        tier: subscription_tier
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      ok: true,
      organization: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Error creating organization', { error: error.message });
    res.status(500).json({ ok: false, error: 'Failed to create organization' });
  }
});

/**
 * PUT /api/organizations/:id
 * Update organization
 */
router.put('/:id', validateUpdateOrganization, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const allowedFields = [
      'name', 'display_name', 'email', 'phone', 'website', 'address',
      'subscription_tier', 'subscription_status', 'max_active_cases',
      'max_mediators', 'storage_limit_mb', 'logo_url',
      'tagline', 'primary_color', 'secondary_color'
    ];
    
    const setClause = [];
    const values = [];
    let paramIndex = 1;
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });
    
    if (setClause.length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid fields to update' });
    }
    
    values.push(id);
    
    const result = await pool.query(`
      UPDATE organizations
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Organization not found' });
    }
    
    await logActivity({
      userId: req.user.id,
      actionType: 'ORGANIZATION_UPDATED',
      targetType: 'organization',
      targetId: id,
      description: `Updated organization: ${result.rows[0].name}`,
      metadata: {
        organization_id: id,
        updated_fields: Object.keys(updates),
        updates
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      ok: true,
      organization: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Error updating organization', { error: error.message, organizationId: req.params?.id });
    res.status(500).json({ ok: false, error: 'Failed to update organization' });
  }
});

/**
 * DELETE /api/organizations/:id
 * Soft delete organization
 */
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    // Soft delete
    const result = await pool.query(`
      UPDATE organizations
      SET deleted_at = NOW(), subscription_status = 'canceled'
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING name
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Organization not found' });
    }
    
    await logActivity({
      userId: req.user.id,
      actionType: 'ORGANIZATION_DELETED',
      targetType: 'organization',
      targetId: id,
      description: `Deleted organization: ${result.rows[0].name}`,
      metadata: {
        organization_id: id,
        name: result.rows[0].name
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      ok: true,
      message: 'Organization deleted successfully'
    });
    
  } catch (error) {
    logger.error('Error deleting organization', { error: error.message, organizationId: req.params?.id });
    res.status(500).json({ ok: false, error: 'Failed to delete organization' });
  }
});

/**
 * GET /api/organizations/:id/users
 * Get all users in an organization
 */
router.get('/:id/users', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    const result = await pool.query(`
  SELECT user_id, email, role, name, created_at
      FROM app_users
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `, [id]);
    
    res.json({
      ok: true,
      users: result.rows
    });
    
  } catch (error) {
    logger.error('Error fetching organization users', { error: error.message, organizationId: req.params?.id });
    res.status(500).json({ ok: false, error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/organizations/:id/cases
 * Get all cases in an organization
 */
router.get('/:id/cases', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM case_participants WHERE case_id = c.id) as participant_count
      FROM cases c
      WHERE c.organization_id = $1
      ORDER BY c.created_at DESC
    `, [id]);
    
    res.json({
      ok: true,
      cases: result.rows
    });
    
  } catch (error) {
      logger.error('Error fetching organization cases', { error: error.message, organizationId: req.params?.id });
      res.status(500).json({ ok: false, error: 'Failed to fetch organization cases' });
  }
});

/**
 * GET /api/organizations/:id/stats
 * Get detailed stats for an organization
 */
router.get('/:id/stats', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM app_users WHERE organization_id = $1) as total_users,
        (SELECT COUNT(*) FROM app_users WHERE organization_id = $1 AND role = 'mediator') as mediators,
        (SELECT COUNT(*) FROM app_users WHERE organization_id = $1 AND role = 'divorcee') as divorcees,
        (SELECT COUNT(*) FROM cases WHERE organization_id = $1) as total_cases,
  (SELECT COUNT(*) FROM cases WHERE organization_id = $1 AND status IN ('open', 'in_progress')) as active_cases,
  (SELECT COUNT(*) FROM cases WHERE organization_id = $1 AND status IN ('closed', 'archived')) as resolved_cases,
  (SELECT COALESCE(storage_used_mb, 0) FROM organizations WHERE id = $1) as storage_used_mb
    `, [id]);
    
    res.json({
      ok: true,
      stats: result.rows[0]
    });
    
  } catch (error) {
      logger.error('Error fetching organization stats', { error: error.message, organizationId: req.params?.id });
      res.status(500).json({ ok: false, error: 'Failed to fetch organization stats' });
  }
});

/**
 * GET /api/organizations/:id/branding
 * Get organization branding (public route - no admin required)
 * Used by mediators and divorcees to load organization-specific branding
 */
router.get('/:id/branding', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id,
        name,
        display_name,
        tagline,
        logo_url,
        website,
        email,
        phone,
        address,
        primary_color,
        secondary_color,
        branding_config
      FROM organizations
      WHERE id = $1 AND deleted_at IS NULL
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Organization not found' });
    }
    
    const org = result.rows[0];
    
    res.json({
      ok: true,
      branding: {
        organizationName: org.name,
        displayName: org.display_name || org.name,
        tagline: org.tagline,
        logoUrl: org.logo_url,
        website: org.website,
        email: org.email,
        phone: org.phone,
        address: org.address,
        primaryColor: org.primary_color || '#3b82f6',
        secondaryColor: org.secondary_color || '#10b981',
        config: org.branding_config || {}
      }
    });
    
  } catch (error) {
      logger.error('Error fetching organization branding', { error: error.message, organizationId: req.params?.id });
      res.status(500).json({ ok: false, error: 'Failed to fetch branding information' });
  }
});

export default router;

