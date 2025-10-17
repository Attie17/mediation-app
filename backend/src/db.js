
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const databaseUrl = process.env.DATABASE_URL;

const supabase = createClient(supabaseUrl, supabaseKey);
const pool = new Pool({
	connectionString: databaseUrl,
	ssl: databaseUrl && databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined
});

export { supabase, pool };
