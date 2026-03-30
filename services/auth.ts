import { api, removeToken, saveToken, saveUser } from "./helper";
import type { AuthResponse, User } from "./types";

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/register", {
    email,
    password,
    name,
  });
  await saveToken(data.token);
  await saveUser(data.user);
  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  await saveToken(data.token);
  await saveUser(data.user);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/api/auth/me");
  return data;
}

export async function logout(): Promise<void> {
  await removeToken();
}

export async function deleteAccount(): Promise<void> {
  await api.delete("/api/auth/me");
  await removeToken();
}
