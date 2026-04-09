import { act } from '@testing-library/react-native';
import { useAuthStore } from '../store';

// Mock services
jest.mock('@/services/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
  getMe: jest.fn(),
  logout: jest.fn(),
  deleteAccount: jest.fn(),
}));

jest.mock('@/services/helper', () => ({
  getToken: jest.fn(),
  getSavedUser: jest.fn(),
  saveToken: jest.fn(),
  saveUser: jest.fn(),
  removeToken: jest.fn(),
  setForceLogoutHandler: jest.fn(),
}));

const authApi = require('@/services/auth');
const helper = require('@/services/helper');

function resetStore() {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

describe('AuthStore', () => {
  describe('initialize', () => {
    it('sets authenticated when token exists and /me succeeds', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      helper.getToken.mockResolvedValue('valid-token');
      authApi.getMe.mockResolvedValue(mockUser);

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
      expect(helper.saveUser).toHaveBeenCalledWith(mockUser);
    });

    it('clears token when /me fails', async () => {
      helper.getToken.mockResolvedValue('expired-token');
      authApi.getMe.mockRejectedValue(new Error('Unauthorized'));

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(helper.removeToken).toHaveBeenCalled();
    });

    it('sets not authenticated when no token', async () => {
      helper.getToken.mockResolvedValue(null);

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('sets user on successful login', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        token: 'jwt-token',
      };
      authApi.login.mockResolvedValue(mockResponse);

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password');
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockResponse.user);
      expect(state.isLoading).toBe(false);
    });

    it('sets error on failed login', async () => {
      authApi.login.mockRejectedValue(new Error('Invalid credentials'));

      await act(async () => {
        try {
          await useAuthStore.getState().login('bad@example.com', 'wrong');
        } catch {
          // Expected
        }
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid credentials');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('sets user on successful registration', async () => {
      const mockResponse = {
        user: { id: 2, email: 'new@example.com', name: 'New' },
        token: 'jwt-token',
      };
      authApi.register.mockResolvedValue(mockResponse);

      await act(async () => {
        await useAuthStore.getState().register('new@example.com', 'password', 'New');
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockResponse.user);
    });
  });

  describe('logout', () => {
    it('clears auth state', async () => {
      useAuthStore.setState({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        isAuthenticated: true,
      });
      authApi.logout.mockResolvedValue(undefined);

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useAuthStore.setState({ error: 'Some error' });

      act(() => {
        useAuthStore.getState().clearError();
      });

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
