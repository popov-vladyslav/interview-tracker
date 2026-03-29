// Drops ALL tables and recreates them empty.
// Run: cd server && node src/db/reset.js
// ⚠️ This deletes ALL data permanently!

require("dotenv").config();
const { getDb } = require("./connection");

async function reset() {
  const sql = getDb();

  console.log("⚠️  Dropping all tables...\n");

  // Drop in reverse order (children first, then parents)
  // because of foreign key constraints
  await sql`DROP TABLE IF EXISTS notes`;
  console.log("🗑️  notes dropped");

  await sql`DROP TABLE IF EXISTS contacts`;
  console.log("🗑️  contacts dropped");

  await sql`DROP TABLE IF EXISTS stages`;
  console.log("🗑️  stages dropped");

  await sql`DROP TABLE IF EXISTS companies`;
  console.log("🗑️  companies dropped");

  await sql`DROP TABLE IF EXISTS users`;
  console.log("🗑️  users dropped");

  console.log("\n✅ All tables dropped. Database is empty.\n");
  console.log("Now run migrations to recreate:");
  console.log("  node src/db/migrate.js");
  console.log("  node src/db/migrate-auth.js");
}

reset().catch((err) => {
  console.error("❌ Reset failed:", err.message);
  process.exit(1);
});
