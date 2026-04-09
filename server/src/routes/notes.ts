import express from "express";
import { getDb } from "../db/connection";
import { validate } from "../middleware/validate";
import { createNoteSchema } from "../validation/schemas";
import { asyncHandler } from "../middleware/async-handler";
import { parseId } from "../middleware/parse-id";

type Request<P = Record<string, string>, B = unknown> = import("express").Request<P, unknown, B>;
type Response = import("express").Response;

interface NoteRow {
  id: number;
  company_id: number;
  stage_id: number | null;
  title: string;
  content: string;
  type: "general" | "feedback" | "transcription" | "prep";
  created_at: string;
}

type CreateNoteBody = {
  title: string;
  content: string;
  type: NoteRow["type"];
  stage_id: number | null;
};

type AuthedRequest<P = Record<string, string>, B = Record<string, unknown>> = Request<P, B> & {
  userId: number;
};

const { Router } = express;
const router = Router();

router.get(
  "/:companyId",
  asyncHandler(async (req: AuthedRequest<{ companyId: string }>, res: Response) => {
    const sql = getDb();
    const companyId = parseId(req.params.companyId);
    if (companyId === null) return res.status(400).json({ error: "Invalid ID" });

    const notes = (await sql`
      SELECT n.* FROM notes n
      JOIN companies c ON n.company_id = c.id
      WHERE n.company_id = ${companyId} AND c.user_id = ${req.userId}
      ORDER BY n.created_at DESC
    `) as NoteRow[];

    return res.json(notes);
  })
);

router.post(
  "/:companyId",
  validate(createNoteSchema),
  asyncHandler(async (req: AuthedRequest<{ companyId: string }, CreateNoteBody>, res: Response) => {
    const sql = getDb();
    const companyId = parseId(req.params.companyId);
    if (companyId === null) return res.status(400).json({ error: "Invalid ID" });
    const { title, content, type, stage_id } = req.body;

    const [company] = (await sql`
      SELECT id FROM companies WHERE id = ${companyId} AND user_id = ${req.userId}
    `) as { id: number }[];

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    if (stage_id) {
      const [stage] = (await sql`
        SELECT id FROM stages WHERE id = ${stage_id} AND company_id = ${companyId}
      `) as { id: number }[];

      if (!stage) {
        return res.status(400).json({ error: "Invalid stage for this company" });
      }
    }

    const [note] = (await sql`
      INSERT INTO notes (company_id, stage_id, title, content, type)
      VALUES (
        ${companyId},
        ${stage_id || null},
        ${title || "Untitled"},
        ${content || ""},
        ${type || "general"}
      )
      RETURNING *
    `) as NoteRow[];

    return res.status(201).json(note);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest<{ id: string }>, res: Response) => {
    const sql = getDb();
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid ID" });

    const [deleted] = (await sql`
      DELETE FROM notes
      USING companies
      WHERE notes.id = ${id}
        AND notes.company_id = companies.id
        AND companies.user_id = ${req.userId}
      RETURNING notes.id
    `) as { id: number }[];

    if (!deleted) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.json({ success: true, id: deleted.id, message: "deleted successfully" });
  })
);

export default router;
