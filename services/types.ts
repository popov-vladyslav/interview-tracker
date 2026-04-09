export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const STATUSES = ["Wishlist", "Active", "Paused", "Offer", "Not replied", "Rejected"] as const;
export type Status = (typeof STATUSES)[number];

export type StageStatus = "pending" | "completed" | "cancelled";


export const WORK_MODES = ["Remote", "Hybrid", "On-site"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export type NoteType = "general" | "feedback" | "transcription" | "prep";

export const SOURCES = [
  "LinkedIn",
  "Referral",
  "Job Board",
  "Direct",
  "Recruiter",
  "Other",
] as const;
export type Source = (typeof SOURCES)[number];

export const DEFAULT_STAGES = [
  "CV Review",
  "HR Review",
  "Technical",
  "Client",
] as const;

export type StageName = (typeof DEFAULT_STAGES)[number] | (string & {});

export interface Company {
  id: number;
  name: string;
  role: string;
  status: Status;
  stage: StageName;

  work_mode: WorkMode;
  location: string;
  salary: string;
  source: Source;
  next_interview: string | null;
  created_at: string;
  updated_at: string;
  stages: Stage[];
  contacts?: Contact[];
  notes?: Note[];
}

export interface Stage {
  id: number;
  company_id: number;
  name: string;
  status: StageStatus;
  scheduled_date: string | null;
  duration: number | null;
  interviewer: string;
  feedback: string;
  my_notes: string;
  created_at: string;
}

export interface Contact {
  id: number;
  company_id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
}

export interface Note {
  id: number;
  company_id: number;
  stage_id: number | null;
  title: string;
  content: string;
  type: NoteType;
  created_at: string;
}

export interface CreateCompanyPayload {
  name: string;
  role?: string;
  status?: Status;
  stage?: StageName;

  work_mode?: WorkMode;
  location?: string;
  salary?: string;
  source?: Source;
  next_interview?: string;
}

export interface UpdateStagePayload {
  status?: StageStatus;
  scheduled_date?: string;
  duration?: number;
  interviewer?: string;
  feedback?: string;
  my_notes?: string;
}

export interface CreateContactPayload {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface CreateNotePayload {
  title?: string;
  content: string;
  type?: NoteType;
  stage_id?: number;
}
