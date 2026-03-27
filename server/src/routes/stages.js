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
        status = COALESCE(${status}, status),
        scheduled_date = COALESCE(${scheduled_date}, scheduled_date),
        duration = COALESCE(${duration}, duration),
        interviewer = COALESCE(${interviewer}, interviewer),
        feedback = COALESCE(${feedback}, feedback),
        my_notes = COALESCE(${my_notes}, my_notes)
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated) {
      return res.status(404).json({ error: "Stage not found" });
    }

    // Also update the parent company's updated_at
    await sql`
      UPDATE companies SET updated_at = NOW()
      WHERE id = ${updated.company_id}
    `;

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
