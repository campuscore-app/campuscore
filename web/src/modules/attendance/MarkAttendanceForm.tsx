import { useState, type FormEvent } from "react";
import type { AttendanceRecord } from "../../shared/types";
import { required, notFutureDate } from "../../shared/validation/rules";

interface MarkAttendanceFormProps {
  /** Existing (studentName, date) pairs (excluding this record's own, when editing), so we can block duplicate entries. */
  existingEntries: { studentName: string; date: string }[];
  /** When set, the form starts pre-filled and behaves as an edit rather than marking a new entry. */
  initialValues?: Omit<AttendanceRecord, "id">;
  onCancel: () => void;
  onSubmit: (record: Omit<AttendanceRecord, "id">) => void;
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
  const [errors, setErrors] = useState<FormErrors>({});

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

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(form);
  }

  return (
    <form className="modal-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label className="field-label">Student Name</label>
        <input
          className={errors.studentName ? "text-input text-input-error" : "text-input"}
          value={form.studentName}
          onChange={(e) => updateField("studentName", e.target.value)}
        />
        {errors.studentName && <span className="field-error">{errors.studentName}</span>}
      </div>

      <div className="form-row form-row-split">
        <div>
          <label className="field-label">Class</label>
          <input
            className={errors.className ? "text-input text-input-error" : "text-input"}
            value={form.className}
            onChange={(e) => updateField("className", e.target.value)}
            placeholder="e.g. 10-A"
          />
          {errors.className && <span className="field-error">{errors.className}</span>}
        </div>
        <div>
          <label className="field-label">Status</label>
          <select
            className="select-input"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value as AttendanceRecord["status"])}
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
        <label className="field-label">Date</label>
        <input
          type="date"
          className={errors.date ? "text-input text-input-error" : "text-input"}
          value={form.date}
          onChange={(e) => updateField("date", e.target.value)}
        />
        {errors.date && <span className="field-error">{errors.date}</span>}
      </div>

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button">
          {isEditing ? "Save Changes" : "Mark Attendance"}
        </button>
      </div>
    </form>
  );
}
