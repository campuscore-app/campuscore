import { useState } from "react";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Modal } from "../../shared/components/Modal";
import { LoadingState, ErrorState } from "../../shared/components/PageState";
import type { Student } from "../../shared/types";
import { AddStudentForm } from "./AddStudentForm";
import { useToast } from "../../shared/toast/ToastContext";
import { useConfirm } from "../../shared/confirm/ConfirmContext";
import { useStudents } from "../../shared/students/StudentsContext";
import { ApiError } from "../../shared/api/client";

/**
 * Students page — the "Students" free/core module.
 *
 * Reads/writes the shared students list (see StudentsContext) instead of
 * keeping its own private copy — Attendance and Fees need to see the same
 * enrolled students this page manages. Every action here follows the same
 * pattern used app-wide: validate against business rules, confirm
 * destructive actions with a styled dialog (not window.confirm), and
 * report the outcome with a toast (not window.alert).
 */
export function StudentsPage() {
  const { students, isLoading, error, reload, addStudent, updateStudent, removeStudent } = useStudents();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  async function handleAddStudent(newStudent: Omit<Student, "id">) {
    try {
      await addStudent(newStudent);
      setIsAddModalOpen(false);
      showToast("success", `${newStudent.name} has been enrolled successfully.`);
    } catch (err) {
      // Modal stays open on failure (e.g. a roll number collision that
      // slipped past the client-side check) so the school doesn't lose
      // what they typed and can just fix the one field and resubmit.
      showToast("error", err instanceof ApiError ? err.message : "Could not enroll this student.");
    }
  }

  async function handleEditStudent(updated: Omit<Student, "id">) {
    if (!editingStudent) return;
    try {
      await updateStudent(editingStudent.id, updated);
      showToast("success", `${updated.name}'s record has been updated.`);
      setEditingStudent(null);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not update this student.");
    }
  }

  async function handleRemove(student: Student) {
    const confirmed = await confirm({
      title: "Remove Student",
      message: `Are you sure you want to remove ${student.name} (Roll No. ${student.rollNo}) from the student register? This action cannot be undone.`,
      confirmLabel: "Remove Student",
      cancelLabel: "Keep Student",
    });
    if (!confirmed) return;

    try {
      await removeStudent(student.id);
      showToast("success", `${student.name} has been removed from the register.`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not remove this student.");
    }
  }

  const columns: Column<Student>[] = [
    { header: "Roll No", accessor: "rollNo" },
    { header: "Name", accessor: "name" },
    { header: "Class", accessor: "className" },
    { header: "Section", accessor: "section" },
    { header: "Guardian", accessor: "guardianName" },
    { header: "Contact", accessor: "contact" },
    {
      header: "",
      accessor: "id",
      render: (_value, row) => (
        <div className="row-actions">
          <button className="link-button" onClick={() => setEditingStudent(row)}>
            Edit
          </button>
          <button className="link-button link-button-danger" onClick={() => handleRemove(row)}>
            Remove
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p className="page-subtitle">{students.length} students enrolled</p>
        </div>
        <button className="primary-button primary-button-inline" onClick={() => setIsAddModalOpen(true)}>
          + Add Student
        </button>
      </div>

      {isLoading && <LoadingState label="Loading students…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && <DataTable columns={columns} rows={students} keyField="id" />}

      {isAddModalOpen && (
        <Modal title="Enroll New Student" onClose={() => setIsAddModalOpen(false)}>
          <AddStudentForm
            existingRollNumbers={students.map((s) => s.rollNo)}
            onCancel={() => setIsAddModalOpen(false)}
            onSubmit={handleAddStudent}
          />
        </Modal>
      )}

      {editingStudent && (
        <Modal title="Edit Student" onClose={() => setEditingStudent(null)}>
          <AddStudentForm
            // Excludes the student's own current roll number from the
            // uniqueness check — otherwise saving without changing the
            // roll number would incorrectly flag it as a duplicate of itself.
            existingRollNumbers={students
              .filter((s) => s.id !== editingStudent.id)
              .map((s) => s.rollNo)}
            initialValues={editingStudent}
            onCancel={() => setEditingStudent(null)}
            onSubmit={handleEditStudent}
          />
        </Modal>
      )}
    </div>
  );
}
