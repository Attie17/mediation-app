/**
 * User Invitations Routes
 * Handles inviting users to join organizations
 */

import express from 'express';
import { pool } from '../db.js';
import crypto from 'crypto';
import { sendInvitationEmail } from '../lib/emailService.js';
import { logActivity } from '../lib/activityLogger.js';
import { validateInviteUser } from '../middleware/validation.js';
import { emailLimiter } from '../middleware/security.js';
import logger from '../lib/logger.js';

const router = express.Router();

/**
 * POST /api/organizations/:orgId/invite
 * Invite a user to join an organization
 * Admin only
 */
router.post('/:orgId/invite', emailLimiter, validateInviteUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const { orgId } = req.params;
    const { email, role = 'mediator', message } = req.body;

    // Check if organization exists
    const orgCheck = await pool.query(
      'SELECT id, display_name, name FROM organizations WHERE id = $1 AND deleted_at IS NULL',
      [orgId]
    );

    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Organization not found' });
    }

    const organization = orgCheck.rows[0];

    // Check if user already exists
    const userCheck = await pool.query(
      'SELECT user_id, role FROM app_users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'User with this email already exists' 
      });
    }

    // Check for existing pending invitation
    const inviteCheck = await pool.query(
      `SELECT id FROM user_invitations 
       WHERE organization_id = $1 
       AND LOWER(email) = LOWER($2) 
       AND status = 'pending'`,
      [orgId, email]
    );

    if (inviteCheck.rows.length > 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Pending invitation already exists for this email' 
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const result = await pool.query(
      `INSERT INTO user_invitations (
        organization_id, email, role, invited_by, token, 
        invitation_message, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW() + INTERVAL '7 days')
      RETURNING *`,
      [orgId, email.toLowerCase(), role, req.user.id, token, message]
    );

    const invitation = result.rows[0];

    // Send invitation email
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation/${token}`;
    
    try {
      await sendInvitationEmail({
        to: email,
        organizationName: organization.display_name || organization.name,
        inviteUrl,
        message,
        role
      });
    } catch (emailError) {
      logger.error('Failed to send invitation email', { error: emailError.message, invitationId: invitation.id, email });
      // Don't fail the request if email fails - invitation is still created
    }

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'invite_user',
      targetType: 'organization',
      targetId: orgId,
      description: `Invited ${email} to join as ${role}`,
      metadata: {
        email,
        role,
        invitation_id: invitation.id
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({
      ok: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expires_at: invitation.expires_at,
        invite_url: inviteUrl // Include in response for dev/testing
      }
    });

  } catch (error) {
    logger.error('Error creating invitation', { error: error.message, organizationId: req.params?.orgId });
    res.status(500).json({ ok: false, error: 'Failed to create invitation' });
  }
});

/**
 * GET /api/organizations/:orgId/invitations
 * List all invitations for an organization
 * Admin only
 */
router.get('/:orgId/invitations', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const { orgId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT 
        i.*,
        u.name as invited_by_name,
        u.email as invited_by_email
      FROM user_invitations i
      LEFT JOIN app_users u ON u.user_id = i.invited_by
      WHERE i.organization_id = $1
    `;

    const params = [orgId];

    if (status) {
      query += ` AND i.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY i.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      ok: true,
      invitations: result.rows
    });

  } catch (error) {
    logger.error('Error fetching invitations', { error: error.message, organizationId: req.params?.orgId });
    res.status(500).json({ ok: false, error: 'Failed to fetch invitations' });
  }
});

/**
 * DELETE /api/invitations/:id
 * Cancel an invitation
 * Admin only
 */
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const { id } = req.params;

    const result = await pool.query(
      `UPDATE user_invitations 
       SET status = 'cancelled'
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Invitation not found or already processed' });
    }

    res.json({
      ok: true,
      message: 'Invitation cancelled'
    });

  } catch (error) {
    logger.error('Error cancelling invitation', { error: error.message, invitationId: req.params?.id });
    res.status(500).json({ ok: false, error: 'Failed to cancel invitation' });
  }
});

/**
 * GET /api/invitations/token/:token
 * Get invitation details by token (public endpoint for acceptance page)
 */
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Expire old invitations first
    await pool.query(`
      UPDATE user_invitations
      SET status = 'expired'
      WHERE status = 'pending' AND expires_at < NOW()
    `);

    const result = await pool.query(
      `SELECT 
        i.id,
        i.email,
        i.role,
        i.invitation_message,
        i.status,
        i.expires_at,
        i.created_at,
        o.id as organization_id,
        o.name as organization_name,
        o.display_name as organization_display_name,
        o.logo_url as organization_logo
      FROM user_invitations i
      JOIN organizations o ON o.id = i.organization_id
      WHERE i.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Invitation not found' });
    }

    const invitation = result.rows[0];

    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        ok: false, 
        error: `Invitation is ${invitation.status}`,
        status: invitation.status
      });
    }

    res.json({
      ok: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        message: invitation.invitation_message,
        expires_at: invitation.expires_at,
        organization: {
          id: invitation.organization_id,
          name: invitation.organization_name,
          displayName: invitation.organization_display_name,
          logo: invitation.organization_logo
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching invitation by token', { error: error.message, token: req.params?.token });
    res.status(500).json({ ok: false, error: 'Failed to fetch invitation' });
  }
});

/**
 * POST /api/invitations/token/:token/accept
 * Accept invitation and create user account
 */
router.post('/token/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ ok: false, error: 'Name and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
    }

    // Get invitation
    const inviteResult = await pool.query(
      `SELECT * FROM user_invitations 
       WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired invitation' });
    }

    const invitation = inviteResult.rows[0];

    // Check if user already exists
    const userCheck = await pool.query(
      'SELECT user_id FROM app_users WHERE LOWER(email) = LOWER($1)',
      [invitation.email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ ok: false, error: 'User already exists' });
    }

    // Hash password
    const bcrypt = await import('bcrypt');
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO app_users (user_id, email, name, role, organization_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING *`,
      [invitation.email.toLowerCase(), name, invitation.role, invitation.organization_id]
    );

    const user = userResult.rows[0];

    // Store password in test_users table (for dev authentication)
    await pool.query(
      `INSERT INTO test_users (id, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = $3`,
      [user.user_id, user.email, password_hash, user.role]
    );

    // Mark invitation as accepted
    await pool.query(
      `UPDATE user_invitations 
       SET status = 'accepted', accepted_at = NOW(), accepted_by_user_id = $1
       WHERE id = $2`,
      [user.user_id, invitation.id]
    );

    // Log activity
    await logActivity({
      userId: user.user_id,
      action: 'accept_invitation',
      targetType: 'organization',
      targetId: invitation.organization_id,
      description: `User ${user.email} accepted invitation`,
      metadata: {
        invitation_id: invitation.id,
        role: user.role
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({
      ok: true,
      message: 'Account created successfully',
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization_id: user.organization_id
      }
    });

  } catch (error) {
    logger.error('Error accepting invitation', { error: error.message, token: req.params?.token });
    res.status(500).json({ ok: false, error: 'Failed to create account' });
  }
});

export default router;
