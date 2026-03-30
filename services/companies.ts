import { api } from "./helper";
import type { Company, CreateCompanyPayload } from "./types";

export async function getCompanies(): Promise<Company[]> {
  const { data } = await api.get<Company[]>("/api/companies");
  return data;
}

export async function getCompany(id: number): Promise<Company> {
  const { data } = await api.get<Company>(`/api/companies/${id}`);
  return data;
}

export async function createCompany(
  payload: CreateCompanyPayload,
): Promise<Company> {
  const { data } = await api.post<Company>("/api/companies", payload);
  return data;
}

export async function updateCompany(
  id: number,
  payload: Partial<CreateCompanyPayload>,
): Promise<Company> {
  const { data } = await api.put<Company>(`/api/companies/${id}`, payload);
  return data;
}

export async function deleteCompany(id: number): Promise<void> {
  await api.delete(`/api/companies/${id}`);
}
