import { useState, type FormEvent } from "react";
import type { FeeRecord, PaymentMode } from "../../shared/types";
import { formatPaymentMode } from "../../shared/types";
import { required, isPositiveNumber } from "../../shared/validation/rules";

interface RecordPaymentFormProps {
  fee: FeeRecord;
  onCancel: () => void;
  onSubmit: (amount: number, mode: PaymentMode) => void;
}

// Wire values match the backend's PaymentMode enum member names exactly
// (see shared/types/index.ts) — formatPaymentMode() supplies the
// human-readable label shown in the dropdown.
const PAYMENT_MODES: PaymentMode[] = ["Cash", "Cheque", "BankTransfer", "Upi"];

/**
 * Form shown inside the "Record Payment" modal for one fee record.
 * Business rule enforced here: the payment amount can't push the total
 * paid past the amount due — a student can't "overpay" a fee record.
 * Payment mode is captured so each entry in the payment history says how
 * the money actually came in (needed for bank reconciliation later).
 */
export function RecordPaymentForm({ fee, onCancel, onSubmit }: RecordPaymentFormProps) {
  const remainingDue = fee.amountDue - fee.amountPaid;
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentMode>("Cash");
  const [error, setError] = useState<string | undefined>();

  function validate(): string | undefined {
    const basicError = required(amount, "Payment amount") ?? isPositiveNumber(amount, "Payment amount");
    if (basicError) return basicError;

    if (Number(amount) > remainingDue) {
      return `Payment cannot exceed the remaining balance of ₹${remainingDue.toLocaleString("en-IN")}.`;
    }
    return undefined;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (validationError) return;
    onSubmit(Number(amount), mode);
  }

  return (
    <form className="modal-form" onSubmit={handleSubmit} noValidate>
      <p className="payment-summary">
        {fee.studentName} — remaining balance:{" "}
        <strong>₹{remainingDue.toLocaleString("en-IN")}</strong> of ₹
        {fee.amountDue.toLocaleString("en-IN")}
      </p>

      <div className="form-row form-row-split">
        <div>
          <label className="field-label">Payment Amount (₹)</label>
          <input
            className={error ? "text-input text-input-error" : "text-input"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Up to ${remainingDue}`}
          />
          {error && <span className="field-error">{error}</span>}
        </div>
        <div>
          <label className="field-label">Payment Mode</label>
          <select
            className="select-input"
            value={mode}
            onChange={(e) => setMode(e.target.value as PaymentMode)}
          >
            {PAYMENT_MODES.map((option) => (
              <option key={option} value={option}>
                {formatPaymentMode(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button">
          Record Payment
        </button>
      </div>
    </form>
  );
}
