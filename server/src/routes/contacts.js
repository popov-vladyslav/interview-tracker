const { Router } = require("express");
const { getDb } = require("../db/connection");

const router = Router();

// POST /api/companies/:companyId/contacts — add a contact
router.post("/:companyId/contacts", async (req, res) => {
  try {
    const sql = getDb();
    const { companyId } = req.params;
    const { name, role, email, phone, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Contact name is required" });
    }

    const [contact] = await sql`
      INSERT INTO contacts (company_id, name, role, email, phone, notes)
      VALUES (${companyId}, ${name}, ${role || ""}, ${email || ""}, ${phone || ""}, ${notes || ""})
      RETURNING *
    `;

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/contacts/:id — remove a contact
router.delete("/:id", async (req, res) => {
  try {
    const sql = getDb();
    const { id } = req.params;

    const [deleted] = await sql`
      DELETE FROM contacts WHERE id = ${id} RETURNING id
    `;

    if (!deleted) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ message: "Contact deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
