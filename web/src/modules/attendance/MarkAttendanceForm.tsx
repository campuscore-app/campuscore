import { useState, type FormEvent } from "react";
import type { AttendanceRecord } from "../../shared/types";
import { required, notFutureDate } from "../../shared/validation/rules";
import { useFieldValidation } from "../../shared/validation/useFieldValidation";

interface MarkAttendanceFormProps {
  /** Existing (studentName, date) pairs (excluding this record's own, when editing), so we can block duplicate entries. */
  existingEntries: { studentName: string; date: string }[];
  /** When set, the form starts pre-filled and behaves as an edit rather than marking a new entry. */
  initialValues?: Omit<AttendanceRecord, "id">;
  onCancel: () => void;
  onSubmit: (record: Omit<AttendanceRecord, "id">) => Promise<void>;
}

interface FormErrors {
  studentName?: string;
  className?: string;
  date?: string;
}

const STATUS_OPTIONS: AttendanceRecord["status"][] = ["Present", "Absent", "Late"];

/**
 * Form shown inside the "Mark Attendance" modal.
 * Two business rules enforced:
 *  - the date can't be in the future (you can't take attendance for a day
 *    that hasn't happened yet)
 *  - a student can't be marked twice for the same date (one attendance
 *    record per student per day)
 */
export function MarkAttendanceForm({
  existingEntries,
  initialValues,
  onCancel,
  onSubmit,
}: MarkAttendanceFormProps) {
  const isEditing = initialValues !== undefined;
  const [form, setForm] = useState<{
    studentName: string;
    className: string;
    date: string;
    status: AttendanceRecord["status"];
  }>(
    initialValues ?? {
      studentName: "",
      className: "",
      date: new Date().toISOString().slice(0, 10),
      status: "Present",
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    const nameError = required(form.studentName, "Student name");
    if (nameError) nextErrors.studentName = nameError;

    const classError = required(form.className, "Class");
    if (classError) nextErrors.className = classError;

    const dateError = required(form.date, "Date") ?? notFutureDate(form.date, "Date");
    if (dateError) {
      nextErrors.date = dateError;
    } else if (
      existingEntries.some(
        (entry) => entry.studentName === form.studentName.trim() && entry.date === form.date,
      )
    ) {
      nextErrors.date = "Attendance for this student has already been marked for this date.";
    }

    return nextErrors;
  }

  const { shownError, clearError, handleBlur, validateOnSubmit, isFormValid } = useFieldValidation(validate);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateOnSubmit()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="modal-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label className="field-label">
          Student Name<span className="required-asterisk">*</span>
        </label>
        <input
          className={shownError("studentName") ? "text-input text-input-error" : "text-input"}
          value={form.studentName}
          onChange={(e) => {
            updateField("studentName", e.target.value);
            clearError("studentName");
          }}
          onBlur={() => handleBlur("studentName")}
          disabled={isSubmitting}
        />
        {shownError("studentName") && <span className="field-error">{shownError("studentName")}</span>}
      </div>

      <div className="form-row form-row-split">
        <div>
          <label className="field-label">
            Class<span className="required-asterisk">*</span>
          </label>
          <input
            className={shownError("className") ? "text-input text-input-error" : "text-input"}
            value={form.className}
            onChange={(e) => {
              updateField("className", e.target.value);
              clearError("className");
            }}
            onBlur={() => handleBlur("className")}
            placeholder="e.g. 10-A"
            disabled={isSubmitting}
          />
          {shownError("className") && <span className="field-error">{shownError("className")}</span>}
        </div>
        <div>
          <label className="field-label">Status</label>
          <select
            className="select-input"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value as AttendanceRecord["status"])}
            disabled={isSubmitting}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <label className="field-label">
          Date<span className="required-asterisk">*</span>
        </label>
        <input
          type="date"
          className={shownError("date") ? "text-input text-input-error" : "text-input"}
          value={form.date}
          onChange={(e) => {
            updateField("date", e.target.value);
            clearError("date");
          }}
          onBlur={() => handleBlur("date")}
          disabled={isSubmitting}
        />
        {shownError("date") && <span className="field-error">{shownError("date")}</span>}
      </div>

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Mark Attendance"}
        </button>
      </div>
    </form>
  );
}
