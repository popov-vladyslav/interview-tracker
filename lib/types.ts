export const STAGES = [
  'HR Screen',
  'Technical',
  'System Design',
  'Client Call',
  'Final Round',
  'Offer',
] as const;

export const STATUSES = [
  'Active',
  'Paused',
  'Rejected',
  'Offer',
  'Withdrawn',
  'Accepted',
] as const;

export const WORK_MODES = ['Remote', 'Hybrid', 'On-site'] as const;

export type Status = (typeof STATUSES)[number];
export type WorkMode = (typeof WORK_MODES)[number];

export interface Stage {
  name: string;
  completed: boolean;
  date: string;
  feedback: string;
}

export interface Contact {
  name: string;
  role: string;
  email: string;
}

export interface Company {
  id: string;
  name: string;
  role: string;
  status: Status;
  currentStage: number;
  contacts: Contact[];
  notes: string;
  salary: string;
  location: string;
  remote: WorkMode;
  appliedDate: string;
  lastActivity: string;
  stages: Stage[];
}

export const STATUS_COLORS: Record<Status, { bg: string; text: string; dot: string }> = {
  Active: { bg: '#E8F5E9', text: '#2E7D32', dot: '#43A047' },
  Paused: { bg: '#FFF8E1', text: '#F57F17', dot: '#FBC02D' },
  Rejected: { bg: '#FFEBEE', text: '#C62828', dot: '#EF5350' },
  Offer: { bg: '#E3F2FD', text: '#1565C0', dot: '#42A5F5' },
  Withdrawn: { bg: '#F3E5F5', text: '#6A1B9A', dot: '#AB47BC' },
  Accepted: { bg: '#E0F2F1', text: '#00695C', dot: '#26A69A' },
};

export function emptyCompany(): Company {
  return {
    id: '',
    name: '',
    role: '',
    status: 'Active',
    currentStage: 0,
    contacts: [],
    notes: '',
    salary: '',
    location: '',
    remote: 'Remote',
    appliedDate: new Date().toISOString().split('T')[0],
    lastActivity: new Date().toISOString().split('T')[0],
    stages: STAGES.map((s) => ({ name: s, completed: false, date: '', feedback: '' })),
  };
}
