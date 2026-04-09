import axios, { type AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";

import type { User } from "./types";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const api: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthRoute = error.config?.url?.includes("/api/auth/");
    if (error.response?.status === 401 && !isAuthRoute) {
      await removeToken();
      onForceLogout?.();
      return Promise.reject(new Error("Session expired. Please log in again."));
    }
    const message =
      error.response?.data?.error || `Request failed: ${error.response?.status}`;
    return Promise.reject(new Error(message));
  },
);

let onForceLogout: (() => void) | null = null;

export function setForceLogoutHandler(handler: () => void) {
  onForceLogout = handler;
}

export { api };

export async function saveToken(token: string): Promise<void> {
  if (process.env.EXPO_OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

export async function getToken(): Promise<string | null> {
  if (process.env.EXPO_OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  if (process.env.EXPO_OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}

export async function saveUser(user: User): Promise<void> {
  const data = JSON.stringify(user);
  if (process.env.EXPO_OS === "web") {
    localStorage.setItem(USER_KEY, data);
  } else {
    await SecureStore.setItemAsync(USER_KEY, data);
  }
}

export async function getSavedUser(): Promise<User | null> {
  let data: string | null;
  if (process.env.EXPO_OS === "web") {
    data = localStorage.getItem(USER_KEY);
  } else {
    data = await SecureStore.getItemAsync(USER_KEY);
  }
  return data ? JSON.parse(data) : null;
}
