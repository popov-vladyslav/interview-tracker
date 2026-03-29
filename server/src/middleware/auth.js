const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (_) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticate, JWT_SECRET };
