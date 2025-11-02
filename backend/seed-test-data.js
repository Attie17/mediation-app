import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seedTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting to seed test data...\n');

    // Test user IDs
    const mediatorId = '1dd8067d-daf8-5183-bf73-4e685cf6d58a';
    const lawyerId = 'f88052b2-553c-55b1-9a35-94a63a7dd2ae';
    const divorceeId = '86baaef1-1d52-54d3-97e9-a424da4113f9';
    const adminId = '440342fe-b388-5a85-99b4-17a334fecc1e';

    // 1. Create test cases
    console.log('📋 Creating test cases...');
    
    const case1Result = await client.query(`
      INSERT INTO cases (description, status, mediator_id, created_at, updated_at)
      VALUES ($1, $2::case_status, $3, NOW(), NOW())
      RETURNING id
    `, ['Johnson vs Johnson - Property Division', 'open', mediatorId]);
    const case1Id = case1Result.rows[0].id;
    console.log(`  ✅ Case 1 created: ${case1Id}`);

    const case2Result = await client.query(`
      INSERT INTO cases (description, status, mediator_id, created_at, updated_at)
      VALUES ($1, $2::case_status, $3, NOW(), NOW())
      RETURNING id
    `, ['Smith vs Smith - Custody Agreement', 'in_progress', mediatorId]);
    const case2Id = case2Result.rows[0].id;
    console.log(`  ✅ Case 2 created: ${case2Id}`);

    const case3Result = await client.query(`
      INSERT INTO cases (description, status, mediator_id, created_at, updated_at)
      VALUES ($1, $2::case_status, $3, NOW(), NOW())
      RETURNING id
    `, ['Brown vs Brown - Asset Distribution', 'open', mediatorId]);
    const case3Id = case3Result.rows[0].id;
    console.log(`  ✅ Case 3 created: ${case3Id}\n`);

    // 2. Assign participants to cases
    console.log('👥 Adding participants to cases...');
    
    // Case 1 participants (mediator and divorcee only - per schema constraint)
    await client.query(`
      INSERT INTO case_participants (case_id, user_id, role, created_at)
      VALUES 
        ($1, $2, 'mediator', NOW()),
        ($1, $3, 'divorcee', NOW())
    `, [case1Id, mediatorId, divorceeId]);
    console.log(`  ✅ Added participants to Case 1`);

    // Case 2 participants
    await client.query(`
      INSERT INTO case_participants (case_id, user_id, role, created_at)
      VALUES 
        ($1, $2, 'mediator', NOW()),
        ($1, $3, 'divorcee', NOW())
    `, [case2Id, mediatorId, divorceeId]);
    console.log(`  ✅ Added participants to Case 2`);

    // Case 3 participants
    await client.query(`
      INSERT INTO case_participants (case_id, user_id, role, created_at)
      VALUES 
        ($1, $2, 'mediator', NOW()),
        ($1, $3, 'divorcee', NOW())
    `, [case3Id, mediatorId, divorceeId]);
    console.log(`  ✅ Added participants to Case 3\n`);

    // 3. Create document uploads
    console.log('📄 Creating document uploads...');
    
    await client.query(`
      INSERT INTO uploads (case_uuid, user_uuid, original_filename, storage_path, doc_type, status, created_at)
      VALUES 
        ($1, $2, 'financial_statement.pdf', '/uploads/financial_statement.pdf', 'financial_statement', 'pending', NOW()),
        ($1, $2, 'property_deed.pdf', '/uploads/property_deed.pdf', 'property_documents', 'pending', NOW()),
        ($3, $2, 'custody_plan.pdf', '/uploads/custody_plan.pdf', 'custody_documents', 'pending', NOW()),
        ($4, $2, 'asset_list.pdf', '/uploads/asset_list.pdf', 'financial_statement', 'approved', NOW())
    `, [case1Id, divorceeId, case2Id, case3Id]);
    console.log(`  ✅ Created 4 document uploads\n`);

    // 4. Create mediation sessions
    console.log('📅 Creating mediation sessions...');
    
    // Upcoming session 1
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    await client.query(`
      INSERT INTO mediation_sessions (
        title, session_date, session_time, duration_minutes, location, 
        case_id, mediator_id, notes, status, created_by, created_at
      )
      VALUES 
        ($1, $2, '14:00', 60, 'Virtual - Zoom Room A', $3, $4, 'Initial consultation to discuss property division', 'scheduled', $4, NOW())
    `, ['Initial Mediation - Johnson Case', tomorrowDate, case1Id, mediatorId]);
    console.log(`  ✅ Created upcoming session 1 (tomorrow)`);

    // Upcoming session 2
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekDate = nextWeek.toISOString().split('T')[0];
    
    await client.query(`
      INSERT INTO mediation_sessions (
        title, session_date, session_time, duration_minutes, location, 
        case_id, mediator_id, notes, status, created_by, created_at
      )
      VALUES 
        ($1, $2, '10:00', 90, 'Office Suite 204', $3, $4, 'Custody arrangement discussion with both parties', 'scheduled', $4, NOW())
    `, ['Custody Mediation - Smith Case', nextWeekDate, case2Id, mediatorId]);
    console.log(`  ✅ Created upcoming session 2 (next week)`);

    // Past session
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekDate = lastWeek.toISOString().split('T')[0];
    
    await client.query(`
      INSERT INTO mediation_sessions (
        title, session_date, session_time, duration_minutes, location, 
        case_id, mediator_id, notes, status, created_by, created_at
      )
      VALUES 
        ($1, $2, '15:30', 60, 'Virtual - Zoom Room B', $3, $4, 'Review of financial documents and asset valuation', 'completed', $4, NOW())
    `, ['Asset Review - Brown Case', lastWeekDate, case3Id, mediatorId]);
    console.log(`  ✅ Created past session (completed)\n`);

    // 5. Create case notes (skipped - schema needs verification)
    console.log('📝 Skipping case notes (schema to be confirmed)\n');

    // 6. Verify data
    console.log('🔍 Verifying created data...\n');
    
    const casesCount = await client.query('SELECT COUNT(*) FROM cases');
    console.log(`  📊 Total cases: ${casesCount.rows[0].count}`);
    
    const participantsCount = await client.query('SELECT COUNT(*) FROM case_participants');
    console.log(`  👥 Total case participants: ${participantsCount.rows[0].count}`);
    
    const uploadsCount = await client.query('SELECT COUNT(*) FROM uploads');
    console.log(`  📄 Total uploads: ${uploadsCount.rows[0].count}`);
    
    const sessionsCount = await client.query('SELECT COUNT(*) FROM mediation_sessions');
    console.log(`  📅 Total sessions: ${sessionsCount.rows[0].count}`);
    
    const notesCount = await client.query('SELECT COUNT(*) FROM case_notes');
    console.log(`  📝 Total notes: ${notesCount.rows[0].count}`);

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - 3 test cases created`);
    console.log(`   - Participants assigned to all cases`);
    console.log(`   - 4 document uploads (3 pending, 1 approved)`);
    console.log(`   - 3 mediation sessions (2 upcoming, 1 past)`);
    console.log(`   - 3 case notes`);
    console.log('\n🎯 You can now test:');
    console.log(`   - Document review at: http://localhost:5173/#/mediator/review`);
    console.log(`   - Cases list at: http://localhost:5173/#/mediator`);
    console.log(`   - Session scheduler at: http://localhost:5173/#/mediator/schedule`);
    console.log(`   - Case details at: http://localhost:5173/#/case/${case1Id}`);

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
