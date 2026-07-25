import { useCallback } from "react";
import type { FeeRecord } from "../../shared/types";
import { useApiData } from "../../shared/api/useApiData";
import { LoadingState, ErrorState } from "../../shared/components/PageState";
import { getFeePaymentHistory } from "./feesApi";

interface PaymentHistoryModalProps {
  fee: FeeRecord;
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Shown inside the "Payment History" modal for one fee record.
 *
 * This is what makes the running "amountPaid" total auditable: instead of
 * just trusting a single number, a parent dispute or an audit can be
 * answered by pointing at the exact date, amount, and mode of every
 * payment that adds up to it. Doubles as a simple receipt list — each row
 * is effectively proof a specific payment was received.
 *
 * History is fetched on demand (not embedded in the fee list) since it's
 * only ever needed while this modal is open.
 */
export function PaymentHistoryModal({ fee }: PaymentHistoryModalProps) {
  const fetchHistory = useCallback(() => getFeePaymentHistory(fee.id), [fee.id]);
  const { data, isLoading, error, reload } = useApiData(fetchHistory, [fee.id]);
  const sortedPayments = [...(data ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="modal-form">
      <p className="payment-summary">
        {fee.studentName} — {formatCurrency(fee.amountPaid)} paid of {formatCurrency(fee.amountDue)}
        {sortedPayments.length > 0 &&
          ` · ${sortedPayments.length} payment${sortedPayments.length === 1 ? "" : "s"} recorded`}
      </p>

      {isLoading && <LoadingState label="Loading payment history…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}

      {!isLoading && !error && sortedPayments.length === 0 && (
        <p className="payment-summary">No payments have been recorded against this fee yet.</p>
      )}

      {!isLoading && !error && sortedPayments.length > 0 && (
        // Capped height + its own scroll region (rather than letting the
        // whole modal grow and scroll) so the header row below can stay
        // pinned in view via position: sticky as you scroll through a long
        // history — otherwise "which column is this?" becomes a problem
        // after a handful of rows.
        <div className="history-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Receipt No.</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.date}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{payment.mode}</td>
                  <td>{payment.receiptNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
