import { useState } from "react";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Modal } from "../../shared/components/Modal";
import { LoadingState, ErrorState } from "../../shared/components/PageState";
import type { StaffMember } from "../../shared/types";
import { AddStaffForm } from "./AddStaffForm";
import { useToast } from "../../shared/toast/ToastContext";
import { useConfirm } from "../../shared/confirm/ConfirmContext";
import { useApiData } from "../../shared/api/useApiData";
import { ApiError } from "../../shared/api/client";
import { getAllStaff, createStaffMember, updateStaffMember, removeStaffMember } from "./staffApi";

/**
 * Staff page — the "Staff" free/core module.
 * Same Add/Edit/Remove/validate/confirm/toast pattern as StudentsPage,
 * with its own business rule (joining date can't be in the future — see
 * AddStaffForm), which applies on edit too.
 */
export function StaffPage() {
  const { data, setData, isLoading, error, reload } = useApiData(getAllStaff);
  const staff = data ?? [];
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

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

  const columns: Column<StaffMember>[] = [
    { header: "Name", accessor: "name" },
    { header: "Role", accessor: "role" },
    { header: "Department", accessor: "department" },
    { header: "Contact", accessor: "contact" },
    { header: "Joined On", accessor: "joinedOn" },
    {
      header: "",
      accessor: "id",
      render: (_value, row) => (
        <div className="row-actions">
          <button className="link-button" onClick={() => setEditingStaff(row)}>
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
          <h1>Staff</h1>
          <p className="page-subtitle">{staff.length} staff members</p>
        </div>
        <button className="primary-button primary-button-inline" onClick={() => setIsAddModalOpen(true)}>
          + Add Staff
        </button>
      </div>

      {isLoading && <LoadingState label="Loading staff…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && <DataTable columns={columns} rows={staff} keyField="id" />}

      {isAddModalOpen && (
        <Modal title="Add Staff Member" onClose={() => setIsAddModalOpen(false)}>
          <AddStaffForm onCancel={() => setIsAddModalOpen(false)} onSubmit={handleAddStaff} />
        </Modal>
      )}

      {editingStaff && (
        <Modal title="Edit Staff Member" onClose={() => setEditingStaff(null)}>
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
