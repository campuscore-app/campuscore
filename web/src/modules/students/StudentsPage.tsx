import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Modal } from "../../shared/components/Modal";
import { RowMenu } from "../../shared/components/RowMenu";
import { LoadingState, ErrorState } from "../../shared/components/PageState";
import { SearchIcon, EditIcon, TrashIcon, DownloadIcon } from "../../shared/components/icons";
import type { Student } from "../../shared/types";
import { AddStudentForm } from "./AddStudentForm";
import { useToast } from "../../shared/toast/ToastContext";
import { useConfirm } from "../../shared/confirm/ConfirmContext";
import { useStudents } from "../../shared/students/StudentsContext";
import { useAutoOpenModal } from "../../shared/navigation/useAutoOpenModal";
import { downloadCsv } from "../../shared/utils/csv";
import { ApiError } from "../../shared/api/client";

const ROWS_PER_PAGE = 20;

/**
 * Students page — the "Students" free/core module.
 *
 * Reads/writes the shared students list (see StudentsContext) instead of
 * keeping its own private copy — Attendance and Fees need to see the same
 * enrolled students this page manages. Every action here follows the same
 * pattern used app-wide: validate against business rules, confirm
 * destructive actions with a styled dialog (not window.confirm), and
 * report the outcome with a toast (not window.alert).
 *
 * Search/filter/sort/pagination/export are all client-side over the
 * already-fetched list — there's no separate search or export API, and at
 * the scale a single school operates at, filtering the in-memory list is
 * simpler and just as fast as round-tripping to the server. Filtering only
 * covers Class and Section, not "Admission Year" or "Active/Inactive" —
 * the Student record has no such fields, so those filters would just be
 * decoration with nothing real behind them.
 */
