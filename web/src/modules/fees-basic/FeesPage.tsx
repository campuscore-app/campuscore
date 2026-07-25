import { useState } from "react";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Modal } from "../../shared/components/Modal";
import { LoadingState, ErrorState } from "../../shared/components/PageState";
import type { FeeRecord, PaymentMode } from "../../shared/types";
import { AddFeeForm } from "./AddFeeForm";
import { RecordPaymentForm } from "./RecordPaymentForm";
import { PaymentHistoryModal } from "./PaymentHistoryModal";
import { useToast } from "../../shared/toast/ToastContext";
import { useConfirm } from "../../shared/confirm/ConfirmContext";
import { useStudents } from "../../shared/students/StudentsContext";
import { useApiData } from "../../shared/api/useApiData";
import { ApiError } from "../../shared/api/client";
import { getAllFees, createFee, updateFee, removeFee, recordPayment, type FeeRecordInput } from "./feesApi";

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
 */
export function FeesPage() {
  const { students } = useStudents();
  const { data, setData, isLoading, error, reload } = useApiData(getAllFees);
  const fees = data ?? [];
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeRecord | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<FeeRecord | null>(null);
  const [historyTarget, setHistoryTarget] = useState<FeeRecord | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

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

  const columns: Column<FeeRecord>[] = [
    { header: "Student", accessor: "studentName" },
    { header: "Class", accessor: "className" },
    { header: "Amount Due", accessor: "amountDue", render: (v) => formatCurrency(v as number) },
    { header: "Amount Paid", accessor: "amountPaid", render: (v) => formatCurrency(v as number) },
    { header: "Due Date", accessor: "dueDate" },
    {
      header: "Status",
      accessor: "status",
      render: (value) => renderStatusBadge(value as FeeRecord["status"]),
    },
    {
      header: "",
      accessor: "id",
      render: (_value, row) => (
        <div className="row-actions">
          <button className="link-button" onClick={() => setEditingFee(row)}>
            Edit
          </button>
          <button className="link-button" onClick={() => setHistoryTarget(row)}>
            History
          </button>
          {/* Always rendered (just hidden for Paid rows) so it reserves the
              same width in every row — otherwise "Remove" shifts left or
              right depending on whether this button is present, and the
              column stops lining up between rows. */}
          <button
            className={row.status === "Paid" ? "link-button row-action-hidden" : "link-button"}
            disabled={row.status === "Paid"}
            onClick={() => setPaymentTarget(row)}
          >
            Record Payment
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
          <h1>Fees</h1>
          <p className="page-subtitle">Basic fee tracking — this term</p>
        </div>
        <button className="primary-button primary-button-inline" onClick={() => setIsAddModalOpen(true)}>
          + Assign Fee
        </button>
      </div>

      {isLoading && <LoadingState label="Loading fee records…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && <DataTable columns={columns} rows={fees} keyField="id" />}

      {isAddModalOpen && (
        <Modal title="Assign Fee" onClose={() => setIsAddModalOpen(false)}>
          <AddFeeForm students={students} onCancel={() => setIsAddModalOpen(false)} onSubmit={handleAddFee} />
        </Modal>
      )}

      {editingFee && (
        <Modal title="Edit Fee Record" onClose={() => setEditingFee(null)}>
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
