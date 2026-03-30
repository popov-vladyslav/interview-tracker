import { api } from "./helper";
import type { CreateNotePayload, Note } from "./types";

export async function getNotes(companyId: number): Promise<Note[]> {
  const { data } = await api.get<Note[]>(
    `/api/notes/${companyId}`,
  );
  return data;
}

export async function addNote(
  companyId: number,
  payload: CreateNotePayload,
): Promise<Note> {
  const { data } = await api.post<Note>(
    `/api/notes/${companyId}`,
    payload,
  );
  return data;
}

export async function deleteNote(id: number): Promise<void> {
  await api.delete(`/api/notes/${id}`);
}
