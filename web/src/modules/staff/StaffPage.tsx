import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Modal } from "../../shared/components/Modal";
import { RowMenu } from "../../shared/components/RowMenu";
import { LoadingState, ErrorState } from "../../shared/components/PageState";
import { SearchIcon, EditIcon, TrashIcon, DownloadIcon } from "../../shared/components/icons";
import type { StaffMember } from "../../shared/types";
import { AddStaffForm } from "./AddStaffForm";
import { useToast } from "../../shared/toast/ToastContext";
import { useConfirm } from "../../shared/confirm/ConfirmContext";
import { useApiData } from "../../shared/api/useApiData";
import { useAutoOpenModal } from "../../shared/navigation/useAutoOpenModal";
import { downloadCsv } from "../../shared/utils/csv";
import { ApiError } from "../../shared/api/client";
import { getAllStaff, createStaffMember, updateStaffMember, removeStaffMember } from "./staffApi";

const ROWS_PER_PAGE = 20;

/**
 * Staff page — the "Staff" free/core module.
 * Same Add/Edit/Remove/validate/confirm/toast pattern as StudentsPage,
 * with its own business rule (joining date can't be in the future — see
 * AddStaffForm), which applies on edit too.
 *
 * Search/filter/sort/pagination/export are all client-side over the
 * already-fetched list, same as Students — no separate search or export
 * API, and at single-school scale filtering the in-memory list is simpler
 * and just as fast as a server round trip. Filters only cover Role and
 * Department, both real fields on StaffMember — there's no
 * "Active/Inactive" field to filter by.
 */
