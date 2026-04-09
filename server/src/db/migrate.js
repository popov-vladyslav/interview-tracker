// Migration = creating or updating database tables.
// Run this once to set up your database structure.
// Usage: cd server && node src/db/migrate.js

require("dotenv").config();
const { getDb } = require("./connection");

async function migrate() {
  const sql = getDb();

  console.log("🔄 Running migrations...\n");

  // ── TABLE: users ──
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

  // ── TABLE: companies ──
  await sql`
    CREATE TABLE IF NOT EXISTS companies (
      id              SERIAL PRIMARY KEY,
      name            TEXT NOT NULL,
      role            TEXT DEFAULT '',
      status          TEXT DEFAULT 'Wishlist'
                      CHECK (status IN ('Wishlist','Active','Paused','Offer','Not replied','Rejected')),
      stage           TEXT DEFAULT 'CV Review',
      work_mode       TEXT DEFAULT 'Remote'
                      CHECK (work_mode IN ('Remote','Hybrid','On-site')),
      location        TEXT DEFAULT '',
      salary          TEXT DEFAULT '',
      source          TEXT DEFAULT 'Other'
                      CHECK (source IN ('LinkedIn','Referral','Job Board','Direct','Recruiter','Other')),
      next_interview  TIMESTAMPTZ,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✅ companies table created");

  // ── TABLE 2: stages ──
  await sql`
    CREATE TABLE IF NOT EXISTS stages (
      id              SERIAL PRIMARY KEY,
      company_id      INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      status          TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending','completed','cancelled')),
      scheduled_date  TIMESTAMPTZ,
      duration        INTEGER,
      interviewer     TEXT DEFAULT '',
      feedback        TEXT DEFAULT '',
      my_notes        TEXT DEFAULT '',
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✅ stages table created");

  // ── TABLE 3: contacts ──
  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id              SERIAL PRIMARY KEY,
      company_id      INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      role            TEXT DEFAULT '',
      email           TEXT DEFAULT '',
      phone           TEXT DEFAULT '',
      notes           TEXT DEFAULT '',
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✅ contacts table created");

  // ── TABLE 4: notes ──
  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id              SERIAL PRIMARY KEY,
      company_id      INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      stage_id        INTEGER REFERENCES stages(id) ON DELETE SET NULL,
      title           TEXT NOT NULL,
      content         TEXT DEFAULT '',
      type            TEXT DEFAULT 'general'
                      CHECK (type IN ('general','feedback','transcription','prep')),
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✅ notes table created");

  console.log("\n🎉 All tables created successfully!");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
