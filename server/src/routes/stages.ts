import express from "express";
import { getDb } from "../db/connection";
import { validate } from "../middleware/validate";
import { createStageSchema, updateStageSchema } from "../validation/schemas";
import { asyncHandler } from "../middleware/async-handler";
import { parseId } from "../middleware/parse-id";

type Request<P = Record<string, string>, B = unknown> = import("express").Request<P, unknown, B>;
type Response = import("express").Response;

interface StageRow {
  id: number;
  company_id: number;
  name: string;
  status: "pending" | "completed" | "cancelled";
  scheduled_date: string | null;
  duration: number | null;
  interviewer: string | null;
  feedback: string | null;
  my_notes: string | null;
  created_at: string;
}

type UpdateStageBody = {
  status?: StageRow["status"];
  scheduled_date?: string | null;
  duration?: number | null;
  interviewer?: string | null;
  feedback?: string | null;
  my_notes?: string | null;
};

type CreateStageBody = {
  name: string;
};

type AuthedRequest<P = Record<string, string>, B = Record<string, unknown>> = Request<P, B> & {
  userId: number;
};

const { Router } = express;
const router = Router();

router.put(
  "/:id",
  validate(updateStageSchema),
  asyncHandler(async (req: AuthedRequest<{ id: string }, UpdateStageBody>, res: Response) => {
    const sql = getDb();
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid ID" });
    const { status, scheduled_date, duration, interviewer, feedback, my_notes } = req.body;

    const [updated] = (await sql`
      UPDATE stages SET
        status = COALESCE(${status}, stages.status),
        scheduled_date = COALESCE(${scheduled_date}, stages.scheduled_date),
        duration = COALESCE(${duration}, stages.duration),
        interviewer = COALESCE(${interviewer}, stages.interviewer),
        feedback = COALESCE(${feedback}, stages.feedback),
        my_notes = COALESCE(${my_notes}, stages.my_notes)
      FROM companies
      WHERE stages.id = ${id}
        AND stages.company_id = companies.id
        AND companies.user_id = ${req.userId}
      RETURNING stages.*
    `) as StageRow[];

    if (!updated) {
      return res.status(404).json({ error: "Stage not found" });
    }

    await sql`
      UPDATE companies SET updated_at = NOW()
      WHERE id = ${updated.company_id} AND user_id = ${req.userId}
    `;

    return res.json(updated);
  })
);

router.post(
  "/:companyId",
  validate(createStageSchema),
  asyncHandler(async (req: AuthedRequest<{ companyId: string }, CreateStageBody>, res: Response) => {
    const sql = getDb();
    const companyId = parseId(req.params.companyId);
    if (companyId === null) return res.status(400).json({ error: "Invalid ID" });
    const { name } = req.body;

    const trimmed = name.trim();

    const [company] = (await sql`
      SELECT id FROM companies WHERE id = ${companyId} AND user_id = ${req.userId}
    `) as { id: number }[];

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const [existing] = (await sql`
      SELECT id FROM stages WHERE company_id = ${companyId} AND name = ${trimmed}
    `) as { id: number }[];

    if (existing) {
      return res.status(409).json({ error: "A stage with this name already exists" });
    }

    const [stage] = (await sql`
      INSERT INTO stages (company_id, name, status)
      VALUES (${companyId}, ${trimmed}, 'pending')
      RETURNING *
    `) as StageRow[];

    await sql`
      UPDATE companies SET updated_at = NOW()
      WHERE id = ${companyId} AND user_id = ${req.userId}
    `;

    return res.status(201).json(stage);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest<{ id: string }>, res: Response) => {
    const sql = getDb();
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid ID" });

    const [stage] = (await sql`
      SELECT stages.id, stages.name, stages.company_id
      FROM stages
      JOIN companies ON stages.company_id = companies.id
      WHERE stages.id = ${id} AND companies.user_id = ${req.userId}
    `) as Pick<StageRow, "id" | "name" | "company_id">[];

    if (!stage) {
      return res.status(404).json({ error: "Stage not found" });
    }

    const [{ count }] = (await sql`
      SELECT COUNT(*)::int AS count FROM stages WHERE company_id = ${stage.company_id}
    `) as { count: number }[];

    if (count <= 1) {
      return res.status(400).json({ error: "Cannot delete the last stage" });
    }

    const [company] = (await sql`
      SELECT stage FROM companies WHERE id = ${stage.company_id}
    `) as { stage: string }[];

    if (company.stage === stage.name) {
      const [firstRemaining] = (await sql`
        SELECT name FROM stages
        WHERE company_id = ${stage.company_id} AND id != ${id}
        ORDER BY id ASC LIMIT 1
      `) as { name: string }[];

      await sql.transaction([
        sql`DELETE FROM stages WHERE id = ${id}`,
        sql`UPDATE companies SET stage = ${firstRemaining.name}, updated_at = NOW()
            WHERE id = ${stage.company_id}`,
      ]);
    } else {
      await sql.transaction([
        sql`DELETE FROM stages WHERE id = ${id}`,
        sql`UPDATE companies SET updated_at = NOW() WHERE id = ${stage.company_id}`,
      ]);
    }

    return res.json({ success: true, id: stage.id });
  })
);

export default router;
