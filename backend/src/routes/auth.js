import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v5 as uuidv5 } from 'uuid';
import { supabase } from '../db.js';
import { validateUserRegistration, validateSignIn } from '../middleware/validation.js';
import { authLimiter } from '../middleware/security.js';
import config from '../config/index.js';
import logger from '../lib/logger.js';

const router = express.Router();

const NS = process.env.DEV_AUTH_NAMESPACE || '6f8c2b65-9e3f-4f7a-9d3d-2a3d2b1c4d10';
const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES = config.jwt.expiresIn || '7d';

router.post('/register', authLimiter, validateUserRegistration, async (req, res) => {
	logger.debug('[auth:register] enter', { contentType: req.headers['content-type'], bodyType: typeof req.body, bodyKeys: req.body && Object.keys(req.body) });
	try {
		const { email, password, name, role } = req.body || {};
		if (!email || !password) return res.status(400).json({ ok:false, error:{ code:'BAD_INPUT', message:'email and password required' }});
		const hash = await bcrypt.hash(password, 10);
		
		// Upsert to test_users table
		const { data: userData, error: userError } = await supabase
			.from('test_users')
			.upsert({ email, password_hash: hash }, { onConflict: 'email' })
			.select()
			.single();
		
		if (userError) throw userError;
		logger.debug('[auth:register] upserted test_users', { email, rowId: userData?.id });
		
		const userId = uuidv5(email, NS);
		const userRole = role && ['admin','mediator','lawyer','divorcee'].includes(role) ? role : 'divorcee';
		
		// Upsert to app_users table
		const { error: profileError } = await supabase
			.from('app_users')
			.upsert({ 
				user_id: userId, 
				email, 
				name: name || null, 
				role: userRole 
			}, { onConflict: 'user_id' });
		
		if (profileError) throw profileError;
		
		if (!JWT_SECRET) return res.status(500).json({ ok:false, error:{ code:'AUTH_NO_SECRET', message:'JWT secret not configured' }});
		const token = jwt.sign({ sub: userId, email, role: userRole }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
		logger.info('[auth:register] success', { userId, role: userRole });
		return res.json({ ok:true, token, userId, email: userData?.email });
	} catch (err) {
		logger.error('[auth:register] error', { error: err.message, stack: err.stack });
		return res.status(500).json({ ok:false, error:{ code:'AUTH_REGISTER_FAILED', message: err.message || 'register failed' }});
	}
});

router.post('/login', authLimiter, validateSignIn, async (req, res) => {
	logger.debug('[auth:login] enter', { email: req.body?.email });
	try {
		const { email, password } = req.body || {};
		
		// Query test_users table
		const { data: userData, error: userError } = await supabase
			.from('test_users')
			.select('id, email, password, password_hash')
			.eq('email', email)
			.single();
		
		if (userError || !userData) {
			return res.status(401).json({ ok:false, error:{ code:'INVALID_CREDENTIALS', message:'invalid email or password' }});
		}
		
		let hash = userData.password_hash;
		
		// Legacy password upgrade
		if (!hash && userData.password) {
			logger.warn('[auth:login] legacy password upgrade', { email });
			hash = await bcrypt.hash(userData.password, 10);
			await supabase
				.from('test_users')
				.update({ password_hash: hash, password: null, updated_at: new Date().toISOString() })
				.eq('email', email);
		}
		
		if (!hash) return res.status(401).json({ ok:false, error:{ code:'INVALID_CREDENTIALS', message:'invalid email or password' }});
		
		const ok = await bcrypt.compare(password, hash);
		if (!ok) return res.status(401).json({ ok:false, error:{ code:'INVALID_CREDENTIALS', message:'invalid email or password' }});
		
		const userId = uuidv5(email, NS);
		
		// Fetch user role and organization from app_users table
		const { data: appUserData, error: appUserError } = await supabase
			.from('app_users')
			.select('role, organization_id, name')
			.eq('user_id', userId)
			.single();
		
		const userRole = (appUserData && appUserData.role) || 'divorcee';
		const organizationId = appUserData?.organization_id || null;
		const userName = appUserData?.name || null;
		
		// If user has organization, fetch organization details
		let organizationData = null;
		if (organizationId) {
			const { data: orgData } = await supabase
				.from('organizations')
				.select('id, name, display_name, subscription_tier, subscription_status, primary_color, secondary_color, logo_url')
				.eq('id', organizationId)
				.single();
			organizationData = orgData || null;
		}
		
		if (!JWT_SECRET) return res.status(500).json({ ok:false, error:{ code:'AUTH_NO_SECRET', message:'JWT secret not configured' }});
		const token = jwt.sign({ 
			sub: userId, 
			email, 
			role: userRole,
			organization_id: organizationId 
		}, JWT_SECRET, { expiresIn: JWT_EXPIRES });
		
		logger.info('[auth:login] success', { userId, role: userRole, organization: organizationData?.name });
		return res.json({ 
			ok: true, 
			token,
			user: {
				user_id: userId,
				email,
				name: userName,
				role: userRole,
				organization_id: organizationId,
				organization: organizationData
			}
		});
	} catch (err) {
		logger.error('[auth:login] error', { error: err.message, stack: err.stack });
		return res.status(500).json({ ok:false, error:{ code:'AUTH_LOGIN_FAILED', message: err.message || 'login failed' }});
	}
});

export default router;