export function StaffPage() {
  const { data, setData, isLoading, error, reload } = useApiData(getAllStaff);
  // Memoized so it's the same array reference across renders whenever
  // `data` itself hasn't changed — otherwise `data ?? []` hands out a new
  // empty array every render while loading, which would invalidate the
  // useMemo calls below for no reason.
  const staff = useMemo(() => data ?? [], [data]);
  const shouldOpenFromQuickAction = useAutoOpenModal();
  const [isAddModalOpen, setIsAddModalOpen] = useState(shouldOpenFromQuickAction);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const roleOptions = useMemo(() => Array.from(new Set(staff.map((s) => s.role))).sort(), [staff]);
  const departmentOptions = useMemo(
    () => Array.from(new Set(staff.map((s) => s.department))).sort(),
    [staff],
  );

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return staff.filter((s) => {
      const matchesSearch =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.role.toLowerCase().includes(query) ||
        s.department.toLowerCase().includes(query) ||
        s.contact.includes(query);
      const matchesRole = !roleFilter || s.role === roleFilter;
      const matchesDepartment = !departmentFilter || s.department === departmentFilter;
      return matchesSearch && matchesRole && matchesDepartment;
    });
  }, [staff, searchQuery, roleFilter, departmentFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, departmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / ROWS_PER_PAGE));
  const pageStaff = filteredStaff.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  async function handleAddStaff(newStaff: Omit<StaffMember, "id">) {
    try {
      const created = await createStaffMember(newStaff);
      setData((current) => [...(current ?? []), created]);
      setIsAddModalOpen(false);
      showToast("success", `${newStaff.name} has been added to the staff directory.`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not add this staff member.");
    }
  }

  async function handleEditStaff(updated: Omit<StaffMember, "id">) {
    if (!editingStaff) return;
    try {
      const saved = await updateStaffMember(editingStaff.id, updated);
      setData((current) => (current ?? []).map((s) => (s.id === saved.id ? saved : s)));
      showToast("success", `${updated.name}'s record has been updated.`);
      setEditingStaff(null);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not update this staff member.");
    }
  }

  async function handleRemove(member: StaffMember) {
    const confirmed = await confirm({
      title: "Remove Staff Member",
      message: `Are you sure you want to remove ${member.name} (${member.role}) from the staff directory? This action cannot be undone.`,
      confirmLabel: "Remove Staff",
      cancelLabel: "Keep Staff",
    });
    if (!confirmed) return;

    try {
      await removeStaffMember(member.id);
      setData((current) => (current ?? []).filter((s) => s.id !== member.id));
      showToast("success", `${member.name} has been removed from the staff directory.`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not remove this staff member.");
    }
  }

  async function handleDeleteSelected() {
    const count = selectedIds.size;
    const confirmed = await confirm({
      title: "Remove Selected Staff",
      message: `Are you sure you want to remove ${count} selected staff member${count === 1 ? "" : "s"} from the directory? This action cannot be undone.`,
      confirmLabel: "Remove Selected",
      cancelLabel: "Cancel",
    });
    if (!confirmed) return;

    const ids = Array.from(selectedIds);
    let failures = 0;
    for (const id of ids) {
      try {
        await removeStaffMember(id);
        setData((current) => (current ?? []).filter((s) => s.id !== id));
      } catch {
        failures++;
      }
    }
    setSelectedIds(new Set());
    if (failures === 0) {
      showToast("success", `${ids.length} staff member${ids.length === 1 ? "" : "s"} removed.`);
    } else {
      showToast("error", `${failures} of ${ids.length} could not be removed. The rest were.`);
    }
  }

  function handleExportCsv() {
    const rows = selectedIds.size > 0 ? filteredStaff.filter((s) => selectedIds.has(s.id)) : filteredStaff;
    downloadCsv(
      "staff.csv",
      ["Name", "Role", "Department", "Contact", "Joined On"],
      rows,
      (s) => [s.name, s.role, s.department, s.contact, s.joinedOn],
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
    const pageIds = pageStaff.map((s) => s.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((current) => {
      const next = new Set(current);
      pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  const allOnPageSelected = pageStaff.length > 0 && pageStaff.every((s) => selectedIds.has(s.id));

  const columns: Column<StaffMember>[] = [
    {
      header: (
        <input
          type="checkbox"
          className="select-checkbox"
          checked={allOnPageSelected}
          onChange={toggleSelectAllOnPage}
          aria-label="Select all staff on this page"
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
    { header: "Name", accessor: "name", sortable: true },
    { header: "Role", accessor: "role", sortable: true },
    { header: "Department", accessor: "department", sortable: true },
    { header: "Contact", accessor: "contact" },
    { header: "Joined On", accessor: "joinedOn", sortable: true },
    {
      header: "",
      accessor: "id",
      render: (_value, row) => (
        <RowMenu label={`Actions for ${row.name}`}>
          <button type="button" className="row-menu-item" onClick={() => setEditingStaff(row)}>
            <EditIcon width={15} height={15} />
            Edit
          </button>
          <button type="button" className="row-menu-item row-menu-item-danger" onClick={() => handleRemove(row)}>
            <TrashIcon width={15} height={15} />
            Delete
          </button>
        </RowMenu>
      ),
    },
  ];

  const isFiltered = searchQuery.trim() !== "" || roleFilter !== "" || departmentFilter !== "";

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> / Staff
      </p>

      <div className="page-header">
        <div>
          <h1>Staff</h1>
          <p className="page-subtitle">{staff.length} staff members</p>
        </div>
        <button className="primary-button primary-button-inline" onClick={() => setIsAddModalOpen(true)}>
          + Add Staff
        </button>
      </div>

      {isLoading && <LoadingState label="Loading staff…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}

      {!isLoading && !error && staff.length === 0 && (
        <div className="table-empty-state">
          <div className="table-empty-state-title">No staff added yet</div>
          <p className="table-empty-state-subtext">Start by adding your first staff member.</p>
          <button className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            + Add Staff
          </button>
        </div>
      )}

      {!isLoading && !error && staff.length > 0 && (
        <>
          <div className="list-toolbar">
            <div className="list-toolbar-search">
              <input
                type="text"
                className="text-input"
                placeholder="Search by name, role, department, or contact…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="list-toolbar-filter">
              <select
                className="select-input"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
              >
                <option value="">All Roles</option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="list-toolbar-filter">
              <select
                className="select-input"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Filter by department"
              >
                <option value="">All Departments</option>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
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

          {filteredStaff.length === 0 ? (
            <div className="table-empty-state">
              <div className="table-empty-state-title">
                <SearchIcon width={18} height={18} style={{ marginRight: 6, verticalAlign: -3 }} />
                No staff match your search
              </div>
              <p className="table-empty-state-subtext">Try another keyword or clear the filters.</p>
            </div>
          ) : (
            <>
              <div className="table-scroll-wrapper">
                <DataTable columns={columns} rows={pageStaff} keyField="id" />
              </div>

              <div className="pagination-bar">
                <span>
                  Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filteredStaff.length)} of{" "}
                  {filteredStaff.length}
                  {isFiltered ? ` (filtered from ${staff.length})` : ""}
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
          title="Add Staff Member"
          subtitle="Add a new staff member to your institution."
          onClose={() => setIsAddModalOpen(false)}
        >
          <AddStaffForm onCancel={() => setIsAddModalOpen(false)} onSubmit={handleAddStaff} />
        </Modal>
      )}

      {editingStaff && (
        <Modal
          title="Edit Staff Member"
          subtitle="Update this staff member's details."
          onClose={() => setEditingStaff(null)}
        >
          <AddStaffForm
            initialValues={editingStaff}
            onCancel={() => setEditingStaff(null)}
            onSubmit={handleEditStaff}
          />
        </Modal>
      )}
    </div>
  );
}
