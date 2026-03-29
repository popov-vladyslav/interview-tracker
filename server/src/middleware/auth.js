// This middleware runs BEFORE your route handlers.
// It checks if the request has a valid JWT token.
// If yes → adds req.userId so routes know who's asking.
// If no  → returns 401 Unauthorized.

const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res, next) {
  // Token comes in the Authorization header: "Bearer eyJhbG..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token and extract the user ID
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next(); // Continue to the route handler
  } catch (_) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticate, JWT_SECRET };
