import { act } from '@testing-library/react-native';
import { useCompaniesStore } from '../store';

jest.mock('@/services/companies', () => ({
  getCompanies: jest.fn(),
  createCompany: jest.fn(),
  updateCompany: jest.fn(),
  deleteCompany: jest.fn(),
}));

const companiesApi = require('@/services/companies');

const mockCompany = (overrides = {}) => ({
  id: 1,
  name: 'Test Corp',
  role: 'Engineer',
  status: 'Active' as const,
  stage: 'Technical',
  work_mode: 'Remote' as const,
  location: '',
  salary: '',
  source: 'LinkedIn' as const,
  next_interview: null,
  user_id: 1,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  stages: [],
  ...overrides,
});

function resetStore() {
  useCompaniesStore.setState({
    companies: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

describe('CompaniesStore', () => {
  describe('fetchCompanies', () => {
    it('loads companies and sets state', async () => {
      const companies = [mockCompany(), mockCompany({ id: 2, name: 'Other Inc' })];
      companiesApi.getCompanies.mockResolvedValue(companies);

      await act(async () => {
        await useCompaniesStore.getState().fetchCompanies();
      });

      const state = useCompaniesStore.getState();
      expect(state.companies).toEqual(companies);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error on failure', async () => {
      companiesApi.getCompanies.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useCompaniesStore.getState().fetchCompanies();
      });

      const state = useCompaniesStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });

    it('shows loading only on first load', async () => {
      useCompaniesStore.setState({ companies: [mockCompany()] });
      companiesApi.getCompanies.mockResolvedValue([mockCompany()]);

      const loadingStates: boolean[] = [];
      const unsub = useCompaniesStore.subscribe((s) => {
        loadingStates.push(s.isLoading);
      });

      await act(async () => {
        await useCompaniesStore.getState().fetchCompanies();
      });

      unsub();
      // Should NOT have set isLoading=true since companies already existed
      expect(loadingStates).not.toContain(true);
    });
  });

  describe('createCompany', () => {
    it('adds company to list', async () => {
      const newCompany = mockCompany({ id: 3, name: 'New Corp' });
      companiesApi.createCompany.mockResolvedValue(newCompany);

      await act(async () => {
        const result = await useCompaniesStore.getState().createCompany({
          name: 'New Corp',
        });
        expect(result).toEqual(newCompany);
      });

      const state = useCompaniesStore.getState();
      expect(state.companies[0]).toEqual(newCompany);
    });
  });

  describe('updateCompany', () => {
    it('updates company in list', async () => {
      const existing = mockCompany();
      useCompaniesStore.setState({ companies: [existing] });
      const updated = { ...existing, name: 'Updated Corp' };
      companiesApi.updateCompany.mockResolvedValue(updated);

      await act(async () => {
        await useCompaniesStore.getState().updateCompany(1, { name: 'Updated Corp' });
      });

      expect(useCompaniesStore.getState().companies[0].name).toBe('Updated Corp');
    });
  });

  describe('updateCompanyStage (optimistic)', () => {
    it('updates optimistically and keeps on success', async () => {
      useCompaniesStore.setState({ companies: [mockCompany()] });
      companiesApi.updateCompany.mockResolvedValue({});

      await act(async () => {
        await useCompaniesStore.getState().updateCompanyStage(1, 'HR Review');
      });

      expect(useCompaniesStore.getState().companies[0].stage).toBe('HR Review');
    });

    it('rolls back on failure', async () => {
      useCompaniesStore.setState({ companies: [mockCompany({ stage: 'Technical' })] });
      companiesApi.updateCompany.mockRejectedValue(new Error('fail'));

      await act(async () => {
        await useCompaniesStore.getState().updateCompanyStage(1, 'HR Review');
      });

      expect(useCompaniesStore.getState().companies[0].stage).toBe('Technical');
    });
  });

  describe('updateCompanyStatus (optimistic)', () => {
    it('updates optimistically and keeps on success', async () => {
      useCompaniesStore.setState({ companies: [mockCompany({ status: 'Active' })] });
      companiesApi.updateCompany.mockResolvedValue({});

      await act(async () => {
        await useCompaniesStore.getState().updateCompanyStatus(1, 'Offer');
      });

      expect(useCompaniesStore.getState().companies[0].status).toBe('Offer');
    });

    it('rolls back on failure', async () => {
      useCompaniesStore.setState({ companies: [mockCompany({ status: 'Active' })] });
      companiesApi.updateCompany.mockRejectedValue(new Error('fail'));

      await act(async () => {
        await useCompaniesStore.getState().updateCompanyStatus(1, 'Offer');
      });

      expect(useCompaniesStore.getState().companies[0].status).toBe('Active');
    });
  });

  describe('deleteCompany', () => {
    it('removes company from list', async () => {
      useCompaniesStore.setState({ companies: [mockCompany(), mockCompany({ id: 2 })] });
      companiesApi.deleteCompany.mockResolvedValue({});

      await act(async () => {
        await useCompaniesStore.getState().deleteCompany(1);
      });

      const state = useCompaniesStore.getState();
      expect(state.companies).toHaveLength(1);
      expect(state.companies[0].id).toBe(2);
    });
  });

  describe('refreshCompanies', () => {
    it('updates companies and clears refreshing flag on success', async () => {
      const companies = [mockCompany(), mockCompany({ id: 2, name: 'Other Inc' })];
      companiesApi.getCompanies.mockResolvedValue(companies);

      await act(async () => {
        await useCompaniesStore.getState().refreshCompanies();
      });

      const state = useCompaniesStore.getState();
      expect(state.companies).toEqual(companies);
      expect(state.isRefreshing).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error and clears refreshing flag on failure', async () => {
      companiesApi.getCompanies.mockRejectedValue(new Error('Refresh failed'));

      await act(async () => {
        await useCompaniesStore.getState().refreshCompanies();
      });

      const state = useCompaniesStore.getState();
      expect(state.error).toBe('Refresh failed');
      expect(state.isRefreshing).toBe(false);
    });
  });
});
