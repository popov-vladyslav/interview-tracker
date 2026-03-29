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

    const [company] = await sql`
      SELECT id FROM companies WHERE id = ${companyId} AND user_id = ${req.userId}
    `;
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const [contact] = await sql`
      INSERT INTO contacts (company_id, name, role, email, phone, notes)
      VALUES (${companyId}, ${name}, ${role || ""}, ${email || ""}, ${phone || ""}, ${notes || ""})
      RETURNING *
    `;

    res.status(201).json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/contacts/:id — remove a contact
router.delete("/:id", async (req, res) => {
  try {
    const sql = getDb();
    const { id } = req.params;

    const [deleted] = await sql`
      DELETE FROM contacts
      USING companies
      WHERE contacts.id = ${id}
        AND contacts.company_id = companies.id
        AND companies.user_id = ${req.userId}
      RETURNING contacts.id
    `;

    if (!deleted) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ message: "Contact deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
