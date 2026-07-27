import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Modal } from "../../shared/components/Modal";
import { RowMenu } from "../../shared/components/RowMenu";
import { LoadingState, ErrorState } from "../../shared/components/PageState";
import { SearchIcon, EditIcon, TrashIcon, DownloadIcon, ClockIcon, PlusCircleIcon } from "../../shared/components/icons";
import type { FeeRecord, PaymentMode } from "../../shared/types";
import { AddFeeForm } from "./AddFeeForm";
import { RecordPaymentForm } from "./RecordPaymentForm";
import { PaymentHistoryModal } from "./PaymentHistoryModal";
import { useToast } from "../../shared/toast/ToastContext";
import { useConfirm } from "../../shared/confirm/ConfirmContext";
import { useStudents } from "../../shared/students/StudentsContext";
import { useApiData } from "../../shared/api/useApiData";
import { useAutoOpenModal } from "../../shared/navigation/useAutoOpenModal";
import { downloadCsv } from "../../shared/utils/csv";
import { ApiError } from "../../shared/api/client";
import { getAllFees, createFee, updateFee, removeFee, recordPayment, type FeeRecordInput } from "./feesApi";

const ROWS_PER_PAGE = 20;
const STATUS_OPTIONS: FeeRecord["status"][] = ["Paid", "Pending", "Overdue"];

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function renderStatusBadge(status: FeeRecord["status"]) {
  const className = `status-badge status-${status.toLowerCase()}`;
  return <span className={className}>{status}</span>;
}

/**
 * Fees page — the "Fees (Basic)" free/core module.
 * Same Add/Edit/Remove/validate/confirm/toast pattern as the other
 * modules, plus two fees-specific actions: Record Payment (which enforces
 * the business rule that a payment can't push amountPaid past amountDue —
 * enforced server-side in FeeManager.cs) and History (a read-only audit
 * trail of every payment that adds up to amountPaid, fetched on demand —
 * see PaymentHistoryModal). Status (Paid/Pending/Overdue) is derived
 * server-side on every read, never trusted from client state.
 *
 * Search/filter/sort/pagination/export are all client-side over the
 * already-fetched list, the same pattern as Students/Staff/Attendance.
 */
