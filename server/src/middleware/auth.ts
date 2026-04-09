import jwt from "jsonwebtoken";
import { getDb } from "../db/connection";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";

interface AuthTokenPayload extends JwtPayload {
  userId: number;
}

interface UserRow {
  id: number;
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const JWT_SECRET: string = process.env.JWT_SECRET;

async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string" || typeof decoded.userId !== "number") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const sql = getDb();
    const [user] = (await sql`SELECT id FROM users WHERE id = ${decoded.userId}`) as UserRow[];

    if (!user) {
      return res.status(401).json({ error: "Account no longer exists" });
    }

    req.userId = (decoded as AuthTokenPayload).userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export { authenticate, JWT_SECRET };
