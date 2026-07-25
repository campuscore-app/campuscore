import { useState, type FormEvent } from "react";
import type { FeeRecord, Student } from "../../shared/types";
import { required, isPositiveNumber } from "../../shared/validation/rules";

interface AddFeeFormProps {
  /** The real enrolled students to choose from — fees can only be assigned to an actual student, never a free-typed name. */
  students: Student[];
  /** When set, the form starts pre-filled and behaves as an edit rather than assigning a new fee. */
  initialValues?: Omit<FeeRecord, "id" | "amountPaid" | "status">;
  /** Amount already paid against this record (only relevant when editing) — amount due can't be edited below this. */
  amountAlreadyPaid?: number;
  onCancel: () => void;
  onSubmit: (fee: Omit<FeeRecord, "id" | "amountPaid" | "status">) => void;
}

interface FormErrors {
  studentId?: string;
  amountDue?: string;
  dueDate?: string;
}

/**
 * Form shown inside the "Assign Fee" modal.
 *
 * The student is picked from the real enrolled-students list (a dropdown),
 * not free-typed — this is what keeps every fee record linked to an actual
 * Student instead of risking a typo creating an orphaned record that
 * doesn't match anyone. Class is derived from whichever student is
 * selected, not entered separately, so it can never disagree with the
 * student's actual class.
 *
 * Business rule enforced here: the amount due must be a positive number —
 * a fee record for ₹0 or a negative amount doesn't make sense.
 * New records always start with nothing paid yet (see FeesPage), so
 * status is always "Pending" at creation — it only changes once a
 * payment is recorded.
 */
export function AddFeeForm({
  students,
  initialValues,
  amountAlreadyPaid = 0,
  onCancel,
  onSubmit,
}: AddFeeFormProps) {
  const isEditing = initialValues !== undefined;
  const [studentId, setStudentId] = useState(
    initialValues ? String(initialValues.studentId) : "",
  );
  const [amountDue, setAmountDue] = useState(
    initialValues ? String(initialValues.amountDue) : "",
  );
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? "");
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    const studentError = required(studentId, "Student");
    if (studentError) nextErrors.studentId = studentError;

    const amountError = required(amountDue, "Amount due") ?? isPositiveNumber(amountDue, "Amount due");
    if (amountError) {
      nextErrors.amountDue = amountError;
    } else if (Number(amountDue) < amountAlreadyPaid) {
      // Business rule: can't edit the amount due below what's already been
      // paid — that would leave a payment record with no fee to match it.
      nextErrors.amountDue = `Amount due can't be less than the ₹${amountAlreadyPaid.toLocaleString("en-IN")} already paid.`;
    }

    const dueDateError = required(dueDate, "Due date");
    if (dueDateError) nextErrors.dueDate = dueDateError;

    return nextErrors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const student = students.find((s) => s.id === Number(studentId));
    if (!student) return;

    onSubmit({
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      amountDue: Number(amountDue),
      dueDate,
    });
  }

  const selectedStudent = students.find((s) => s.id === Number(studentId));

  return (
    <form className="modal-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label className="field-label">Student</label>
        <select
          className={errors.studentId ? "select-input text-input-error" : "select-input"}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">Select a student…</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} ({student.rollNo})
            </option>
          ))}
        </select>
        {errors.studentId && <span className="field-error">{errors.studentId}</span>}
      </div>

      <div className="form-row form-row-split">
        <div>
          <label className="field-label">Class</label>
          {/* Read-only — derived from the selected student, not entered
              separately, so it can never disagree with their actual class. */}
          <input className="text-input" value={selectedStudent?.className ?? ""} disabled />
        </div>
        <div>
          <label className="field-label">Amount Due (₹)</label>
          <input
            className={errors.amountDue ? "text-input text-input-error" : "text-input"}
            value={amountDue}
            onChange={(e) => setAmountDue(e.target.value)}
            placeholder="e.g. 15000"
          />
          {errors.amountDue && <span className="field-error">{errors.amountDue}</span>}
        </div>
      </div>

      <div className="form-row">
        <label className="field-label">Due Date</label>
        <input
          type="date"
          className={errors.dueDate ? "text-input text-input-error" : "text-input"}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        {errors.dueDate && <span className="field-error">{errors.dueDate}</span>}
      </div>

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button">
          {isEditing ? "Save Changes" : "Assign Fee"}
        </button>
      </div>
    </form>
  );
}
