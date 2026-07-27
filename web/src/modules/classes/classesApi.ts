import { apiFetch } from "../../shared/api/client";
import type { SchoolClass } from "../../shared/types";

export type SchoolClassInput = Omit<SchoolClass, "id">;

export function getAllClasses(): Promise<SchoolClass[]> {
  return apiFetch<SchoolClass[]>("/api/classes");
}

export function createClass(input: SchoolClassInput): Promise<SchoolClass> {
  return apiFetch<SchoolClass>("/api/classes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function removeClass(id: number): Promise<void> {
  return apiFetch<void>(`/api/classes/${id}`, { method: "DELETE" });
}
