const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db/connection");
const { JWT_SECRET, authenticate } = require("../middleware/auth");

const router = Router();

// ────────────────────────────────────
// POST /api/auth/register — create account
// ────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const sql = getDb();
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const [existing] = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await sql`
      INSERT INTO users (email, password, name)
      VALUES (${email.toLowerCase()}, ${hashedPassword}, ${name || ""})
      RETURNING id, email, name, created_at
    `;

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ────────────────────────────────────
// POST /api/auth/login — get token
// ────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const sql = getDb();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [user] = await sql`
      SELECT * FROM users WHERE email = ${email.toLowerCase()}
    `;
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ────────────────────────────────────
// GET /api/auth/me — get current user info
// (this route will need the authenticate middleware)
// ────────────────────────────────────
router.get("/me", authenticate, async (req, res) => {
  try {
    const sql = getDb();
    const [user] = await sql`
      SELECT id, email, name, created_at FROM users WHERE id = ${req.userId}
    `;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
