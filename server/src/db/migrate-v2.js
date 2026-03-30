// Migration v2: Update status/stage constraints
// - Status: Wishlist, Active, Offer, Rejected (was 6 values)
// - Stage: drop CHECK constraint (custom stages allowed)
// - Default stage: HR Review (was HR Screen)
//
// Usage: cd server && node src/db/migrate-v2.js

require("dotenv").config();
const { getDb } = require("./connection");

async function migrate() {
  const sql = getDb();

  console.log("🔄 Running v2 migration...\n");

  // Drop old status CHECK constraint
  await sql`ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_status_check`;
  console.log("✅ Dropped old status CHECK constraint");

  // Map old statuses to new ones BEFORE adding new constraint
  await sql`UPDATE companies SET status = 'Active' WHERE status NOT IN ('Wishlist', 'Active', 'Offer', 'Rejected')`;
  console.log("✅ Migrated old status values");

  // Add new constraint
  await sql`ALTER TABLE companies ADD CONSTRAINT companies_status_check CHECK (status IN ('Wishlist','Active','Offer','Rejected'))`;
  console.log("✅ Added new status CHECK constraint");

  // Drop stage CHECK constraint (custom stages now allowed)
  await sql`ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_stage_check`;
  console.log("✅ Dropped stage CHECK constraint");

  // Update default stage value
  await sql`ALTER TABLE companies ALTER COLUMN stage SET DEFAULT 'HR Review'`;
  console.log("✅ Updated default stage to HR Review");

  // Rename existing "HR Screen" stages to "HR Review"
  await sql`UPDATE stages SET name = 'HR Review' WHERE name = 'HR Screen'`;
  await sql`UPDATE companies SET stage = 'HR Review' WHERE stage = 'HR Screen'`;
  console.log("✅ Renamed existing HR Screen → HR Review");

  console.log("\n🎉 v2 migration complete!");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
