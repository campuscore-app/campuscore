import { useState } from "react";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Modal } from "../../shared/components/Modal";
import { LoadingState, ErrorState } from "../../shared/components/PageState";
import type { AttendanceRecord } from "../../shared/types";
import { MarkAttendanceForm } from "./MarkAttendanceForm";
import { TakeAttendanceView } from "./TakeAttendanceView";
import { useToast } from "../../shared/toast/ToastContext";
import { useConfirm } from "../../shared/confirm/ConfirmContext";
import { useStudents } from "../../shared/students/StudentsContext";
import { useApiData } from "../../shared/api/useApiData";
import { ApiError } from "../../shared/api/client";
import {
  getAllAttendance,
  updateAttendanceRecord,
  removeAttendanceRecord,
  takeAttendance,
  type BulkAttendanceEntry,
} from "./attendanceApi";

/**
 * Renders the "status" value as a colored badge instead of plain text,
 * so Present/Absent/Late are easy to tell apart at a glance.
 */
function renderStatusBadge(status: AttendanceRecord["status"]) {
  const className = `status-badge status-${status.toLowerCase()}`;
  return <span className={className}>{status}</span>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Business rule: attendance can only be corrected on the day it was marked — editing older records would let someone quietly rewrite attendance history. */
function isEditableToday(dateStr: string): boolean {
  return dateStr === today();
}

/**
 * Attendance page — the "Attendance" free/core module.
 *
 * The primary way attendance gets marked is now "Take Attendance": pick a
 * class + date once, then mark every enrolled student in that class in a
 * single save (see TakeAttendanceView) — realistic for a teacher marking a
 * full class daily, unlike the old one-student-per-modal flow. The
 * single-record MarkAttendanceForm still exists for correcting one
 * person's entry via the per-row Edit action.
 *
 * Business rules (also enforced server-side — see AttendanceManager.cs):
 * no future dates; only today's records can be corrected (isEditableToday);
 * re-taking attendance in bulk for a past date leaves already-marked
 * students on that date untouched, for the same reason.
 */
export function AttendancePage() {
  const { students } = useStudents();
  const { data, setData, isLoading, error, reload } = useApiData(getAllAttendance);
  const records = data ?? [];
  const [isTakeAttendanceOpen, setIsTakeAttendanceOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  async function handleTakeAttendance(date: string, entries: BulkAttendanceEntry[]) {
    try {
      const result = await takeAttendance(date, entries);
      setIsTakeAttendanceOpen(false);
      // The bulk endpoint returns counts, not the actual records — reload
      // is simpler and cheap enough here than trying to reconstruct the
      // created/updated rows client-side from a partial response.
      reload();

      const lockedNote =
        result.locked > 0
          ? ` ${result.locked} already-locked past entr${result.locked === 1 ? "y" : "ies"} left unchanged.`
          : "";
      showToast(
        "success",
        `Attendance saved for ${date}: ${result.created} added, ${result.updated} updated.${lockedNote}`,
      );
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not save attendance.");
    }
  }

  async function handleEditAttendance(updated: Omit<AttendanceRecord, "id">) {
    if (!editingRecord) return;
    try {
      const saved = await updateAttendanceRecord(editingRecord.id, updated);
      setData((current) => (current ?? []).map((r) => (r.id === saved.id ? saved : r)));
      showToast("success", `Attendance for ${updated.studentName} on ${updated.date} updated to ${updated.status}.`);
      setEditingRecord(null);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not update this record.");
    }
  }

  async function handleRemove(record: AttendanceRecord) {
    const confirmed = await confirm({
      title: "Delete Attendance Record",
      message: `Are you sure you want to delete the attendance record for ${record.studentName} on ${record.date}? This action cannot be undone.`,
      confirmLabel: "Delete Record",
      cancelLabel: "Keep Record",
    });
    if (!confirmed) return;

    try {
      await removeAttendanceRecord(record.id);
      setData((current) => (current ?? []).filter((r) => r.id !== record.id));
      showToast("success", `Attendance record for ${record.studentName} has been deleted.`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not delete this record.");
    }
  }

  const columns: Column<AttendanceRecord>[] = [
    { header: "Student", accessor: "studentName" },
    { header: "Class", accessor: "className" },
    { header: "Date", accessor: "date" },
    {
      header: "Status",
      accessor: "status",
      render: (value) => renderStatusBadge(value as AttendanceRecord["status"]),
    },
    {
      header: "",
      accessor: "id",
      render: (_value, row) => (
        <div className="row-actions">
          {isEditableToday(row.date) ? (
            <button className="link-button" onClick={() => setEditingRecord(row)}>
              Edit
            </button>
          ) : (
            <span className="row-action-disabled" title="Only today's attendance can be edited">
              Edit
            </span>
          )}
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
          <h1>Attendance</h1>
          <p className="page-subtitle">{records.length} records</p>
        </div>
        <button
          className="primary-button primary-button-inline"
          onClick={() => setIsTakeAttendanceOpen(true)}
        >
          + Take Attendance
        </button>
      </div>

      {isLoading && <LoadingState label="Loading attendance…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && <DataTable columns={columns} rows={records} keyField="id" />}

      {isTakeAttendanceOpen && (
        <Modal title="Take Attendance" onClose={() => setIsTakeAttendanceOpen(false)} size="wide">
          <TakeAttendanceView
            students={students}
            onCancel={() => setIsTakeAttendanceOpen(false)}
            onSave={handleTakeAttendance}
          />
        </Modal>
      )}

      {editingRecord && (
        <Modal title="Edit Attendance" onClose={() => setEditingRecord(null)}>
          <MarkAttendanceForm
            // Excludes this record's own (student, date) pair from the
            // duplicate check — otherwise saving without changing either
            // field would incorrectly flag it as a duplicate of itself.
            existingEntries={records
              .filter((r) => r.id !== editingRecord.id)
              .map((r) => ({ studentName: r.studentName, date: r.date }))}
            initialValues={editingRecord}
            onCancel={() => setEditingRecord(null)}
            onSubmit={handleEditAttendance}
          />
        </Modal>
      )}
    </div>
  );
}
