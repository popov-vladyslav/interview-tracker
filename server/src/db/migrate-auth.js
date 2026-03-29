require("dotenv").config();
const { getDb } = require("./connection");

async function migrateAuth() {
  const sql = getDb();

  console.log("🔄 Running auth migration...\n");

  // ── New table: users ──
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      name        TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✅ users table created");

  // ── Add user_id to companies ──
  // This links each company to a specific user
  // We use IF NOT EXISTS approach with a try/catch
  try {
    await sql`ALTER TABLE companies ADD COLUMN user_id INTEGER REFERENCES users(id)`;
    console.log("✅ user_id added to companies");
  } catch (e) {
    console.log("ℹ️  user_id already exists on companies");
  }

  console.log("\n🎉 Auth migration complete!");
}

migrateAuth().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
