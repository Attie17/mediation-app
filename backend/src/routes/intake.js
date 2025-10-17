import express from 'express';
import { supabase, requireSupabaseOr500 } from '../lib/supabaseClient.js';


const router = express.Router();
router.use((req,res,next)=>{ if(!supabase) return requireSupabaseOr500(res); next(); });

// GET /health : check Supabase connectivity
router.get('/health', async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('app_users')
			.select('*')
			.limit(1);
		if (error) {
			return res.status(500).json({ success: false, error: error.message });
		}
		res.json({ success: true, data });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});


// POST /test : insert dummy record to check Supabase DB connectivity
router.post('/test', async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('intake_answers')
			.insert([
				{
					user_id: 1,
					step: 'Step1',
					answers: { demo: 'ok' }
				}
			]);
		if (error) {
			console.error('Supabase insert error:', error);
			return res.status(500).json({ success: false, error });
		}
		res.json({ success: true, data });
	} catch (err) {
		console.error('Test DB connectivity error:', err);
		res.status(500).json({ success: false, error: err.message });
	}
});

// POST / : save intake answers using Supabase
router.post('/', async (req, res) => {
	const { userId, step, answers } = req.body;
	try {
		const { data, error } = await supabase
			.from('intake_answers')
			.insert([{ user_id: userId, step, answers }])
			.select();
		if (error) {
			console.error('Intake POST error:', error);
			return res.status(500).json({ success: false, error: error.message, details: error });
		}
		res.json({ success: true, data });
	} catch (err) {
		console.error('Intake POST error:', err);
		res.status(500).json({ success: false, error: err.message });
	}
});

// GET /:userId : fetch all intake answers for a user using Supabase
router.get('/:userId', async (req, res) => {
	const { userId } = req.params;
	try {
		const { data, error } = await supabase
			.from('intake_answers')
			.select('*')
			.eq('user_id', userId);
		if (error) {
			console.error('Intake GET error:', error);
			return res.status(500).json({ success: false, error: error.message, details: error });
		}
		res.json({ success: true, data: data || [] });
	} catch (err) {
		console.error('Intake GET error:', err);
		res.status(500).json({ success: false, error: err.message });
	}
});

export default router;
