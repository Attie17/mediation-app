
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

// Configure SSL for production Supabase/Railway connections
const poolConfig = {
	connectionString: databaseUrl
};

// Supabase uses connection pooling which requires SSL but doesn't provide valid certs
// This is the standard configuration for Supabase pooler connections
if (databaseUrl && (databaseUrl.includes('supabase') || databaseUrl.includes('pooler'))) {
	poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

export { supabase, pool };
