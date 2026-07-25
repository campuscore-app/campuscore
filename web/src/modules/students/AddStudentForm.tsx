import { useState, type FormEvent } from "react";
import type { Student } from "../../shared/types";
import { required, isPhone } from "../../shared/validation/rules";

interface AddStudentFormProps {
  /** Roll numbers already in use (excluding this student's own, when editing), so we can enforce the "must be unique" business rule. */
  existingRollNumbers: string[];
  /** When set, the form starts pre-filled with these values and behaves as an edit rather than a new enrollment. */
  initialValues?: Omit<Student, "id">;
  onCancel: () => void;
  onSubmit: (student: Omit<Student, "id">) => void;
}

interface FormErrors {
  name?: string;
  rollNo?: string;
  className?: string;
  section?: string;
  guardianName?: string;
  contact?: string;
}

/**
 * Form shown inside the "Enroll New Student" modal.
 *
 * Every field is checked against a business rule before the record is
 * accepted:
 *   - name, class, section, guardian name, contact are all required
 *   - roll number must be unique within the school (no two students can
 *     share one — this is the kind of rule a real school office enforces
 *     manually, so the software should enforce it too)
 *   - contact number must be a valid 10-digit number
 */
export function AddStudentForm({
  existingRollNumbers,
  initialValues,
  onCancel,
  onSubmit,
}: AddStudentFormProps) {
  const isEditing = initialValues !== undefined;
  const [form, setForm] = useState(
    initialValues ?? {
      name: "",
      rollNo: "",
      className: "",
      section: "",
      guardianName: "",
      contact: "",
    },
  );
  const [errors, setErrors] = useState<FormErrors>({});

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  /** Runs every field's validation and returns only the ones that failed. */
  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    const nameError = required(form.name, "Student name");
    if (nameError) nextErrors.name = nameError;

    const classError = required(form.className, "Class");
    if (classError) nextErrors.className = classError;

    const sectionError = required(form.section, "Section");
    if (sectionError) nextErrors.section = sectionError;

    const guardianError = required(form.guardianName, "Guardian name");
    if (guardianError) nextErrors.guardianName = guardianError;

    const contactError = required(form.contact, "Contact number") ?? isPhone(form.contact);
    if (contactError) nextErrors.contact = contactError;

    const rollNoError = required(form.rollNo, "Roll number");
    if (rollNoError) {
      nextErrors.rollNo = rollNoError;
    } else if (existingRollNumbers.includes(form.rollNo.trim())) {
      nextErrors.rollNo = "This roll number is already assigned to another student.";
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
          className={errors.name ? "text-input text-input-error" : "text-input"}
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-row form-row-split">
        <div>
          <label className="field-label">Class</label>
          <input
            className={errors.className ? "text-input text-input-error" : "text-input"}
            value={form.className}
            onChange={(e) => updateField("className", e.target.value)}
          />
          {errors.className && <span className="field-error">{errors.className}</span>}
        </div>
        <div>
          <label className="field-label">Section</label>
          <input
            className={errors.section ? "text-input text-input-error" : "text-input"}
            value={form.section}
            onChange={(e) => updateField("section", e.target.value)}
          />
          {errors.section && <span className="field-error">{errors.section}</span>}
        </div>
      </div>

      <div className="form-row">
        <label className="field-label">Roll Number</label>
        <input
          className={errors.rollNo ? "text-input text-input-error" : "text-input"}
          value={form.rollNo}
          onChange={(e) => updateField("rollNo", e.target.value)}
          placeholder="e.g. 10-A-03"
        />
        {errors.rollNo && <span className="field-error">{errors.rollNo}</span>}
      </div>

      <div className="form-row">
        <label className="field-label">Guardian Name</label>
        <input
          className={errors.guardianName ? "text-input text-input-error" : "text-input"}
          value={form.guardianName}
          onChange={(e) => updateField("guardianName", e.target.value)}
        />
        {errors.guardianName && <span className="field-error">{errors.guardianName}</span>}
      </div>

      <div className="form-row">
        <label className="field-label">Contact Number</label>
        <input
          className={errors.contact ? "text-input text-input-error" : "text-input"}
          value={form.contact}
          onChange={(e) => updateField("contact", e.target.value)}
          placeholder="10-digit mobile number"
        />
        {errors.contact && <span className="field-error">{errors.contact}</span>}
      </div>

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button">
          {isEditing ? "Save Changes" : "Enroll Student"}
        </button>
      </div>
    </form>
  );
}
