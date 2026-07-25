import { apiFetch } from "../api/client";
import type { Student } from "../types";

/** Matches CreateStudentRequest/UpdateStudentRequest on the backend — both use this same shape (see StudentDtos.cs equivalent). */
export type StudentInput = Omit<Student, "id">;

export function getAllStudents(): Promise<Student[]> {
  return apiFetch<Student[]>("/api/students");
}

export function createStudent(input: StudentInput): Promise<Student> {
  return apiFetch<Student>("/api/students", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStudent(id: number, input: StudentInput): Promise<Student> {
  return apiFetch<Student>(`/api/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function removeStudent(id: number): Promise<void> {
  return apiFetch<void>(`/api/students/${id}`, { method: "DELETE" });
}