export function FeesPage() {
  const { students } = useStudents();
  const { data, setData, isLoading, error, reload } = useApiData(getAllFees);
  const fees = useMemo(() => data ?? [], [data]);
  const shouldOpenFromQuickAction = useAutoOpenModal();
  const [isAddModalOpen, setIsAddModalOpen] = useState(shouldOpenFromQuickAction);
  const [editingFee, setEditingFee] = useState<FeeRecord | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<FeeRecord | null>(null);
  const [historyTarget, setHistoryTarget] = useState<FeeRecord | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const classOptions = useMemo(() => Array.from(new Set(fees.map((f) => f.className))).sort(), [fees]);

  const filteredFees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return fees.filter((f) => {
      const matchesSearch =
        !query || f.studentName.toLowerCase().includes(query) || f.className.toLowerCase().includes(query);
      const matchesClass = !classFilter || f.className === classFilter;
      const matchesStatus = !statusFilter || f.status === statusFilter;
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [fees, searchQuery, classFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, classFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / ROWS_PER_PAGE));
  const pageFees = filteredFees.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  async function handleAddFee(newFee: FeeRecordInput) {
    try {
      const created = await createFee(newFee);
      setData((current) => [...(current ?? []), created]);
      setIsAddModalOpen(false);
      showToast("success", `Fee of ${formatCurrency(newFee.amountDue)} assigned to ${newFee.studentName}.`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not assign this fee.");
    }
  }

  async function handleEditFee(updated: FeeRecordInput) {
    if (!editingFee) return;
    try {
      const saved = await updateFee(editingFee.id, updated);
      setData((current) => (current ?? []).map((f) => (f.id === saved.id ? saved : f)));
      showToast("success", `Fee record for ${updated.studentName} has been updated.`);
      setEditingFee(null);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not update this fee record.");
    }
  }

  async function handleRecordPayment(amount: number, mode: PaymentMode) {
    if (!paymentTarget) return;
    try {
      const saved = await recordPayment(paymentTarget.id, amount, mode);
      setData((current) => (current ?? []).map((f) => (f.id === saved.id ? saved : f)));
      showToast(
        "success",
        `Payment of ${formatCurrency(amount)} (${mode}) recorded for ${paymentTarget.studentName}. Status: ${saved.status}.`,
      );
      setPaymentTarget(null);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not record this payment.");
    }
  }

  async function handleRemove(fee: FeeRecord) {
    const confirmed = await confirm({
      title: "Remove Fee Record",
      message: `Are you sure you want to remove the fee record for ${fee.studentName} (${formatCurrency(fee.amountDue)})? This action cannot be undone.`,
      confirmLabel: "Remove Record",
      cancelLabel: "Keep Record",
    });
    if (!confirmed) return;

    try {
      await removeFee(fee.id);
      setData((current) => (current ?? []).filter((f) => f.id !== fee.id));
      showToast("success", `Fee record for ${fee.studentName} has been removed.`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not remove this fee record.");
    }
  }

  async function handleDeleteSelected() {
    const count = selectedIds.size;
    const confirmed = await confirm({
      title: "Remove Selected Fee Records",
      message: `Are you sure you want to remove ${count} selected fee record${count === 1 ? "" : "s"}? This action cannot be undone.`,
      confirmLabel: "Remove Selected",
      cancelLabel: "Cancel",
    });
    if (!confirmed) return;

    const ids = Array.from(selectedIds);
    let failures = 0;
    for (const id of ids) {
      try {
        await removeFee(id);
        setData((current) => (current ?? []).filter((f) => f.id !== id));
      } catch {
        failures++;
      }
    }
    setSelectedIds(new Set());
    if (failures === 0) {
      showToast("success", `${ids.length} fee record${ids.length === 1 ? "" : "s"} removed.`);
    } else {
      showToast("error", `${failures} of ${ids.length} could not be removed. The rest were.`);
    }
  }

  function handleExportCsv() {
    const rows = selectedIds.size > 0 ? filteredFees.filter((f) => selectedIds.has(f.id)) : filteredFees;
    downloadCsv(
      "fees.csv",
      ["Student", "Class", "Amount Due", "Amount Paid", "Due Date", "Status"],
      rows,
      (f) => [f.studentName, f.className, f.amountDue, f.amountPaid, f.dueDate, f.status],
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
    const pageIds = pageFees.map((f) => f.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((current) => {
      const next = new Set(current);
      pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  const allOnPageSelected = pageFees.length > 0 && pageFees.every((f) => selectedIds.has(f.id));

  const columns: Column<FeeRecord>[] = [
    {
      header: (
        <input
          type="checkbox"
          className="select-checkbox"
          checked={allOnPageSelected}
          onChange={toggleSelectAllOnPage}
          aria-label="Select all fee records on this page"
        />
      ),
      accessor: "id",
      render: (_value, row) => (
        <input
          type="checkbox"
          className="select-checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelected(row.id)}
          aria-label={`Select ${row.studentName}'s fee record`}
        />
      ),
    },
    { header: "Student", accessor: "studentName", sortable: true },
    { header: "Class", accessor: "className", sortable: true },
    { header: "Amount Due", accessor: "amountDue", sortable: true, render: (v) => formatCurrency(v as number) },
    { header: "Amount Paid", accessor: "amountPaid", sortable: true, render: (v) => formatCurrency(v as number) },
    { header: "Due Date", accessor: "dueDate", sortable: true },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (value) => renderStatusBadge(value as FeeRecord["status"]),
    },
    {
      header: "",
      accessor: "id",
      render: (_value, row) => (
        <RowMenu label={`Actions for ${row.studentName}'s fee record`}>
          <button type="button" className="row-menu-item" onClick={() => setEditingFee(row)}>
            <EditIcon width={15} height={15} />
            Edit
          </button>
          <button type="button" className="row-menu-item" onClick={() => setHistoryTarget(row)}>
            <ClockIcon width={15} height={15} />
            Payment History
          </button>
          {row.status !== "Paid" && (
            <button type="button" className="row-menu-item" onClick={() => setPaymentTarget(row)}>
              <PlusCircleIcon width={15} height={15} />
              Record Payment
            </button>
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
        <Link to="/">Dashboard</Link> / Fees
      </p>

      <div className="page-header">
        <div>
          <h1>Fees</h1>
          <p className="page-subtitle">Basic fee tracking — this term</p>
        </div>
        <button className="primary-button primary-button-inline" onClick={() => setIsAddModalOpen(true)}>
          + Assign Fee
        </button>
      </div>

      {isLoading && <LoadingState label="Loading fee records…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}

      {!isLoading && !error && fees.length === 0 && (
        <div className="table-empty-state">
          <div className="table-empty-state-title">No fee records yet</div>
          <p className="table-empty-state-subtext">Start by assigning a fee to an enrolled student.</p>
          <button className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            + Assign Fee
          </button>
        </div>
      )}

      {!isLoading && !error && fees.length > 0 && (
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

          {filteredFees.length === 0 ? (
            <div className="table-empty-state">
              <div className="table-empty-state-title">
                <SearchIcon width={18} height={18} style={{ marginRight: 6, verticalAlign: -3 }} />
                No fee records match your search
              </div>
              <p className="table-empty-state-subtext">Try another keyword or clear the filters.</p>
            </div>
          ) : (
            <>
              <div className="table-scroll-wrapper">
                <DataTable columns={columns} rows={pageFees} keyField="id" />
              </div>

              <div className="pagination-bar">
                <span>
                  Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filteredFees.length)} of{" "}
                  {filteredFees.length}
                  {isFiltered ? ` (filtered from ${fees.length})` : ""}
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
          title="Assign Fee"
          subtitle="Assign a new fee record to an enrolled student."
          onClose={() => setIsAddModalOpen(false)}
        >
          <AddFeeForm students={students} onCancel={() => setIsAddModalOpen(false)} onSubmit={handleAddFee} />
        </Modal>
      )}

      {editingFee && (
        <Modal
          title="Edit Fee Record"
          subtitle="Update this fee record's details."
          onClose={() => setEditingFee(null)}
        >
          <AddFeeForm
            students={students}
            initialValues={editingFee}
            amountAlreadyPaid={editingFee.amountPaid}
            onCancel={() => setEditingFee(null)}
            onSubmit={handleEditFee}
          />
        </Modal>
      )}

      {paymentTarget && (
        <Modal title="Record Payment" onClose={() => setPaymentTarget(null)}>
          <RecordPaymentForm
            fee={paymentTarget}
            onCancel={() => setPaymentTarget(null)}
            onSubmit={handleRecordPayment}
          />
        </Modal>
      )}

      {historyTarget && (
        <Modal title="Payment History" onClose={() => setHistoryTarget(null)}>
          <PaymentHistoryModal fee={historyTarget} />
        </Modal>
      )}
    </div>
  );
}
