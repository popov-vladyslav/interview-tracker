import express from "express";
import { getDb } from "../db/connection";
import { validate } from "../middleware/validate";
import { createContactSchema } from "../validation/schemas";
import { asyncHandler } from "../middleware/async-handler";
import { parseId } from "../middleware/parse-id";

type Request<P = Record<string, string>, B = unknown> = import("express").Request<P, unknown, B>;
type Response = import("express").Response;

interface ContactRow {
  id: number;
  company_id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
}

type CreateContactBody = {
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
};

type AuthedRequest<P = Record<string, string>, B = Record<string, unknown>> = Request<P, B> & {
  userId: number;
};

const { Router } = express;
const router = Router();

router.post(
  "/:companyId",
  validate(createContactSchema),
  asyncHandler(async (req: AuthedRequest<{ companyId: string }, CreateContactBody>, res: Response) => {
    const sql = getDb();
    const companyId = parseId(req.params.companyId);
    if (companyId === null) return res.status(400).json({ error: "Invalid ID" });
    const { name, role, email, phone, notes } = req.body;

    const [company] = (await sql`
      SELECT id FROM companies WHERE id = ${companyId} AND user_id = ${req.userId}
    `) as { id: number }[];

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const [contact] = (await sql`
      INSERT INTO contacts (company_id, name, role, email, phone, notes)
      VALUES (${companyId}, ${name}, ${role || ""}, ${email || ""}, ${phone || ""}, ${notes || ""})
      RETURNING *
    `) as ContactRow[];

    return res.status(201).json(contact);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest<{ id: string }>, res: Response) => {
    const sql = getDb();
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid ID" });

    const [deleted] = (await sql`
      DELETE FROM contacts
      USING companies
      WHERE contacts.id = ${id}
        AND contacts.company_id = companies.id
        AND companies.user_id = ${req.userId}
      RETURNING contacts.id
    `) as { id: number }[];

    if (!deleted) {
      return res.status(404).json({ error: "Contact not found" });
    }

    return res.json({ success: true, id: deleted.id, message: "deleted successfully" });
  })
);

export default router;
