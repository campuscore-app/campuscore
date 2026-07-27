import { useState, type FormEvent } from "react";
import type { FeeRecord, PaymentMode } from "../../shared/types";
import { formatPaymentMode } from "../../shared/types";
import { required, isPositiveNumber } from "../../shared/validation/rules";
import { useFieldValidation } from "../../shared/validation/useFieldValidation";

interface RecordPaymentFormProps {
  fee: FeeRecord;
  onCancel: () => void;
  onSubmit: (amount: number, mode: PaymentMode) => Promise<void>;
}

// Wire values match the backend's PaymentMode enum member names exactly
// (see shared/types/index.ts) — formatPaymentMode() supplies the
// human-readable label shown in the dropdown.
const PAYMENT_MODES: PaymentMode[] = ["Cash", "Cheque", "BankTransfer", "Upi"];

interface FormErrors {
  amount?: string;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const basicError = required(amount, "Payment amount") ?? isPositiveNumber(amount, "Payment amount");
    if (basicError) return { amount: basicError };

    if (Number(amount) > remainingDue) {
      return { amount: `Payment cannot exceed the remaining balance of ₹${remainingDue.toLocaleString("en-IN")}.` };
    }
    return {};
  }

  const { shownError, clearError, handleBlur, validateOnSubmit, isFormValid } = useFieldValidation(validate);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateOnSubmit()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(Number(amount), mode);
    } finally {
      setIsSubmitting(false);
    }
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
          <label className="field-label">
            Payment Amount (₹)<span className="required-asterisk">*</span>
          </label>
          <input
            className={shownError("amount") ? "text-input text-input-error" : "text-input"}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              clearError("amount");
            }}
            onBlur={() => handleBlur("amount")}
            placeholder={`Up to ${remainingDue}`}
            disabled={isSubmitting}
          />
          {shownError("amount") && <span className="field-error">{shownError("amount")}</span>}
        </div>
        <div>
          <label className="field-label">Payment Mode</label>
          <select
            className="select-input"
            value={mode}
            onChange={(e) => setMode(e.target.value as PaymentMode)}
            disabled={isSubmitting}
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
        <button type="button" className="secondary-button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? "Recording…" : "Record Payment"}
        </button>
      </div>
    </form>
  );
}
