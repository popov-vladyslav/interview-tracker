const { Router } = require("express");
const { getDb } = require("../db/connection");

const router = Router();

// GET /api/companies/:companyId/notes
router.get("/:companyId/notes", async (req, res) => {
  try {
    const sql = getDb();
    const { companyId } = req.params;

    const notes = await sql`
      SELECT n.* FROM notes n
      JOIN companies c ON n.company_id = c.id
      WHERE n.company_id = ${companyId} AND c.user_id = ${req.userId}
      ORDER BY n.created_at DESC
    `;

    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/companies/:companyId/notes — add a note
router.post("/:companyId/notes", async (req, res) => {
  try {
    const sql = getDb();
    const { companyId } = req.params;
    const { title, content, type, stage_id } = req.body;

    const [company] = await sql`
      SELECT id FROM companies WHERE id = ${companyId} AND user_id = ${req.userId}
    `;
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

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
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/notes/:id
router.delete("/:id", async (req, res) => {
  try {
    const sql = getDb();
    const { id } = req.params;

    const [deleted] = await sql`
      DELETE FROM notes
      USING companies
      WHERE notes.id = ${id}
        AND notes.company_id = companies.id
        AND companies.user_id = ${req.userId}
      RETURNING notes.id
    `;

    if (!deleted) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ message: "Note deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
