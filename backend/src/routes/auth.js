import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v5 as uuidv5 } from 'uuid';
import { supabase } from '../db.js';

const router = express.Router();

const NS = process.env.DEV_AUTH_NAMESPACE || '6f8c2b65-9e3f-4f7a-9d3d-2a3d2b1c4d10';
const JWT_SECRET = process.env.DEV_JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

router.post('/register', async (req, res) => {
	console.log('[auth:register] enter', { ct: req.headers['content-type'], type: typeof req.body, keys: req.body && Object.keys(req.body) });
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
		console.log('[auth:register] upserted test_users', { email, rowId: userData?.id });
		
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
		console.log('[auth:register] ok', { userId, role: userRole });
		return res.json({ ok:true, token, userId, email: userData?.email });
	} catch (err) {
		console.error('[auth:register] error', err);
		return res.status(500).json({ ok:false, error:{ code:'AUTH_REGISTER_FAILED', message: err.message || 'register failed' }});
	}
});

router.post('/login', async (req, res) => {
	console.log('[auth:login] enter', { email: req.body?.email });
	try {
		const { email, password } = req.body || {};
		if (!email || !password) return res.status(400).json({ ok:false, error:{ code:'BAD_INPUT', message:'email and password required' }});
		
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
			console.warn('[auth:login] legacy_upgrade', { email });
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
		if (!JWT_SECRET) return res.status(500).json({ ok:false, error:{ code:'AUTH_NO_SECRET', message:'JWT secret not configured' }});
		const token = jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
		console.log('[auth:login] ok', { userId });
		return res.json({ ok:true, token });
	} catch (err) {
		console.error('[auth:login] error', err);
		return res.status(500).json({ ok:false, error:{ code:'AUTH_LOGIN_FAILED', message: err.message || 'login failed' }});
	}
});

export default router;
