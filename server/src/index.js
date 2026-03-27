require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { getDb } = require("./db/connection");

// Import route files
const companiesRouter = require("./routes/companies");
const stagesRouter = require("./routes/stages");
const contactsRouter = require("./routes/contacts");
const notesRouter = require("./routes/notes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", async (req, res) => {
  try {
    const sql = getDb();
    const result = await sql`SELECT NOW() as server_time`;
    res.json({
      status: "ok",
      message: "Interview Tracker API",
      database: "connected",
      serverTime: result[0].server_time,
    });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Register routes
app.use("/api/companies", companiesRouter); // /api/companies
app.use("/api/stages", stagesRouter); // /api/stages/:id
app.use("/api/companies", contactsRouter); // /api/companies/:id/contacts
app.use("/api/companies", notesRouter); // /api/companies/:id/notes
// Note: contacts DELETE is at /api/companies/:id but we also
// need a direct delete route:
app.delete("/api/contacts/:id", async (req, res) => {
  const sql = getDb();
  const [d] =
    await sql`DELETE FROM contacts WHERE id = ${req.params.id} RETURNING id`;

  if (d) {
    res.json({ message: "Deleted" });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});
app.delete("/api/notes/:id", async (req, res) => {
  const sql = getDb();
  const [d] =
    await sql`DELETE FROM notes WHERE id = ${req.params.id} RETURNING id`;
  if (d) {
    res.json({ message: "Deleted" });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API endpoints:`);
  console.log(`   GET    /api/companies`);
  console.log(`   POST   /api/companies`);
  console.log(`   GET    /api/companies/:id`);
  console.log(`   PUT    /api/companies/:id`);
  console.log(`   DELETE /api/companies/:id`);
  console.log(`   PUT    /api/stages/:id`);
  console.log(`   POST   /api/companies/:id/contacts`);
  console.log(`   DELETE /api/contacts/:id`);
  console.log(`   POST   /api/companies/:id/notes`);
  console.log(`   DELETE /api/notes/:id`);
});
