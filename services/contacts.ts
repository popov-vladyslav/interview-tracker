import { api } from "./helper";
import type { Contact, CreateContactPayload } from "./types";

export async function addContact(
  companyId: number,
  payload: CreateContactPayload,
): Promise<Contact> {
  const { data } = await api.post<Contact>(
    `/api/contacts/${companyId}`,
    payload,
  );
  return data;
}

export async function deleteContact(id: number): Promise<void> {
  await api.delete(`/api/contacts/${id}`);
}
