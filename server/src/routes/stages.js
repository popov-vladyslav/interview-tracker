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

module.exports = router;
