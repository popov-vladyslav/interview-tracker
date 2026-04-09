#!/usr/bin/env node
/**
 * One-time import script: HTML pipeline tracker → Interview Tracker DB
 * Usage: node scripts/import-pipeline.js --email user@email.com --file ~/Downloads/interview_pipeline_tracker.html
 */

const path = require("path");
// Resolve deps from server/node_modules since that's where they're installed
module.paths.push(path.join(__dirname, "../server/node_modules"));

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const fs = require("fs");
const { parse } = require("node-html-parser");
const { neon } = require("@neondatabase/serverless");

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const userEmail = getArg("--email");
const htmlFile = getArg("--file");

if (!userEmail || !htmlFile) {
  console.error(
    "Usage: node scripts/import-pipeline.js --email <email> --file <path>",
  );
  process.exit(1);
}

const filePath = htmlFile.replace(/^~/, process.env.HOME);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// ── Mapping helpers ───────────────────────────────────────────────────────────
function mapStatus(badgeClass) {
  if (badgeClass.includes("b-active")) return "Active";
  if (badgeClass.includes("b-offer")) return "Offer";
  if (badgeClass.includes("b-rejected") || badgeClass.includes("b-withdrawn"))
    return "Rejected";
  if (badgeClass.includes("b-paused")) return "Active";
  return "Wishlist"; // b-pending
}

function mapStageStatus(stageClass) {
  if (stageClass.includes("done")) return "completed";
  if (stageClass.includes("blocked")) return "cancelled";
  return "pending"; // active
}

function mapWorkMode(roleText) {
  const lower = roleText.toLowerCase();
  if (lower.includes("hybrid")) return "Hybrid";
  if (lower.includes("remote")) return "Remote";
  return "On-site";
}

function mapSource(companyName, stages) {
  const lower = companyName.toLowerCase();
  if (
    lower.includes("linkedin") ||
    stages.some((s) => s.name.toLowerCase().includes("linkedin"))
  )
    return "LinkedIn";
  if (stages.some((s) => s.name.toLowerCase().includes("djinni")))
    return "Job Board";
  return "Recruiter";
}

// Parse "27 Mar" or "27 Mar 2025" → "2026-03-27" (default year 2026 unless 2025 explicit)
function parseStageDate(text) {
  const m = text.match(
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:\s+(\d{4}))?/i,
  );
  if (!m) return null;
  const months = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  const day = m[1].padStart(2, "0");
  const mon = String(months[m[2].toLowerCase()]).padStart(2, "0");
  const year = m[3] || "2026";
  return `${year}-${mon}-${day}`;
}

// Parse "Name — email (+phone)" or "Name (alias) — email"
function parseContact(text) {
  const contacts = [];
  const parts = text
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const part of parts) {
    const phoneMatch = part.match(/\((\+[\d\s]+)\)/);
    const phone = phoneMatch ? phoneMatch[1].trim() : "";
    const clean = part.replace(/\([^)]*\)/g, "").trim();
    const emailMatch = clean.match(/[\w.+-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0].trim() : "";
    const namePart = clean.split("—")[0].replace(/\s+/g, " ").trim();
    const name = namePart || "";
    if (name || email) contacts.push({ name, email, phone });
  }
  return contacts;
}

