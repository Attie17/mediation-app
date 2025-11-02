import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'
});

async function testAccessQuery() {
  const caseId = '3bcb2937-0e55-451a-a9fd-659187af84d4';
  const userId = '22222222-2222-2222-2222-222222222222';

  console.log('\n🧪 Testing ACCESS CHECK query...\n');
  console.log('Case ID:', caseId);
  console.log('User ID:', userId);
  console.log('');

  // Test 1: Access check query
  try {
    const accessCheck = await pool.query(`
      SELECT c.id, c.mediator_id
      FROM cases c
      LEFT JOIN case_participants cp ON c.id = cp.case_id
      WHERE c.id::text = $1
      AND (c.mediator_id::text = $2 OR cp.user_id::text = $2)
    `, [caseId, userId]);

    console.log(`✅ Access check returned ${accessCheck.rows.length} row(s)`);
    if (accessCheck.rows.length > 0) {
      console.log('   User HAS access to case');
      console.log('   Case data:', accessCheck.rows[0]);
    } else {
      console.log('   ❌ User does NOT have access (403 would be returned)');
    }
  } catch (err) {
    console.error('❌ Access check query error:', err.message);
  }

  console.log('\n🧪 Testing CONVERSATIONS query...\n');

  // Test 2: Conversations query
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.case_id,
        c.conversation_type,
        c.title,
        c.created_at,
        c.updated_at,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
          AND m.created_at > COALESCE(
            (SELECT last_read_at FROM conversation_participants 
             WHERE conversation_id = c.id AND user_id::text = $2),
            '1970-01-01'
          )
        ) as unread_count,
        (
          SELECT m.content
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message_at,
        (
          SELECT json_agg(json_build_object(
            'user_id', u.user_id,
            'email', u.email,
            'role', u.role
          ))
          FROM conversation_participants cp
          JOIN app_users u ON cp.user_id = u.user_id
          WHERE cp.conversation_id = c.id
        ) as participants
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.case_id::text = $1
      AND cp.user_id::text = $2
      ORDER BY c.conversation_type, c.created_at
    `, [caseId, userId]);

    console.log(`✅ Conversations query returned ${result.rows.length} row(s)`);
    if (result.rows.length > 0) {
      result.rows.forEach((row, i) => {
        console.log(`\n${i + 1}. ${row.title} (${row.conversation_type})`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Unread: ${row.unread_count}`);
        console.log(`   Participants:`, row.participants);
      });
    }
  } catch (err) {
    console.error('❌ Conversations query error:', err.message);
    console.error('   Stack:', err.stack);
  }

  await pool.end();
  console.log('\n✨ Test complete!\n');
}

testAccessQuery();
