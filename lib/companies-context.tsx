import React, { createContext, useCallback, useContext, useState } from 'react';

import {
  createNotionPage,
  deleteNotionPage,
  fetchCompanies,
  updateNotionPage,
} from './notion-api';
import { Company, STAGES } from './types';

interface CompaniesContextValue {
  companies: Company[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  clearError: () => void;
  loadFromNotion: () => Promise<void>;
  addCompany: (c: Company) => Promise<void>;
  updateCompany: (c: Company) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  toggleStage: (companyId: string, stageIdx: number) => Promise<void>;
}

const CompaniesContext = createContext<CompaniesContextValue | null>(null);

export function CompaniesProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromNotion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompanies();
      setCompanies(data);
    } catch {
      setError('Failed to load from Notion. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCompany = useCallback(async (c: Company) => {
    const tempId = 'temp-' + Math.random().toString(36).slice(2, 10);
    const newCompany = { ...c, id: tempId };
    setCompanies((prev) => [...prev, newCompany]);
    setSyncing(true);
    try {
      const notionId = await createNotionPage(c);
      if (notionId) {
        setCompanies((prev) => prev.map((x) => (x.id === tempId ? { ...x, id: notionId } : x)));
      }
    } catch {
      setError('Failed to save to Notion.');
    } finally {
      setSyncing(false);
    }
  }, []);

  const updateCompany = useCallback(async (c: Company) => {
    setCompanies((prev) => prev.map((x) => (x.id === c.id ? c : x)));
    setSyncing(true);
    try {
      await updateNotionPage(c.id, c);
    } catch {
      setError('Failed to update in Notion.');
    } finally {
      setSyncing(false);
    }
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    setCompanies((prev) => prev.filter((x) => x.id !== id));
    setSyncing(true);
    try {
      await deleteNotionPage(id);
    } catch {
      setError('Failed to delete from Notion.');
    } finally {
      setSyncing(false);
    }
  }, []);

  const toggleStage = useCallback(
    async (companyId: string, stageIdx: number) => {
      const company = companies.find((x) => x.id === companyId);
      if (!company) return;
      const today = new Date().toISOString().split('T')[0];
      const updated: Company = {
        ...company,
        lastActivity: today,
        stages: company.stages.map((s, i) =>
          i === stageIdx
            ? { ...s, completed: !s.completed, date: !s.completed ? today : s.date }
            : s,
        ),
      };
      updated.currentStage = updated.stages.filter((s) => s.completed).length;
      setCompanies((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setSyncing(true);
      try {
        await updateNotionPage(updated.id, updated);
      } catch {
        setError('Failed to sync stage change.');
      } finally {
        setSyncing(false);
      }
    },
    [companies],
  );

  return (
    <CompaniesContext.Provider
      value={{
        companies,
        loading,
        syncing,
        error,
        clearError: () => setError(null),
        loadFromNotion,
        addCompany,
        updateCompany,
        deleteCompany,
        toggleStage,
      }}
    >
      {children}
    </CompaniesContext.Provider>
  );
}

export function useCompanies() {
  const ctx = useContext(CompaniesContext);
  if (!ctx) throw new Error('useCompanies must be used inside CompaniesProvider');
  return ctx;
}

// Re-export for convenience
export { STAGES };
