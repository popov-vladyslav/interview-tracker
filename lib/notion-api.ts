// ─── Notion / Anthropic Config ───────────────────────────────────────────────
// Set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file (never commit the key).
// The app calls Anthropic's API directly with Notion MCP to read/write your DB.

import { Company, STAGES } from './types';

const DS_ID = '69702b9e-5c68-40f4-99f8-a6cea53bfd65';
const MCP_URL = 'https://mcp.notion.com/mcp';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// ─── Core caller ─────────────────────────────────────────────────────────────

async function notionCall(userPrompt: string, systemExtra = ''): Promise<unknown> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  const sys = `You are a JSON-only API helper for a Notion interview tracker database (data source: collection://${DS_ID}).
CRITICAL: Your ENTIRE response must be valid JSON. No markdown, no backticks, no explanation, no preamble. Just raw JSON.${systemExtra}`;

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'mcp-client-2025-04-04',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: sys,
      messages: [{ role: 'user', content: userPrompt }],
      mcp_servers: [{ type: 'url', url: MCP_URL, name: 'notion' }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API HTTP ${res.status}`);
  return res.json();
}

// ─── Response parsers ─────────────────────────────────────────────────────────

function extractJSON(data: unknown): unknown {
  const d = data as { content?: { type: string; text?: string }[] };
  if (!d?.content) return null;
  const text = d.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');
  const cleaned = text.replace(/```json\n?|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {}
  const match = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  return null;
}

function extractPageId(data: unknown): string | null {
  const d = data as {
    content?: {
      type: string;
      text?: string;
      content?: { text?: string }[];
    }[];
  };
  if (!d?.content) return null;
  for (const block of d.content) {
    if (block.type === 'mcp_tool_result' && block.content?.[0]?.text) {
      const match = block.content[0].text.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
      );
      if (match) return match[0];
    }
    if (block.type === 'text' && block.text) {
      try {
        const j = JSON.parse(block.text.replace(/```json\n?|```/g, '').trim()) as {
          id?: string;
          page_id?: string;
        };
        if (j?.id) return j.id;
        if (j?.page_id) return j.page_id;
      } catch {}
      const match = block.text.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
      );
      if (match) return match[0];
    }
  }
  return null;
}

// ─── Data mapping ─────────────────────────────────────────────────────────────

interface RawCompany {
  id?: string;
  name?: string;
  role?: string;
  status?: string;
  remote?: string;
  location?: string;
  salary?: string;
  hrScreen?: boolean;
  technical?: boolean;
  systemDesign?: boolean;
  clientCall?: boolean;
  finalRound?: boolean;
  offerStage?: boolean;
  appliedDate?: string;
  lastActivity?: string;
  contacts?: string;
  notes?: string;
  stageDetails?: string;
}

export function notionToCompany(raw: RawCompany): Company {
  let stages = STAGES.map((s) => ({
    name: s,
    completed: false,
    date: '',
    feedback: '',
  }));

  try {
    const sd = JSON.parse(raw.stageDetails ?? '[]') as Array<{ d?: string; f?: string }>;
    if (Array.isArray(sd)) {
      stages = stages.map((s, i) => ({ ...s, date: sd[i]?.d ?? '', feedback: sd[i]?.f ?? '' }));
    }
  } catch {}

  stages[0].completed = !!raw.hrScreen;
  stages[1].completed = !!raw.technical;
  stages[2].completed = !!raw.systemDesign;
  stages[3].completed = !!raw.clientCall;
  stages[4].completed = !!raw.finalRound;
  stages[5].completed = !!raw.offerStage;

  let contacts: Company['contacts'] = [];
  try {
    contacts = JSON.parse(raw.contacts ?? '[]') as Company['contacts'];
  } catch {}
  if (!Array.isArray(contacts)) contacts = [];

  return {
    id: raw.id ?? Math.random().toString(36).slice(2, 10),
    name: raw.name ?? '',
    role: raw.role ?? '',
    status: (raw.status as Company['status']) ?? 'Active',
    currentStage: stages.filter((s) => s.completed).length,
    contacts,
    notes: raw.notes ?? '',
    salary: raw.salary ?? '',
    location: raw.location ?? '',
    remote: (raw.remote as Company['remote']) ?? 'Remote',
    appliedDate: raw.appliedDate ?? '',
    lastActivity: raw.lastActivity ?? '',
    stages,
  };
}

