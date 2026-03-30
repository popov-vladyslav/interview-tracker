import { create } from "zustand";
import * as companiesApi from "@/services/companies";
import type { Company, CreateCompanyPayload } from "@/services/types";

interface CompaniesState {
  companies: Company[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  fetchCompanies: () => Promise<void>;
  refreshCompanies: () => Promise<void>;
  createCompany: (payload: CreateCompanyPayload) => Promise<Company>;
  updateCompany: (
    id: number,
    payload: Partial<CreateCompanyPayload>,
  ) => Promise<void>;
  updateCompanyStage: (id: number, stage: string) => Promise<void>;
  updateCompanyStatus: (id: number, status: string) => Promise<void>;
  deleteCompany: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useCompaniesStore = create<CompaniesState>((set, get) => ({
  companies: [],
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchCompanies: async () => {
    // Only show full loading on first load
    const showLoader = get().companies.length === 0;
    set({ isLoading: showLoader, error: null });
    try {
      const companies = await companiesApi.getCompanies();
      set({ companies, isLoading: false });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load companies";
      set({ error: message, isLoading: false });
    }
  },

  refreshCompanies: async () => {
    set({ isRefreshing: true });
    try {
      const companies = await companiesApi.getCompanies();
      set({ companies, isRefreshing: false });
    } catch {
      set({ isRefreshing: false });
    }
  },

  createCompany: async (payload) => {
    const company = await companiesApi.createCompany(payload);
    set({ companies: [company, ...get().companies] });
    return company;
  },

  updateCompany: async (id, payload) => {
    const updated = await companiesApi.updateCompany(id, payload);
    set({
      companies: get().companies.map((c) =>
        c.id === id ? { ...c, ...updated } : c,
      ),
    });
  },

  updateCompanyStage: async (id, stage) => {
    const prev = get().companies;
    // Optimistic update
    set({
      companies: prev.map((c) => (c.id === id ? { ...c, stage } : c)),
    });
    try {
      await companiesApi.updateCompany(id, { stage });
    } catch {
      // Rollback
      set({ companies: prev });
    }
  },

  updateCompanyStatus: async (id, status) => {
    const prev = get().companies;
    set({
      companies: prev.map((c) =>
        c.id === id ? { ...c, status: status as Company["status"] } : c,
      ),
    });
    try {
      await companiesApi.updateCompany(id, { status: status as Company["status"] });
    } catch {
      set({ companies: prev });
    }
  },

  deleteCompany: async (id) => {
    await companiesApi.deleteCompany(id);
    set({ companies: get().companies.filter((c) => c.id !== id) });
  },

  clearError: () => set({ error: null }),
}));
