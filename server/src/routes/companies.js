const { Router } = require("express");
const { getDb } = require("../db/connection");

const router = Router();

const DEFAULT_STAGES = [
  "HR Screen",
  "Technical",
  "System Design",
  "Client Call",
  "Final Round",
  "Offer",
];

// ────────────────────────────────────
// GET /api/companies — list all companies
// Your board view calls this on load
// ────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const sql = getDb();

    const companies = await sql`
      SELECT * FROM companies WHERE user_id = ${req.userId} ORDER BY updated_at DESC
    `;

    const companyIds = companies.map((c) => c.id);
    const stages = companyIds.length
      ? await sql`
          SELECT * FROM stages
          WHERE company_id = ANY(${companyIds})
          ORDER BY id ASC
        `
      : [];

    // Group stages by company_id
    const stagesByCompany = {};
    for (const stage of stages) {
      if (!stagesByCompany[stage.company_id]) {
        stagesByCompany[stage.company_id] = [];
      }
      stagesByCompany[stage.company_id].push(stage);
    }

    const result = companies.map((company) => ({
      ...company,
      stages: stagesByCompany[company.id] || [],
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ────────────────────────────────────
// GET /api/companies/:id — get one company with all related data
// Called when you expand a card or open company detail
// ────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const sql = getDb();
    const { id } = req.params;

    const [company] = await sql`
      SELECT * FROM companies WHERE id = ${id} AND user_id = ${req.userId}
    `;

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const stages = await sql`
      SELECT * FROM stages WHERE company_id = ${id} ORDER BY id ASC
    `;
    const contacts = await sql`
      SELECT * FROM contacts WHERE company_id = ${id} ORDER BY id ASC
    `;
    const notes = await sql`
      SELECT * FROM notes WHERE company_id = ${id} ORDER BY created_at DESC
    `;

    res.json({ ...company, stages, contacts, notes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ────────────────────────────────────
// POST /api/companies — create a new company
// Called when you hit "Add Company" and save
// Also auto-creates 6 default stages
// ────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const sql = getDb();
    const {
      name,
      role,
      status,
      stage,
      priority,
      work_mode,
      location,
      salary,
      source,
      tags,
      applied_date,
      next_interview,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Company name is required" });
    }

    const [company] = await sql`
      INSERT INTO companies (
        name, role, status, stage, priority, work_mode,
        location, salary, source, tags, applied_date, next_interview, user_id
      ) VALUES (
        ${name}, ${role || ""}, ${status || "Active"}, ${stage || "HR Screen"},
        ${priority || "Medium"}, ${work_mode || "Remote"}, ${location || ""},
        ${salary || ""}, ${source || "Other"}, ${tags || []},
        ${applied_date || null}, ${next_interview || null}, ${req.userId}
      )
      RETURNING *
`;

    const stages = [];
    for (const stageName of DEFAULT_STAGES) {
      const [s] = await sql`
        INSERT INTO stages (company_id, name)
        VALUES (${company.id}, ${stageName})
        RETURNING *
      `;
      stages.push(s);
    }

    res.status(201).json({ ...company, stages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ────────────────────────────────────
// PUT /api/companies/:id — update company info
// Called when you edit Company Info tab and save
// ────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const sql = getDb();
    const { id } = req.params;
    const {
      name,
      role,
      status,
      stage,
      priority,
      work_mode,
      location,
      salary,
      source,
      tags,
      overall_rating,
      applied_date,
      next_interview,
    } = req.body;

    const [updated] = await sql`
      UPDATE companies SET
        name = COALESCE(${name}, name),
        role = COALESCE(${role}, role),
        status = COALESCE(${status}, status),
        stage = COALESCE(${stage}, stage),
        priority = COALESCE(${priority}, priority),
        work_mode = COALESCE(${work_mode}, work_mode),
        location = COALESCE(${location}, location),
        salary = COALESCE(${salary}, salary),
        source = COALESCE(${source}, source),
        tags = COALESCE(${tags}, tags),
        overall_rating = COALESCE(${overall_rating}, overall_rating),
        applied_date = COALESCE(${applied_date}, applied_date),
        next_interview = COALESCE(${next_interview}, next_interview),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING *
    `;

    if (!updated) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ────────────────────────────────────
// DELETE /api/companies/:id — delete a company
// Stages, contacts, notes auto-deleted (CASCADE)
// ────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const sql = getDb();
    const { id } = req.params;

    const [deleted] = await sql`
      DELETE FROM companies WHERE id = ${id} AND user_id = ${req.userId} RETURNING id
    `;

    if (!deleted) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json({ message: "Company deleted", id: deleted.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
