// Transaction helper for pg.Pool
export async function withTransaction(pool, fn) {
  let client;
  try {
    client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  } finally {
    if (client) client.release();
  }
}