function buildNotionProps(c: Company): Record<string, unknown> {
  const stages = c.stages ?? STAGES.map((s) => ({ name: s, completed: false, date: '', feedback: '' }));
  const stageDetails = JSON.stringify(
    stages.map((s) => ({ d: s.date ?? '', f: s.feedback ?? '' })),
  );
  const contacts =
    typeof c.contacts === 'string' ? c.contacts : JSON.stringify(c.contacts ?? []);

  return {
    Company: c.name,
    Role: c.role ?? '',
    Status: c.status ?? 'Active',
    'Work Mode': c.remote ?? 'Remote',
    Location: c.location ?? '',
    Salary: c.salary ?? '',
    'HR Screen': stages[0]?.completed ? '__YES__' : '__NO__',
    Technical: stages[1]?.completed ? '__YES__' : '__NO__',
    'System Design': stages[2]?.completed ? '__YES__' : '__NO__',
    'Client Call': stages[3]?.completed ? '__YES__' : '__NO__',
    'Final Round': stages[4]?.completed ? '__YES__' : '__NO__',
    'Offer Stage': stages[5]?.completed ? '__YES__' : '__NO__',
    'date:Applied Date:start': c.appliedDate ?? new Date().toISOString().split('T')[0],
    'date:Applied Date:is_datetime': 0,
    'date:Last Activity:start': c.lastActivity ?? new Date().toISOString().split('T')[0],
    'date:Last Activity:is_datetime': 0,
    Contacts: contacts,
    Notes: c.notes ?? '',
    'Stage Details': stageDetails,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchCompanies(): Promise<Company[]> {
  const data = await notionCall(
    `Search ALL pages in data source collection://${DS_ID}. Use notion-search with data_source_url="collection://${DS_ID}" and query="tracker" and page_size=25. For each page found, get its properties using notion-fetch.

Return a JSON array of objects with these exact fields:
[{"id":"page-uuid","name":"Company","role":"Role","status":"Active","remote":"Remote","location":"","salary":"","appliedDate":"2026-03-27","lastActivity":"2026-03-27","hrScreen":false,"technical":false,"systemDesign":false,"clientCall":false,"finalRound":false,"offerStage":false,"contacts":"[]","notes":"","stageDetails":"[]"}]

Map Notion properties: Company→name, Role→role, Status→status, Work Mode→remote, Location→location, Salary→salary, HR Screen→hrScreen (bool), Technical→technical (bool), System Design→systemDesign (bool), Client Call→clientCall (bool), Final Round→finalRound (bool), Offer Stage→offerStage (bool), Applied Date→appliedDate (YYYY-MM-DD), Last Activity→lastActivity (YYYY-MM-DD), Contacts→contacts (raw text), Notes→notes, Stage Details→stageDetails (raw text).

Return [] if no pages found.`,
  );
  const rows = extractJSON(data);
  return Array.isArray(rows) ? (rows as RawCompany[]).map(notionToCompany) : [];
}

export async function createNotionPage(c: Company): Promise<string | null> {
  const props = buildNotionProps(c);
  const data = await notionCall(
    `Create a new page in data source collection://${DS_ID} with these exact properties: ${JSON.stringify(props)}
Use the notion-create-pages tool with parent data_source_id="${DS_ID}".
Return {"id":"the-new-page-uuid"}`,
  );
  return extractPageId(data) ?? ((extractJSON(data) as { id?: string })?.id ?? null);
}

export async function updateNotionPage(pageId: string, c: Company): Promise<boolean> {
  const props = buildNotionProps(c);
  const data = await notionCall(
    `Update the Notion page with ID "${pageId}" using notion-update-page tool with command "update_properties".
Set these properties: ${JSON.stringify(props)}
Return {"ok":true}`,
  );
  return data != null;
}

export async function deleteNotionPage(pageId: string): Promise<boolean> {
  const data = await notionCall(
    `Archive/trash the Notion page with ID "${pageId}". Use whatever method available to remove it.
Return {"ok":true}`,
  );
  return data != null;
}
