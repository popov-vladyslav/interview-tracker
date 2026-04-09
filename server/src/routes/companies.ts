import express from "express";
import { getDb } from "../db/connection";
import { validate } from "../middleware/validate";
import { createCompanySchema, updateCompanySchema } from "../validation/schemas";
import { asyncHandler } from "../middleware/async-handler";
import { parseId } from "../middleware/parse-id";

type Request<P = Record<string, string>, B = unknown> = import("express").Request<P, unknown, B>;
type Response = import("express").Response;

interface CompanyRow {
  id: number;
  name: string;
  role: string;
  status: "Wishlist" | "Active" | "Paused" | "Offer" | "Not replied" | "Rejected";
  stage: string;
  work_mode: "Remote" | "Hybrid" | "On-site";
  location: string;
  salary: string;
  source: "LinkedIn" | "Referral" | "Job Board" | "Direct" | "Recruiter" | "Other";
  next_interview: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface StageRow {
  id: number;
  company_id: number;
  name: string;
  status: "pending" | "completed" | "cancelled";
  scheduled_date: string | null;
  duration: number | null;
  interviewer: string;
  feedback: string;
  my_notes: string;
  created_at: string;
}

type CreateCompanyBody = {
  name: string;
  role: string;
  status: CompanyRow["status"];
  stage: string;
  work_mode: CompanyRow["work_mode"];
  location: string;
  salary: string;
  source: CompanyRow["source"];
  next_interview: string | null;
};

type UpdateCompanyBody = Partial<CreateCompanyBody>;
type AuthedRequest<P = Record<string, string>, B = Record<string, unknown>> = Request<P, B> & {
  userId: number;
};

const { Router } = express;
const router = Router();

const DEFAULT_STAGES: string[] = ["CV Review", "HR Review", "Technical", "Client"];

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const sql = getDb();
    const companies = (await sql`
      SELECT * FROM companies WHERE user_id = ${req.userId} ORDER BY updated_at DESC
    `) as CompanyRow[];

    const companyIds: number[] = companies.map((company: CompanyRow): number => company.id);
    const stages = companyIds.length
      ? ((await sql`
          SELECT * FROM stages
          WHERE company_id = ANY(${companyIds})
          ORDER BY id ASC
        `) as StageRow[])
      : [];

    const stagesByCompany: Record<number, StageRow[]> = {};

    for (const stage of stages) {
      if (!stagesByCompany[stage.company_id]) {
        stagesByCompany[stage.company_id] = [];
      }
      stagesByCompany[stage.company_id].push(stage);
    }

    return res.json(
      companies.map((company: CompanyRow) => ({
        ...company,
        stages: stagesByCompany[company.id] || [],
      }))
    );
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: AuthedRequest<{ id: string }>, res: Response) => {
    const sql = getDb();
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid ID" });

    const [company] = (await sql`
      SELECT * FROM companies WHERE id = ${id} AND user_id = ${req.userId}
    `) as CompanyRow[];


    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const stages = (await sql`
      SELECT * FROM stages WHERE company_id = ${id} ORDER BY id ASC
    `) as StageRow[];
    const contacts = await sql`
      SELECT * FROM contacts WHERE company_id = ${id} ORDER BY id ASC
    `;
    const notes = await sql`
      SELECT * FROM notes WHERE company_id = ${id} ORDER BY created_at DESC
    `;

    return res.json({ ...company, stages, contacts, notes });
  })
);

router.post(
  "/",
  validate(createCompanySchema),
  asyncHandler(async (req: AuthedRequest<Record<string, string>, CreateCompanyBody>, res: Response) => {
    const sql = getDb();
    const { name, role, status, stage, work_mode, location, salary, source, next_interview } = req.body;

    const [created] = (await sql`
      WITH new_company AS (
        INSERT INTO companies (
          name, role, status, stage, work_mode,
          location, salary, source, next_interview, user_id
        ) VALUES (
          ${name}, ${role}, ${status}, ${stage},
          ${work_mode}, ${location}, ${salary}, ${source},
          ${next_interview}, ${req.userId}
        )
        RETURNING *
      ),
      new_stages AS (
        INSERT INTO stages (company_id, name)
        SELECT id, unnest(${DEFAULT_STAGES}::text[])
        FROM new_company
        RETURNING *
      )
      SELECT
        (SELECT row_to_json(c) FROM new_company c) AS company,
        (SELECT COALESCE(json_agg(s ORDER BY s.id), '[]') FROM new_stages s) AS stages
    `) as { company: CompanyRow; stages: StageRow[] }[];

    return res.status(201).json({ ...created.company, stages: created.stages });
  })
);

router.put(
  "/:id",
  validate(updateCompanySchema),
  asyncHandler(async (req: AuthedRequest<{ id: string }, UpdateCompanyBody>, res: Response) => {
    const sql = getDb();
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid ID" });
    const { name, role, status, stage, work_mode, location, salary, source, next_interview } = req.body;

    const [updated] = (await sql`
      UPDATE companies SET
        name = COALESCE(${name}, name),
        role = COALESCE(${role}, role),
        status = COALESCE(${status}, status),
        stage = COALESCE(${stage}, stage),
        work_mode = COALESCE(${work_mode}, work_mode),
        location = COALESCE(${location}, location),
        salary = COALESCE(${salary}, salary),
        source = COALESCE(${source}, source),
        next_interview = COALESCE(${next_interview}, next_interview),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING *
    `) as CompanyRow[];

    if (!updated) {
      return res.status(404).json({ error: "Company not found" });
    }

    return res.json(updated);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest<{ id: string }>, res: Response) => {
    const sql = getDb();
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid ID" });

    const [deleted] = (await sql`
      DELETE FROM companies WHERE id = ${id} AND user_id = ${req.userId} RETURNING id
    `) as { id: number }[];

    if (!deleted) {
      return res.status(404).json({ error: "Company not found" });
    }

    return res.json({ success: true, id: deleted.id, message: "deleted successfully" });
  })
);

export default router;
