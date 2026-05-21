/**
 * Auth Store — Zustand state management for authentication.
 * Handles login, logout, token storage, and user state.
 */

import { create } from 'zustand';
import { authAPI } from '../api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth state from localStorage
  init: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await authAPI.login(email, password);
    localStorage.setItem('access_token', data.access_token);
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },

  hasRole: (role) => {
    const { user } = get();
    return user?.roles?.includes(role) || false;
  },

  hasAnyRole: (roles) => {
    const { user } = get();
    return roles.some((role) => user?.roles?.includes(role)) || false;
  },

  isAdmin: () => get().hasRole('ADMIN'),
  isManager: () => get().hasAnyRole(['ADMIN', 'MANAGER']),
}));

export default useAuthStore;
