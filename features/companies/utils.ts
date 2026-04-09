import type { Company } from "@/services/types";

export function getStageStats(companies: Company[]): Record<string, number> {
  return companies.reduce<Record<string, number>>((acc, c) => {
    acc[c.stage] = (acc[c.stage] ?? 0) + 1;
    return acc;
  }, {});
}

export function formatDateISO(date: Date | string): string {
  if (typeof date === "string") return date.split("T")[0];
  return date.toISOString().split("T")[0];
}
