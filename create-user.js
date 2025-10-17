// create-user.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = 'mediator.new@example.com';
const PASSWORD = 'RealMediatorPass123!';
const META = { role: 'mediator' };

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create user with email_confirmed
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: META,
    app_metadata: META,
  });

  if (error) {
    console.error('❌ Failed to create user:', error.message);
    process.exit(1);
  }

  const user = data.user || data;
  const userId = user.id || user.user?.id;
  console.log('✅ Created user:', EMAIL);
  console.log('🆔 User ID:', userId);

  // Output SQL for linking user
  console.log('\n--- RUN THIS SQL IN SUPABASE SQL EDITOR ---');
  console.log(`INSERT INTO app_users (id, role, email, name) VALUES ('${userId}', 'mediator', '${EMAIL}', 'Test Mediator') ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email, name = EXCLUDED.name;`);
  console.log(`UPDATE cases SET mediator_id = '${userId}' WHERE id = 9102;`);
  console.log('--- END SQL ---\n');
}

main();
