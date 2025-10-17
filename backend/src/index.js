
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "loaded" : "missing");
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import intakeRoutes from './routes/intake.js';
import uploadsRouter from './routes/uploads.js';
import notificationsRouter from './routes/notifications.js';
import casesRouter from './routes/cases.js';
import caseNotesRouter from './routes/caseNotes.js';
import caseDashboardRouter from './routes/caseDashboard.js';
import caseOverviewRouter from './routes/caseOverview.js';
import participantsRouter from './routes/participants.js';
import usersRouter from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import chatRouter from './routes/chat.js';
import aiRouter from './routes/ai.js';
import settlementSessionsRouter from './routes/settlementSessions.js';
import { authenticateUser } from './middleware/authenticateUser.js';
import devAuth from './middleware/devAuth.js';

const app = express();

app.use(cors());
// Prefer native express.json first (keeps bodyParser only if needed elsewhere)
app.use(express.json({ limit: '1mb' }));
// Fallback: retain existing bodyParser.json (should be redundant but harmless)
app.use(bodyParser.json());

// Dev auth must mount early so downstream routes can see req.user
if (process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_ENABLED === 'true') {
	app.use(devAuth);
	console.log('[devAuth] enabled');
}
// Dev-only inspector for test_users
if (process.env.DEV_AUTH_ENABLED === 'true') {
	app.get('/api/debug/test-users/:email', async (req, res) => {
		try {
			const { rows } = await pool.query(`SELECT id,email,(password IS NOT NULL) AS has_password,(password_hash IS NOT NULL) AS has_hash FROM public.test_users WHERE email=$1`, [req.params.email]);
			return res.json({ ok: true, row: rows[0] || null });
		} catch (e) {
			return res.status(500).json({ ok:false, error: e.message });
		}
	});
	// TEMP: debug app_users column names to diagnose /api/users/me failures
	app.get('/api/debug/app-users-columns', async (_req, res) => {
		try {
			const { rows } = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='app_users' ORDER BY ordinal_position");
			return res.json({ ok:true, columns: rows.map(r => r.column_name) });
		} catch (e) {
			return res.status(500).json({ ok:false, error: e.message });
		}
	});
	// Raw DB state dump - bypasses all middleware
	app.get('/api/debug/db-state', async (req, res) => {
		try {
			const results = {};
			const testUsersCount = await pool.query(`SELECT COUNT(*) as count FROM public.test_users`);
			results.test_users_count = parseInt(testUsersCount.rows[0].count);
			const appUsersCount = await pool.query(`SELECT COUNT(*) as count FROM public.app_users`);
			results.app_users_count = parseInt(appUsersCount.rows[0].count);
			const testUser = await pool.query(`SELECT id, email, password IS NOT NULL as has_password, password_hash IS NOT NULL as has_hash FROM public.test_users WHERE email='tokenuser@example.com'`);
			results.tokenuser_in_test_users = testUser.rows[0] || null;
			const NS = process.env.DEV_AUTH_NAMESPACE || '6f8c2b65-9e3f-4f7a-9d3d-2a3d2b1c4d10';
			const { v5: uuidv5 } = await import('uuid');
			const expectedUserId = uuidv5('tokenuser@example.com', NS);
			results.expected_user_id = expectedUserId;
			const appUser = await pool.query(`SELECT user_id, email, role, created_at FROM public.app_users WHERE user_id=$1`, [expectedUserId]);
			results.tokenuser_in_app_users = appUser.rows[0] || null;
			return res.json({ ok: true, db_state: results });
		} catch (e) {
			console.error('[debug:db-state] error', e);
			return res.status(500).json({ ok: false, error: e.message, stack: e.stack });
		}
	});
}

// JSON parse error handler MUST come immediately after parsers so we surface clean 400s
app.use((err, req, res, next) => {
	if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
		console.warn('[json] parse error on', req.method, req.url, 'content-type:', req.headers['content-type']);
		return res.status(400).json({ ok: false, error: { code: 'BAD_JSON', message: 'Invalid JSON body' } });
	}
	return next(err);
});

// DEBUG MIDDLEWARE - Log all requests at app level (after parse-error handler)
app.use((req, res, next) => {
	console.log(`ðŸ” APP DEBUG: ${req.method} ${req.url}`);
	next();
});

app.get('/', (req, res) => {
	res.json({ message: 'Divorce Mediation API running' });
});

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes); // alias under /api for future consistency
console.log('Auth routes mounted at /auth');
console.log('Auth routes (alias) mounted at /api/auth');
app.use('/intake', intakeRoutes);
app.use('/api/uploads', uploadsRouter);
console.log('Uploads routes mounted at /api/uploads');
app.use('/api/notifications', notificationsRouter);
console.log('Notifications routes mounted at /api/notifications');
app.use('/api/cases', caseOverviewRouter);
console.log('Case overview routes mounted at /api/cases');
app.use('/api/cases', caseDashboardRouter);
console.log('Case dashboard routes mounted at /api/cases');
app.use('/api/cases', caseNotesRouter);
console.log('Case notes routes mounted at /api/cases');
app.use('/api/cases', casesRouter);
console.log('Cases routes mounted at /api/cases');
app.use('/api/cases', participantsRouter);
console.log('Participants routes mounted at /api/cases');
app.use('/api/users', usersRouter);
console.log('Users routes mounted at /api/users');
app.use('/api/chat', chatRouter);
console.log('Chat routes mounted at /api/chat');
app.use('/api/ai', aiRouter);
app.use('/api/settlement-sessions', settlementSessionsRouter);
console.log('Settlement sessions routes mounted at /api/settlement-sessions');
console.log('AI routes mounted at /api/ai');
// whoami (works with devAuth or real auth). If real auth required strictly, add authenticateUser in chain.
app.get('/api/debug/whoami', (req, res) => {
  return res.json({ ok: true, user: req.user || null });
});
// Non-secret env presence check
app.get('/api/debug/env', (req, res) => {
	const keys = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_KEY','DATABASE_URL'];
	const presence = Object.fromEntries(keys.map(k => [k, process.env[k] ? true : false]));
	return res.json({ ok: true, env: presence });
});
app.use('/dashboard', dashboardRoutes);

// Health check endpoint (service & DB)
app.get('/healthz', async (req, res) => {
	try {
		const db = await pool.query('SELECT 1 as ok');
		return res.json({
			ok: true,
			service: 'backend',
			db: db.rows?.[0]?.ok === 1,
			time: new Date().toISOString(),
		});
	} catch (e) {
		console.error('[healthz] DB check failed:', e);
		return res.status(500).json({ ok: false, error: 'DB_UNAVAILABLE' });
	}
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
