import { pool } from './src/db.js';

const messageId = '26600d0d-6f26-4546-8b1e-20f7f0441583';

try {
  console.log('Checking for AI insights in database...');
  
  // Check all insights that might be related to this message
  const result = await pool.query(`
    SELECT 
      id,
      case_id,
      created_by,
      insight_type,
      content,
      metadata,
      created_at
    FROM ai_insights 
    WHERE metadata->>'message_id' = $1
    ORDER BY created_at DESC
  `, [messageId]);
  
  console.log(`Found ${result.rows.length} insights for message ${messageId}:`);
  
  result.rows.forEach((insight, index) => {
    console.log(`\n${index + 1}. ${insight.insight_type.toUpperCase()}`);
    console.log(`   ID: ${insight.id}`);
    console.log(`   Case: ${insight.case_id}`);
    console.log(`   User: ${insight.created_by}`);
    console.log(`   Created: ${insight.created_at}`);
    console.log(`   Auto-generated: ${insight.metadata.auto_generated}`);
    
    if (insight.insight_type === 'tone_analysis') {
      console.log(`   Tone: ${insight.content.emotional_tone}`);
      console.log(`   Intensity: ${insight.content.intensity}/10`);
    } else if (insight.insight_type === 'risk_assessment') {
      console.log(`   Risk Level: ${insight.content.risk_level}`);
      console.log(`   Confidence: ${insight.content.confidence}`);
    }
  });
  
  if (result.rows.length === 0) {
    console.log('\n❌ No insights found - AI processing may have failed');
    
    // Check if there are any recent insights at all
    const recentResult = await pool.query(`
      SELECT insight_type, created_at, metadata
      FROM ai_insights 
      WHERE created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`\nRecent insights (last 10 min): ${recentResult.rows.length}`);
    recentResult.rows.forEach((insight) => {
      console.log(`  - ${insight.insight_type} at ${insight.created_at}`);
    });
  } else {
    console.log('\n✅ AI analysis successfully generated insights!');
  }
  
} catch (err) {
  console.error('Database error:', err.message);
}

pool.end();