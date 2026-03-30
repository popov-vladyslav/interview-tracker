import { api } from "./helper";
import type { Stage, UpdateStagePayload } from "./types";

export async function updateStage(
  id: number,
  payload: UpdateStagePayload,
): Promise<Stage> {
  const { data } = await api.put<Stage>(`/api/stages/${id}`, payload);
  return data;
}

export async function createStage(
  companyId: number,
  name: string,
): Promise<Stage> {
  const { data } = await api.post<Stage>(`/api/stages/${companyId}`, { name });
  return data;
}

export async function deleteStage(id: number): Promise<void> {
  await api.delete(`/api/stages/${id}`);
}
