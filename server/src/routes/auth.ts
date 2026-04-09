import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { getDb } from "../db/connection";
import { JWT_SECRET, authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../validation/schemas";
import { asyncHandler } from "../middleware/async-handler";

type Request<P = Record<string, string>, B = unknown> = import("express").Request<P, unknown, B>;
type Response = import("express").Response;
type RequestHandler = import("express").RequestHandler;

interface UserRow {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: string;
}

type RegisterBody = {
  email: string;
  password: string;
  name: string;
};

type LoginBody = {
  email: string;
  password: string;
};

type AuthedRequest<P = Record<string, string>, B = unknown> = Request<P, B> & { userId: number };

const { Router } = express;
const router = Router();

const isTest = process.env.NODE_ENV === "test";

const passthroughLimiter: RequestHandler = (_req, _res, next): void => {
  next();
};

const loginLimiter: RequestHandler = isTest
  ? passthroughLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: { error: "Too many login attempts, please try again later" },
      standardHeaders: true,
      legacyHeaders: false,
    });

const registerLimiter: RequestHandler = isTest
  ? passthroughLimiter
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 5,
      message: { error: "Too many registration attempts, please try again later" },
      standardHeaders: true,
      legacyHeaders: false,
    });

router.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  asyncHandler(async (req: Request<Record<string, string>, RegisterBody>, res: Response) => {
    const sql = getDb();
    const { email, password, name } = req.body;

    const [existing] = (await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `) as Pick<UserRow, "id">[];

    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = (await sql`
      INSERT INTO users (email, password, name)
      VALUES (${email.toLowerCase()}, ${hashedPassword}, ${name || ""})
      RETURNING id, email, name, created_at
    `) as UserRow[];

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    return res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  })
);

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req: Request<Record<string, string>, LoginBody>, res: Response) => {
    const sql = getDb();
    const { email, password } = req.body;

    const [user] = (await sql`
      SELECT * FROM users WHERE email = ${email.toLowerCase()}
    `) as UserRow[];

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

    return res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const sql = getDb();
    const [user] = (await sql`
      SELECT id, email, name, created_at FROM users WHERE id = ${req.userId}
    `) as UserRow[];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  })
);

router.delete(
  "/me",
  authenticate,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const sql = getDb();

    await sql.transaction([
      sql`DELETE FROM companies WHERE user_id = ${req.userId}`,
      sql`DELETE FROM users WHERE id = ${req.userId}`,
    ]);

    return res.json({ message: "Account deleted" });
  })
);

export default router;
