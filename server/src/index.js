require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { getDb } = require("./db/connection");
const { authenticate } = require("./middleware/auth");

// Import routes
const authRouter = require("./routes/auth");
const companiesRouter = require("./routes/companies");
const stagesRouter = require("./routes/stages");
const contactsRouter = require("./routes/contacts");
const notesRouter = require("./routes/notes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check (public — no auth needed)
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

app.use("/api/auth", authRouter);

app.use("/api/companies", authenticate, companiesRouter);
app.use("/api/stages", authenticate, stagesRouter);
app.use("/api/contacts", authenticate, contactsRouter);
app.use("/api/notes", authenticate, notesRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
