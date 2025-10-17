import pg from 'pg';
const { Pool } = pg;

const messageId = process.argv[2] || '4f939ae8-64e5-47b3-b207-690e4ce866c4';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log(`Checking for insights for message: ${messageId}`);

const result = await pool.query(
  `SELECT * FROM ai_insights WHERE metadata->>'message_id' = $1 ORDER BY created_at DESC`,
  [messageId]
);

console.log(`\nFound ${result.rows.length} insights:`);
result.rows.forEach((row, idx) => {
  console.log(`\n--- Insight ${idx + 1} ---`);
  console.log(`Type: ${row.insight_type}`);
  console.log(`Content:`, JSON.stringify(row.content, null, 2));
  console.log(`Created: ${row.created_at}`);
});

// Also check recent insights
const recent = await pool.query(
  `SELECT * FROM ai_insights WHERE created_at > NOW() - INTERVAL '10 minutes' ORDER BY created_at DESC`
);

console.log(`\n\nRecent insights (last 10 min): ${recent.rows.length}`);

await pool.end();
