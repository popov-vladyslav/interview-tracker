import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional().default(""),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  role: z.string().optional().default(""),
  status: z
    .enum(["Wishlist", "Active", "Paused", "Offer", "Not replied", "Rejected"])
    .optional()
    .default("Wishlist"),
  stage: z.string().optional().default("CV Review"),
  work_mode: z.enum(["Remote", "Hybrid", "On-site"]).optional().default("Remote"),
  location: z.string().optional().default(""),
  salary: z.string().optional().default(""),
  source: z
    .enum(["LinkedIn", "Referral", "Job Board", "Direct", "Recruiter", "Other"])
    .optional()
    .default("Other"),
  next_interview: z.string().nullable().optional().default(null),
});

const updateCompanySchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(["Wishlist", "Active", "Paused", "Offer", "Not replied", "Rejected"]).optional(),
  stage: z.string().optional(),
  work_mode: z.enum(["Remote", "Hybrid", "On-site"]).optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  source: z
    .enum(["LinkedIn", "Referral", "Job Board", "Direct", "Recruiter", "Other"])
    .optional(),
  next_interview: z.string().nullable().optional(),
});

const createStageSchema = z.object({
  name: z
    .string()
    .min(1, "Stage name is required")
    .max(100, "Stage name must be 100 characters or less"),
});

const updateStageSchema = z.object({
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
  scheduled_date: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  interviewer: z.string().nullable().optional(),
  feedback: z.string().nullable().optional(),
  my_notes: z.string().nullable().optional(),
});

const createContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  role: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

const createNoteSchema = z.object({
  title: z.string().optional().default("Untitled"),
  content: z.string().optional().default(""),
  type: z.enum(["general", "feedback", "transcription", "prep"]).optional().default("general"),
  stage_id: z.number().nullable().optional().default(null),
});

export {
  registerSchema,
  loginSchema,
  createCompanySchema,
  updateCompanySchema,
  createStageSchema,
  updateStageSchema,
  createContactSchema,
  createNoteSchema,
};
