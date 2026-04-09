const { getDb } = require('../db/connection');

let sql;

beforeAll(() => {
  sql = getDb();
});

afterAll(async () => {
  // Close DB connection to prevent hanging test process.
  // Neon HTTP driver has no .end(), so the guard makes this safe for all drivers.
  if (sql && typeof sql.end === 'function') {
    await sql.end();
  }
});

function getSql() {
  return sql;
}

module.exports = { getSql };