// ── HTML parser ───────────────────────────────────────────────────────────────
function parseHtml(html) {
  const root = parse(html);
  const companies = [];

  for (const div of root.querySelectorAll(".company")) {
    const header = div.querySelector(".company-header");
    const body = div.querySelector(".company-body");
    if (!header) continue;

    const nameEl = header.querySelector(".company-name");
    const roleEl = header.querySelector(".company-role");
    const badgeEl = header.querySelector(".badge");

    const rawName = nameEl ? nameEl.text.trim() : "";
    const rawRole = roleEl ? roleEl.text.trim() : "";
    const badgeClass = badgeEl ? badgeEl.classNames : "";

    // Split role from location (e.g. "Senior Dev — Remote" or "Senior Dev — Poland")
    const roleParts = rawRole.split("—").map((s) => s.trim());
    const role = roleParts[0] || "";
    const workMode = mapWorkMode(rawRole);

    // Salary from role string (e.g. "$3,000–5,000+/month")
    const salaryMatch = rawRole.match(
      /[\$€£][\d,–+\/\s\w]+(?:\/(?:month|h|hour))?/i,
    );
    const salary = salaryMatch ? salaryMatch[0].trim() : "";

    // Stages
    const stages = [];
    for (const stageEl of div.querySelectorAll(".stage")) {
      const stageText = stageEl.text.trim();
      const stageClass = stageEl.classNames;
      const status = mapStageStatus(stageClass);
      const date = parseStageDate(stageText);
      // Clean stage name (remove date part)
      const stageName = stageText.replace(/\s*—\s*\d{1,2}\s+\w+.*$/, "").trim();
      stages.push({ name: stageName, status, scheduled_date: date });
    }

    // Current stage: last pending, else last completed
    const activeSt = [...stages].reverse().find((s) => s.status === "pending");
    const lastDone = [...stages]
      .reverse()
      .find((s) => s.status === "completed");
    const currentStage = (activeSt || lastDone)?.name || "CV Review";

    // Rows (label → value pairs)
    const rows = {};
    for (const rowEl of body ? body.querySelectorAll(".row") : []) {
      const label =
        rowEl.querySelector(".label")?.text.trim().replace(/:$/, "") || "";
      const val = rowEl.querySelector(".val")?.text.trim() || "";
      if (label) rows[label.toLowerCase()] = val;
    }

    // Contacts from recruiter / contacts / attendees rows
    const contactRows = ["recruiter", "contacts", "attendees"]
      .map((k) => rows[k])
      .filter(Boolean);
    const contacts = contactRows.flatMap((r) => parseContact(r));

    // Feedback
    const feedbackEl = body ? body.querySelector(".feedback") : null;
    const feedbackText = feedbackEl ? feedbackEl.text.trim() : "";

    // Notes text (combine misc rows)
    const miscKeys = [
      "notes",
      "rate",
      "availability",
      "tech stack",
      "also",
      "status",
    ];
    const noteParts = miscKeys
      .map((k) =>
        rows[k] ? `${k.charAt(0).toUpperCase() + k.slice(1)}: ${rows[k]}` : "",
      )
      .filter(Boolean);
    const notesText = noteParts.join("\n");

    const status = mapStatus(badgeClass);
    const source = mapSource(rawName, stages);

    companies.push({
      name: rawName,
      role,
      status,
      stage: currentStage,
      work_mode: workMode,
      location: "",
      salary,
      source,
      next_interview: null,
      stages,
      contacts,
      feedbackText,
      notesText,
    });
  }

  return companies;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set in server/.env");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  // Find user
  const [user] = await sql`SELECT id FROM users WHERE email = ${userEmail}`;
  if (!user) {
    console.error(`No user found with email: ${userEmail}`);
    process.exit(1);
  }
  const userId = user.id;
  console.log(`Found user id=${userId} for ${userEmail}`);

  // Parse HTML
  const html = fs.readFileSync(filePath, "utf8");
  const companies = parseHtml(html);
  console.log(`Parsed ${companies.length} companies from HTML`);

  let totalStages = 0,
    totalContacts = 0,
    totalNotes = 0;

  for (const company of companies) {
    // Insert company
    const [created] = await sql`
      INSERT INTO companies (name, role, status, stage, work_mode, location, salary, source, next_interview, user_id)
      VALUES (
        ${company.name}, ${company.role}, ${company.status}, ${company.stage},
        ${company.work_mode}, ${company.location}, ${company.salary}, ${company.source},
        ${company.next_interview}, ${userId}
      )
      RETURNING id
    `;
    const companyId = created.id;

    // Insert stages
    for (const stage of company.stages) {
      await sql`
        INSERT INTO stages (company_id, name, status, scheduled_date)
        VALUES (${companyId}, ${stage.name}, ${stage.status}, ${stage.scheduled_date})
      `;
      totalStages++;
    }

    // Insert contacts
    for (const contact of company.contacts) {
      await sql`
        INSERT INTO contacts (company_id, name, role, email, phone, notes)
        VALUES (${companyId}, ${contact.name}, ${"Recruiter"}, ${contact.email}, ${contact.phone}, ${""})`;
      totalContacts++;
    }

    // Insert feedback note
    if (company.feedbackText) {
      await sql`
        INSERT INTO notes (company_id, title, content, type)
        VALUES (${companyId}, ${"Feedback"}, ${company.feedbackText}, ${"feedback"})
      `;
      totalNotes++;
    }

    // Insert general notes
    if (company.notesText) {
      await sql`
        INSERT INTO notes (company_id, title, content, type)
        VALUES (${companyId}, ${"Notes"}, ${company.notesText}, ${"general"})
      `;
      totalNotes++;
    }

    console.log(
      `  ✓ ${company.name} (${company.status}) — ${company.stages.length} stages, ${company.contacts.length} contacts`,
    );
  }

  console.log(
    `\nDone! Imported ${companies.length} companies, ${totalStages} stages, ${totalContacts} contacts, ${totalNotes} notes.`,
  );
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
