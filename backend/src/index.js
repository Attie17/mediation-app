
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`) });

import config from './config/index.js';
import logger from './lib/logger.js';
import { validateEnvironment } from './config/envValidator.js';

// Validate environment variables on startup
validateEnvironment();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { pool } from './db.js';
import { supabase } from './lib/supabaseClient.js';
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
import sessionsRouter from './routes/sessions.js';
import messagesRouter from './routes/messages.js';
import conversationsRouter from './routes/conversations.js';
import aiChatHistoryRouter from './routes/ai-chat-history.js';
import commentsRouter from './routes/comments.js';
import adminRouter from './routes/admin.js';
import organizationsRouter from './routes/organizations.js';
import caseAssignmentsRouter from './routes/caseAssignments.js';
import invitationsRouter from './routes/invitations.js';
import casesListRouter from './routes/caseslist.js';
import healthRouter from './routes/health.js';
import riskAssessmentRouter from './routes/riskAssessment.js';
import { authenticateUser } from './middleware/authenticateUser.js';
import devAuth from './middleware/devAuth.js';
import { securityHeaders, apiLimiter, requestSizeLimiter } from './middleware/security.js';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js';
import { sanitizeInput } from './middleware/validation.js';

const app = express();

// Ensure proxy headers (like X-Forwarded-For) are honored when running behind load balancers
if (config.isProduction()) {
	app.set('trust proxy', 1);
}

// Health check endpoints (before any middleware for fastest response)
app.use(healthRouter);

// Request logging using Winston
app.use(requestLogger);

// Security headers
app.use(securityHeaders);

// CORS configuration
// SECURITY: Strict origin validation in production
const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests with no origin (health checks, curl, same-origin, mobile apps, etc.)
		// These are safe because they can't access responses cross-origin anyway
		if (!origin) {
			return callback(null, true);
		}
		
		const allowedOrigins = config.cors.origin;
		
		// In production, strictly validate origin
		if (config.isProduction()) {
			if (!allowedOrigins.includes(origin)) {
				logger.warn(`Request from unauthorized origin: ${origin}`);
				return callback(new Error(`Origin ${origin} not allowed`));
			}
		}
		
		// In development, allow configured origins
		if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
			return callback(null, true);
		}
		
		callback(new Error(`Origin ${origin} not allowed`));
	},
	credentials: config.cors.credentials,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-role', 'x-dev-fake-token', 'x-dev-email', 'x-dev-user-id'],
	maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Request size limiting
app.use(requestSizeLimiter);

// Rate limiting (skip in local dev)
if (!config.isDevelopment()) {
	app.use('/api/', apiLimiter);
	logger.info('Rate limiting enabled for /api routes');
}

// Prefer native express.json first (keeps bodyParser only if needed elsewhere)
app.use(express.json({ limit: '1mb' }));
// Fallback: retain existing bodyParser.json (should be redundant but harmless)
app.use(bodyParser.json());

// SECURITY: Sanitize all input to prevent XSS attacks
app.use(sanitizeInput);

// Attach shared resources to every request
app.use((req, _res, next) => {
	req.db = pool;
	if (supabase) {
		req.supabase = supabase;
	}
	next();
});

// Dev auth must mount early so downstream routes can see req.user
// SECURITY: Only enable in development, never in production
if (config.security.enableDevMode && !config.isProduction()) {
	app.use(devAuth);
	logger.info('Development auth middleware enabled');
}

// Developer tooling endpoints
// SECURITY: Only enable in development, never in production
if (config.security.enableDevMode && !config.isProduction()) {
	app.get('/api/debug/test-users/:email', async (req, res) => {
		try {
			const { rows } = await pool.query(`SELECT id,email,(password IS NOT NULL) AS has_password,(password_hash IS NOT NULL) AS has_hash FROM public.test_users WHERE email=$1`, [req.params.email]);
			return res.json({ ok: true, row: rows[0] || null });
		} catch (error) {
			logger.error('Failed to fetch test user', { error: error.message });
			return res.status(500).json({ ok: false, error: error.message });
		}
	});

	app.get('/api/debug/app-users-columns', async (_req, res) => {
		try {
			const { rows } = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='app_users' ORDER BY ordinal_position");
			return res.json({ ok: true, columns: rows.map((r) => r.column_name) });
		} catch (error) {
			logger.error('Failed to fetch app_users columns', { error: error.message });
			return res.status(500).json({ ok: false, error: error.message });
		}
	});

	app.get('/api/debug/db-state', async (req, res) => {
		try {
			const results = {};
			const testUsersCount = await pool.query(`SELECT COUNT(*) as count FROM public.test_users`);
			results.test_users_count = parseInt(testUsersCount.rows[0].count, 10);
			const appUsersCount = await pool.query(`SELECT COUNT(*) as count FROM public.app_users`);
			results.app_users_count = parseInt(appUsersCount.rows[0].count, 10);
			const testUser = await pool.query(`SELECT id, email, password IS NOT NULL as has_password, password_hash IS NOT NULL as has_hash FROM public.test_users WHERE email='tokenuser@example.com'`);
			results.tokenuser_in_test_users = testUser.rows[0] || null;
			const NS = process.env.DEV_AUTH_NAMESPACE || '6f8c2b65-9e3f-4f7a-9d3d-2a3d2b1c4d10';
			const { v5: uuidv5 } = await import('uuid');
			const expectedUserId = uuidv5('tokenuser@example.com', NS);
			results.expected_user_id = expectedUserId;
			const appUser = await pool.query(`SELECT user_id, email, role, created_at FROM public.app_users WHERE user_id=$1`, [expectedUserId]);
			results.tokenuser_in_app_users = appUser.rows[0] || null;
			return res.json({ ok: true, db_state: results });
		} catch (error) {
			logger.error('[debug:db-state] failed', { error: error.message, stack: error.stack });
			return res.status(500).json({ ok: false, error: error.message, stack: error.stack });
		}
	});
}

// JSON parse error handler MUST come immediately after parsers so we surface clean 400s
app.use((err, req, res, next) => {
	if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
		logger.warn('Invalid JSON payload', {
			method: req.method,
			url: req.url,
			contentType: req.headers['content-type'],
		});
		return res.status(400).json({ ok: false, error: { code: 'BAD_JSON', message: 'Invalid JSON body' } });
	}
	return next(err);
});

// DEBUG MIDDLEWARE - Log all requests at app level (after parse-error handler)
app.use((req, res, next) => {
	logger.debug(`request ${req.method} ${req.url}`);
	next();
});

app.get('/', (req, res) => {
	res.json({ message: 'Divorce Mediation API running' });
});

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes); // alias under /api for future consistency
logger.debug('Auth routes mounted');

app.use('/intake', intakeRoutes);

app.use('/api/uploads', uploadsRouter);
logger.debug('Uploads routes mounted at /api/uploads');

app.use('/api/notifications', notificationsRouter);
logger.debug('Notifications routes mounted at /api/notifications');

app.use('/api/cases', caseOverviewRouter);
app.use('/api/cases', caseDashboardRouter);
app.use('/api/cases', caseNotesRouter);
app.use('/api/cases', casesRouter);
app.use('/api/cases', participantsRouter);
app.use('/api/caseslist', authenticateUser, casesListRouter);
logger.debug('Case routes mounted at /api/cases');

app.use('/api/users', usersRouter);
app.use('/api/users', riskAssessmentRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/admin', adminRouter);
logger.debug('User and admin routes mounted');

app.use('/api/organizations', authenticateUser, organizationsRouter);
app.use('/api/organizations', authenticateUser, invitationsRouter);
app.use('/api/invitations', invitationsRouter);
logger.debug('Organization routes mounted');

app.use('/api/case-assignments', authenticateUser, caseAssignmentsRouter);

app.use('/api/chat', chatRouter);
app.use('/api/ai', aiRouter);
app.use('/api/settlement-sessions', settlementSessionsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/ai-chat-history', aiChatHistoryRouter);
app.use('/api/comments', commentsRouter);
logger.debug('Communication routes mounted');

// SECURITY: Debug endpoints only available in development
if (!config.isProduction()) {
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
	logger.info('Debug endpoints enabled (/api/debug/*)');
}
app.use('/dashboard', dashboardRoutes);
logger.debug('Dashboard routes mounted');

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
	} catch (error) {
		logger.error('[healthz] database check failed', { error: error.message });
		return res.status(500).json({ ok: false, error: 'DB_UNAVAILABLE' });
	}
});

// 404 and error handling middleware must come last
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;
const HOST = config.host;

app.listen(PORT, HOST, () => {
	logger.info(`Server running on ${HOST}:${PORT}`);
	logger.info(`Environment: ${config.env}`);
	logger.info(`Development mode: ${config.security.enableDevMode ? 'enabled' : 'disabled'}`);
	logger.info(`Frontend origin: ${config.frontendUrl}`);
});
