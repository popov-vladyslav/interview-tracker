const { Router } = require("express");
const { getDb } = require("../db/connection");

const router = Router();

// GET /api/companies/:companyId/notes
router.get("/:companyId/notes", async (req, res) => {
  try {
    const sql = getDb();
    const { companyId } = req.params;

    const notes = await sql`
      SELECT * FROM notes
      WHERE company_id = ${companyId}
      ORDER BY created_at DESC
    `;

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/companies/:companyId/notes — add a note
router.post("/:companyId/notes", async (req, res) => {
  try {
    const sql = getDb();
    const { companyId } = req.params;
    const { title, content, type, stage_id } = req.body;

    const [note] = await sql`
      INSERT INTO notes (company_id, stage_id, title, content, type)
      VALUES (
        ${companyId},
        ${stage_id || null},
        ${title || "Untitled"},
        ${content || ""},
        ${type || "general"}
      )
      RETURNING *
    `;

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notes/:id
router.delete("/:id", async (req, res) => {
  try {
    const sql = getDb();
    const { id } = req.params;

    const [deleted] = await sql`
      DELETE FROM notes WHERE id = ${id} RETURNING id
    `;

    if (!deleted) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
