import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Modal } from "../../shared/components/Modal";
import { RowMenu } from "../../shared/components/RowMenu";
import { LoadingState, ErrorState } from "../../shared/components/PageState";
import { SearchIcon, EditIcon, TrashIcon, DownloadIcon } from "../../shared/components/icons";
import type { AttendanceRecord } from "../../shared/types";
import { MarkAttendanceForm } from "./MarkAttendanceForm";
import { useToast } from "../../shared/toast/ToastContext";
import { useConfirm } from "../../shared/confirm/ConfirmContext";
import { useApiData } from "../../shared/api/useApiData";
import { downloadCsv } from "../../shared/utils/csv";
import { ApiError } from "../../shared/api/client";
import { getAllAttendance, updateAttendanceRecord, removeAttendanceRecord } from "./attendanceApi";

const ROWS_PER_PAGE = 20;
const STATUS_OPTIONS: AttendanceRecord["status"][] = ["Present", "Absent", "Late"];

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
 *
 * Search/filter/sort/pagination/export are all client-side over the
 * already-fetched list, the same pattern as Students/Staff.
 */
export function AttendancePage() {
  const { data, setData, isLoading, error, reload } = useApiData(getAllAttendance);
  const records = useMemo(() => data ?? [], [data]);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const classOptions = useMemo(() => Array.from(new Set(records.map((r) => r.className))).sort(), [records]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !query || r.studentName.toLowerCase().includes(query) || r.className.toLowerCase().includes(query);
      const matchesClass = !classFilter || r.className === classFilter;
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [records, searchQuery, classFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, classFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ROWS_PER_PAGE));
  const pageRecords = filteredRecords.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

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

  async function handleDeleteSelected() {
    const count = selectedIds.size;
    const confirmed = await confirm({
      title: "Delete Selected Records",
      message: `Are you sure you want to delete ${count} selected attendance record${count === 1 ? "" : "s"}? This action cannot be undone.`,
      confirmLabel: "Delete Selected",
      cancelLabel: "Cancel",
    });
    if (!confirmed) return;

    const ids = Array.from(selectedIds);
    let failures = 0;
    for (const id of ids) {
      try {
        await removeAttendanceRecord(id);
        setData((current) => (current ?? []).filter((r) => r.id !== id));
      } catch {
        failures++;
      }
    }
    setSelectedIds(new Set());
    if (failures === 0) {
      showToast("success", `${ids.length} record${ids.length === 1 ? "" : "s"} deleted.`);
    } else {
      showToast("error", `${failures} of ${ids.length} could not be deleted. The rest were.`);
    }
  }

  function handleExportCsv() {
    const rows = selectedIds.size > 0 ? filteredRecords.filter((r) => selectedIds.has(r.id)) : filteredRecords;
    downloadCsv(
      "attendance.csv",
      ["Student", "Class", "Date", "Status"],
      rows,
      (r) => [r.studentName, r.className, r.date, r.status],
    );
  }

  function toggleSelected(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    const pageIds = pageRecords.map((r) => r.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((current) => {
      const next = new Set(current);
      pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  const allOnPageSelected = pageRecords.length > 0 && pageRecords.every((r) => selectedIds.has(r.id));

  const columns: Column<AttendanceRecord>[] = [
    {
      header: (
        <input
          type="checkbox"
          className="select-checkbox"
          checked={allOnPageSelected}
          onChange={toggleSelectAllOnPage}
          aria-label="Select all records on this page"
        />
      ),
      accessor: "id",
      render: (_value, row) => (
        <input
          type="checkbox"
          className="select-checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelected(row.id)}
          aria-label={`Select ${row.studentName}'s record on ${row.date}`}
        />
      ),
    },
    { header: "Student", accessor: "studentName", sortable: true },
    { header: "Class", accessor: "className", sortable: true },
    { header: "Date", accessor: "date", sortable: true },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (value) => renderStatusBadge(value as AttendanceRecord["status"]),
    },
    {
      header: "",
      accessor: "id",
      render: (_value, row) => (
        <RowMenu label={`Actions for ${row.studentName}'s record on ${row.date}`}>
          {isEditableToday(row.date) ? (
            <button type="button" className="row-menu-item" onClick={() => setEditingRecord(row)}>
              <EditIcon width={15} height={15} />
              Edit
            </button>
          ) : (
            <span className="row-action-disabled" title="Only today's attendance can be edited" style={{ padding: "8px 10px", display: "block" }}>
              Edit unavailable
            </span>
          )}
          <button type="button" className="row-menu-item row-menu-item-danger" onClick={() => handleRemove(row)}>
            <TrashIcon width={15} height={15} />
            Delete
          </button>
        </RowMenu>
      ),
    },
  ];

  const isFiltered = searchQuery.trim() !== "" || classFilter !== "" || statusFilter !== "";

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> / Attendance
      </p>

      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <p className="page-subtitle">{records.length} records</p>
        </div>
        <Link to="/attendance/take" className="primary-button primary-button-inline">
          + Take Attendance
        </Link>
      </div>

      {isLoading && <LoadingState label="Loading attendance…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}

      {!isLoading && !error && records.length === 0 && (
        <div className="table-empty-state">
          <div className="table-empty-state-title">No attendance records yet</div>
          <p className="table-empty-state-subtext">Start by taking attendance for a class.</p>
          <Link to="/attendance/take" className="primary-button">
            + Take Attendance
          </Link>
        </div>
      )}

      {!isLoading && !error && records.length > 0 && (
        <>
          <div className="list-toolbar">
            <div className="list-toolbar-search">
              <input
                type="text"
                className="text-input"
                placeholder="Search by student or class…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="list-toolbar-filter">
              <select
                className="select-input"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                aria-label="Filter by class"
              >
                <option value="">All Classes</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="list-toolbar-filter">
              <select
                className="select-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="secondary-button" onClick={handleExportCsv}>
              <DownloadIcon width={15} height={15} style={{ marginRight: 6, verticalAlign: -3 }} />
              Export CSV
            </button>
          </div>

          {selectedIds.size > 0 && (
            <div className="bulk-actions-bar">
              <span>{selectedIds.size} selected</span>
              <div className="bulk-actions-bar-buttons">
                <button type="button" className="link-button" onClick={handleExportCsv}>
                  Export Selected
                </button>
                <button type="button" className="link-button link-button-danger" onClick={handleDeleteSelected}>
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {filteredRecords.length === 0 ? (
            <div className="table-empty-state">
              <div className="table-empty-state-title">
                <SearchIcon width={18} height={18} style={{ marginRight: 6, verticalAlign: -3 }} />
                No records match your search
              </div>
              <p className="table-empty-state-subtext">Try another keyword or clear the filters.</p>
            </div>
          ) : (
            <>
              <div className="table-scroll-wrapper">
                <DataTable columns={columns} rows={pageRecords} keyField="id" />
              </div>

              <div className="pagination-bar">
                <span>
                  Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filteredRecords.length)} of{" "}
                  {filteredRecords.length}
                  {isFiltered ? ` (filtered from ${records.length})` : ""}
                </span>
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="pagination-button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="pagination-button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {editingRecord && (
        <Modal
          title="Edit Attendance"
          subtitle="Correct this student's attendance entry."
          onClose={() => setEditingRecord(null)}
        >
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
