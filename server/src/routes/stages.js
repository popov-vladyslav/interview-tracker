const { Router } = require("express");
const { getDb } = require("../db/connection");

const router = Router();

// ────────────────────────────────────
// PUT /api/stages/:id — update a stage
// Called when you toggle a checkbox or add feedback
// ────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const sql = getDb();
    const { id } = req.params;
    const {
      status,
      scheduled_date,
      duration,
      interviewer,
      feedback,
      my_notes,
    } = req.body;

    const [updated] = await sql`
      UPDATE stages SET
        status = COALESCE(${status}, stages.status),
        scheduled_date = COALESCE(${scheduled_date}, stages.scheduled_date),
        duration = COALESCE(${duration}, stages.duration),
        interviewer = COALESCE(${interviewer}, stages.interviewer),
        feedback = COALESCE(${feedback}, stages.feedback),
        my_notes = COALESCE(${my_notes}, stages.my_notes)
      FROM companies
      WHERE stages.id = ${id}
        AND stages.company_id = companies.id
        AND companies.user_id = ${req.userId}
      RETURNING stages.*
    `;

    if (!updated) {
      return res.status(404).json({ error: "Stage not found" });
    }

    await sql`
      UPDATE companies SET updated_at = NOW()
      WHERE id = ${updated.company_id} AND user_id = ${req.userId}
    `;

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ────────────────────────────────────
// POST /api/stages/:companyId — create a custom stage
// ────────────────────────────────────
router.post("/:companyId", async (req, res) => {
  try {
    const sql = getDb();
    const { companyId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Stage name is required" });
    }

    const trimmed = name.trim();

    if (trimmed.length > 100) {
      return res.status(400).json({ error: "Stage name must be 100 characters or less" });
    }

    // Verify company belongs to user
    const [company] = await sql`
      SELECT id FROM companies WHERE id = ${companyId} AND user_id = ${req.userId}
    `;
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Check for duplicate stage name
    const [existing] = await sql`
      SELECT id FROM stages WHERE company_id = ${companyId} AND name = ${trimmed}
    `;
    if (existing) {
      return res.status(409).json({ error: "A stage with this name already exists" });
    }

    const [stage] = await sql`
      INSERT INTO stages (company_id, name, status)
      VALUES (${companyId}, ${trimmed}, 'pending')
      RETURNING *
    `;

    await sql`
      UPDATE companies SET updated_at = NOW()
      WHERE id = ${companyId} AND user_id = ${req.userId}
    `;

    res.status(201).json(stage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ────────────────────────────────────
// DELETE /api/stages/:id — delete a stage
// ────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const sql = getDb();
    const { id } = req.params;

    // Find the stage and verify ownership
    const [stage] = await sql`
      SELECT stages.id, stages.name, stages.company_id
      FROM stages
      JOIN companies ON stages.company_id = companies.id
      WHERE stages.id = ${id} AND companies.user_id = ${req.userId}
    `;

    if (!stage) {
      return res.status(404).json({ error: "Stage not found" });
    }

    // Must keep at least 1 stage
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM stages WHERE company_id = ${stage.company_id}
    `;

    if (count <= 1) {
      return res.status(400).json({ error: "Cannot delete the last stage" });
    }

    // Check if we need to update company's current stage
    const [company] = await sql`
      SELECT stage FROM companies WHERE id = ${stage.company_id}
    `;

    if (company.stage === stage.name) {
      // Find first remaining stage (excluding the one being deleted)
      const [firstRemaining] = await sql`
        SELECT name FROM stages
        WHERE company_id = ${stage.company_id} AND id != ${id}
        ORDER BY id ASC LIMIT 1
      `;
      await sql.transaction([
        sql`DELETE FROM stages WHERE id = ${id}`,
        sql`UPDATE companies SET stage = ${firstRemaining.name}, updated_at = NOW()
            WHERE id = ${stage.company_id}`,
      ]);
    } else {
      await sql.transaction([
        sql`DELETE FROM stages WHERE id = ${id}`,
        sql`UPDATE companies SET updated_at = NOW() WHERE id = ${stage.company_id}`,
      ]);
    }

    res.json({ message: "Stage deleted", id: stage.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
