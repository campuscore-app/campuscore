import { apiFetch } from "../../shared/api/client";
import type { AttendanceRecord } from "../../shared/types";

export type AttendanceRecordInput = Omit<AttendanceRecord, "id">;

export interface BulkAttendanceEntry {
  studentName: string;
  className: string;
  status: AttendanceRecord["status"];
}

export interface BulkAttendanceResult {
  created: number;
  updated: number;
  locked: number;
}

export function getAllAttendance(): Promise<AttendanceRecord[]> {
  return apiFetch<AttendanceRecord[]>("/api/attendance");
}

export function updateAttendanceRecord(id: number, input: AttendanceRecordInput): Promise<AttendanceRecord> {
  return apiFetch<AttendanceRecord>(`/api/attendance/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function removeAttendanceRecord(id: number): Promise<void> {
  return apiFetch<void>(`/api/attendance/${id}`, { method: "DELETE" });
}

/** The primary way attendance gets created — marks a whole class roster
 * in one call (see AttendanceController.TakeAttendance / TakeAttendanceView.tsx). */
export function takeAttendance(date: string, entries: BulkAttendanceEntry[]): Promise<BulkAttendanceResult> {
  return apiFetch<BulkAttendanceResult>("/api/attendance/bulk", {
    method: "POST",
    body: JSON.stringify({ date, entries }),
  });
}
