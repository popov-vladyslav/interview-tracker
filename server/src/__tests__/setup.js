const { getDb } = require('../db/connection');

let sql;

beforeAll(() => {
  sql = getDb();
});

afterAll(async () => {
  // Delete all test-generated data (users not belonging to real accounts)
  await sql`
    DELETE FROM companies
    WHERE user_id IN (
      SELECT id FROM users WHERE email LIKE '%@example.com'
    )
  `;
  await sql`DELETE FROM users WHERE email LIKE '%@example.com'`;

  if (sql && typeof sql.end === 'function') {
    await sql.end();
  }
});

function getSql() {
  return sql;
}

module.exports = { getSql };
