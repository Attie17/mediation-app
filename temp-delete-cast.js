const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `DELETE FROM case_participants WHERE id = $1::uuid RETURNING id`,
      ['6750b742-4bce-458d-a02c-953daa8ca32a']
    );
    console.log('deleted', res.rows);
  } finally {
    await client.end();
  }
})();
