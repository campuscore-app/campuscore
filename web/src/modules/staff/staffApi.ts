import { apiFetch } from "../../shared/api/client";
import type { StaffMember } from "../../shared/types";

export type StaffMemberInput = Omit<StaffMember, "id">;

export function getAllStaff(): Promise<StaffMember[]> {
  return apiFetch<StaffMember[]>("/api/staff");
}

export function createStaffMember(input: StaffMemberInput): Promise<StaffMember> {
  return apiFetch<StaffMember>("/api/staff", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStaffMember(id: number, input: StaffMemberInput): Promise<StaffMember> {
  return apiFetch<StaffMember>(`/api/staff/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function removeStaffMember(id: number): Promise<void> {
  return apiFetch<void>(`/api/staff/${id}`, { method: "DELETE" });
}
