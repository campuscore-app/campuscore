import { createContext, useContext, type ReactNode } from "react";
import type { Student } from "../types";
import { useApiData } from "../api/useApiData";
import {
  getAllStudents,
  createStudent,
  updateStudent as updateStudentRequest,
  removeStudent as removeStudentRequest,
  type StudentInput,
} from "./studentsApi";

interface StudentsContextValue {
  students: Student[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  addStudent: (student: StudentInput) => Promise<Student>;
  updateStudent: (id: number, student: StudentInput) => Promise<Student>;
  removeStudent: (id: number) => Promise<void>;
}

const StudentsContext = createContext<StudentsContextValue | null>(null);

/**
 * Holds the single, shared list of enrolled students, backed by the real
 * API. Every module reads and writes the same underlying list, which is
 * what makes bulk attendance (by real class roster) and fee assignment
 * (by real student, not a free-typed name) possible.
 *
 * Mutations update local state from the server's own response
 * (setData(...)) rather than re-fetching the whole list after every
 * add/edit/remove — one extra round trip avoided per action.
 */
export function StudentsProvider({ children }: { children: ReactNode }) {
  const { data, setData, isLoading, error, reload } = useApiData(getAllStudents);
  const students = data ?? [];

  async function addStudent(input: StudentInput): Promise<Student> {
    const created = await createStudent(input);
    setData((current) => [...(current ?? []), created]);
    return created;
  }

  async function updateStudent(id: number, input: StudentInput): Promise<Student> {
    const updated = await updateStudentRequest(id, input);
    setData((current) => (current ?? []).map((s) => (s.id === id ? updated : s)));
    return updated;
  }

  async function removeStudent(id: number): Promise<void> {
    await removeStudentRequest(id);
    setData((current) => (current ?? []).filter((s) => s.id !== id));
  }

  return (
    <StudentsContext.Provider
      value={{ students, isLoading, error, reload, addStudent, updateStudent, removeStudent }}
    >
      {children}
    </StudentsContext.Provider>
  );
}

/** Gives any component read access to the enrolled students list, plus add/update/remove. */
export function useStudents() {
  const context = useContext(StudentsContext);
  if (!context) {
    throw new Error("useStudents must be used inside a <StudentsProvider>");
  }
  return context;
}