export function StudentsPage() {
  const { students, isLoading, error, reload, addStudent, updateStudent, removeStudent } = useStudents();
  const shouldOpenFromQuickAction = useAutoOpenModal();
  const [isAddModalOpen, setIsAddModalOpen] = useState(shouldOpenFromQuickAction);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const classOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.className))).sort(),
    [students],
  );
  const sectionOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.section))).sort(),
    [students],
  );

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchesSearch =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.rollNo.toLowerCase().includes(query) ||
        s.contact.includes(query);
      const matchesClass = !classFilter || s.className === classFilter;
      const matchesSection = !sectionFilter || s.section === sectionFilter;
      return matchesSearch && matchesClass && matchesSection;
    });
  }, [students, searchQuery, classFilter, sectionFilter]);

  // Jumping back to page 1 whenever the result set changes avoids landing
  // on a now-empty page (e.g. page 3 of an unfiltered list, then a filter
  // narrows it down to one page).
  useEffect(() => {
    setPage(1);
  }, [searchQuery, classFilter, sectionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ROWS_PER_PAGE));
  const pageStudents = filteredStudents.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

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

  async function handleDeleteSelected() {
    const count = selectedIds.size;
    const confirmed = await confirm({
      title: "Remove Selected Students",
      message: `Are you sure you want to remove ${count} selected student${count === 1 ? "" : "s"} from the register? This action cannot be undone.`,
      confirmLabel: "Remove Selected",
      cancelLabel: "Cancel",
    });
    if (!confirmed) return;

    const ids = Array.from(selectedIds);
    let failures = 0;
    for (const id of ids) {
      try {
        await removeStudent(id);
      } catch {
        failures++;
      }
    }
    setSelectedIds(new Set());
    if (failures === 0) {
      showToast("success", `${ids.length} student${ids.length === 1 ? "" : "s"} removed.`);
    } else {
      showToast("error", `${failures} of ${ids.length} could not be removed. The rest were.`);
    }
  }

  function handleExportCsv() {
    const rows = selectedIds.size > 0 ? filteredStudents.filter((s) => selectedIds.has(s.id)) : filteredStudents;
    downloadCsv(
      "students.csv",
      ["Roll No", "Name", "Class", "Section", "Guardian", "Contact"],
      rows,
      (s) => [s.rollNo, s.name, s.className, s.section, s.guardianName, s.contact],
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
    const pageIds = pageStudents.map((s) => s.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((current) => {
      const next = new Set(current);
      pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  const allOnPageSelected = pageStudents.length > 0 && pageStudents.every((s) => selectedIds.has(s.id));

  const columns: Column<Student>[] = [
    {
      header: (
        <input
          type="checkbox"
          className="select-checkbox"
          checked={allOnPageSelected}
          onChange={toggleSelectAllOnPage}
          aria-label="Select all students on this page"
        />
      ),
      accessor: "id",
      render: (_value, row) => (
        <input
          type="checkbox"
          className="select-checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelected(row.id)}
          aria-label={`Select ${row.name}`}
        />
      ),
    },
    { header: "Student", accessor: "name", sortable: true },
    { header: "Roll No", accessor: "rollNo", sortable: true },
    { header: "Class", accessor: "className", sortable: true },
    { header: "Section", accessor: "section", sortable: true },
    { header: "Guardian", accessor: "guardianName" },
    { header: "Contact", accessor: "contact" },
    {
      header: "",
      accessor: "id",
      render: (_value, row) => (
        <RowMenu label={`Actions for ${row.name}`}>
          <button type="button" className="row-menu-item" onClick={() => setEditingStudent(row)}>
            <EditIcon width={15} height={15} />
            Edit
          </button>
          <button
            type="button"
            className="row-menu-item row-menu-item-danger"
            onClick={() => handleRemove(row)}
          >
            <TrashIcon width={15} height={15} />
            Delete
          </button>
        </RowMenu>
      ),
    },
  ];

  const isFiltered = searchQuery.trim() !== "" || classFilter !== "" || sectionFilter !== "";

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> / Students
      </p>

      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p className="page-subtitle">{students.length} students enrolled</p>
        </div>
        <div className="row-actions">
          <Link to="/students/classes" className="secondary-button">
            Manage Classes
          </Link>
          <button className="primary-button primary-button-inline" onClick={() => setIsAddModalOpen(true)}>
            + Add Student
          </button>
        </div>
      </div>

      {isLoading && <LoadingState label="Loading students…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}

      {!isLoading && !error && students.length === 0 && (
        <div className="table-empty-state">
          <div className="table-empty-state-title">No students found</div>
          <p className="table-empty-state-subtext">Start by adding your first student.</p>
          <button className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            + Add Student
          </button>
        </div>
      )}

      {!isLoading && !error && students.length > 0 && (
        <>
          <div className="list-toolbar">
            <div className="list-toolbar-search">
              <input
                type="text"
                className="text-input"
                placeholder="Search by name, roll number, or contact…"
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
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                aria-label="Filter by section"
              >
                <option value="">All Sections</option>
                {sectionOptions.map((s) => (
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

          {filteredStudents.length === 0 ? (
            <div className="table-empty-state">
              <div className="table-empty-state-title">
                <SearchIcon width={18} height={18} style={{ marginRight: 6, verticalAlign: -3 }} />
                No students match your search
              </div>
              <p className="table-empty-state-subtext">Try another keyword or clear the filters.</p>
            </div>
          ) : (
            <>
              <div className="table-scroll-wrapper">
                <DataTable
                  columns={columns}
                  rows={pageStudents}
                  keyField="id"
                />
              </div>

              <div className="pagination-bar">
                <span>
                  Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filteredStudents.length)}{" "}
                  of {filteredStudents.length}
                  {isFiltered ? ` (filtered from ${students.length})` : ""}
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

      {isAddModalOpen && (
        <Modal
          title="Enroll New Student"
          subtitle="Add a new student to your school's register."
          onClose={() => setIsAddModalOpen(false)}
        >
          <AddStudentForm
            existingRollNumbers={students.map((s) => s.rollNo)}
            onCancel={() => setIsAddModalOpen(false)}
            onSubmit={handleAddStudent}
          />
        </Modal>
      )}

      {editingStudent && (
        <Modal
          title="Edit Student"
          subtitle="Update this student's enrollment details."
          onClose={() => setEditingStudent(null)}
        >
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
