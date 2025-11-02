/**
 * Initialize Conversations for Existing Cases
 * Creates standard conversations (private + group) for cases that don't have them yet
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { pool } from './backend/src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

async function initializeConversations() {
  console.log('🔄 Initializing conversations for existing cases...\n');

  try {
    // Get all cases with their participants
    const casesResult = await pool.query(`
      SELECT 
        c.id as case_id,
        json_agg(json_build_object(
          'user_id', cp.user_id,
          'role', cp.role
        )) as participants
      FROM cases c
      LEFT JOIN case_participants cp ON c.id = cp.case_id
      GROUP BY c.id
      HAVING COUNT(cp.user_id) > 0
      ORDER BY c.created_at DESC
    `);

    console.log(`📋 Found ${casesResult.rows.length} cases with participants\n`);

    for (const caseRow of casesResult.rows) {
      const { case_id, participants } = caseRow;
      
      console.log(`\n🔍 Processing case: ${case_id}`);
      console.log(`   Participants: ${participants.length}`);

      // Check if conversations already exist for this case
      const existingConvs = await pool.query(
        'SELECT COUNT(*) as count FROM conversations WHERE case_id = $1',
        [case_id]
      );

      if (parseInt(existingConvs.rows[0].count) > 0) {
        console.log(`   ✅ Already has ${existingConvs.rows[0].count} conversation(s), skipping`);
        continue;
      }

      // Get divorcees and mediator
      const divorcees = participants.filter(p => p.role === 'divorcee');
      const mediators = participants.filter(p => p.role === 'mediator');

      if (divorcees.length === 0) {
        console.log('   ⚠️  No divorcees found, skipping');
        continue;
      }

      const conversationsToCreate = [];

      // 1. Group conversation (all participants)
      if (participants.length >= 2) {
        conversationsToCreate.push({
          type: 'group',
          title: 'All Participants',
          participant_ids: participants.map(p => p.user_id)
        });
      }

      // 2. Private conversations between divorcee(s) and mediator
      if (mediators.length > 0) {
        const mediator = mediators[0];
        
        for (const divorcee of divorcees) {
          conversationsToCreate.push({
            type: 'divorcee_to_mediator',
            title: 'Private Conversation',
            participant_ids: [divorcee.user_id, mediator.user_id]
          });
        }
      }

      // 3. Private conversation between divorcees (if there are 2)
      if (divorcees.length === 2) {
        conversationsToCreate.push({
          type: 'divorcee_to_divorcee',
          title: 'Private Discussion',
          participant_ids: [divorcees[0].user_id, divorcees[1].user_id]
        });
      }

      // Create conversations
      for (const conv of conversationsToCreate) {
        try {
          await pool.query('BEGIN');

          // Insert conversation
          const convResult = await pool.query(`
            INSERT INTO conversations (case_id, conversation_type, title, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id
          `, [case_id, conv.type, conv.title]);

          const conversationId = convResult.rows[0].id;

          // Insert participants
          for (const userId of conv.participant_ids) {
            await pool.query(`
              INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
              VALUES ($1, $2, NOW())
            `, [conversationId, userId]);
          }

          await pool.query('COMMIT');

          console.log(`   ✅ Created ${conv.type} conversation with ${conv.participant_ids.length} participants`);
        } catch (err) {
          await pool.query('ROLLBACK');
          console.error(`   ❌ Failed to create ${conv.type} conversation:`, err.message);
        }
      }

      console.log(`   🎉 Initialized ${conversationsToCreate.length} conversations for case ${case_id}`);
    }

    console.log('\n✨ Conversation initialization complete!\n');
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

initializeConversations();
