import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Student } from "../../shared/types";
import { required, isPhone } from "../../shared/validation/rules";
import { useFieldValidation } from "../../shared/validation/useFieldValidation";
import { useApiData } from "../../shared/api/useApiData";
import { getAllClasses } from "../classes/classesApi";

interface AddStudentFormProps {
  /** Roll numbers already in use (excluding this student's own, when editing), so we can enforce the "must be unique" business rule. */
  existingRollNumbers: string[];
  /** When set, the form starts pre-filled with these values and behaves as an edit rather than a new enrollment. */
  initialValues?: Omit<Student, "id">;
  onCancel: () => void;
  onSubmit: (student: Omit<Student, "id">) => Promise<void>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: classesData } = useApiData(getAllClasses);
  // Memoized so it's the same reference across renders whenever `classesData`
  // itself hasn't changed — otherwise `?? []` hands out a new empty array
  // every render while loading, invalidating the useMemo calls below for
  // no reason.
  const classes = useMemo(() => classesData ?? [], [classesData]);

  // Includes the form's current value even if it's no longer in the master
  // list — otherwise editing a student enrolled under a class that was
  // since removed would silently blank out their real, existing data.
  const classNameOptions = useMemo(() => {
    const names = Array.from(new Set(classes.map((c) => c.className)));
    if (form.className && !names.includes(form.className)) names.push(form.className);
    return names.sort();
  }, [classes, form.className]);

  const sectionOptions = useMemo(() => {
    const sections = Array.from(
      new Set(classes.filter((c) => c.className === form.className).map((c) => c.section)),
    );
    if (form.section && !sections.includes(form.section)) sections.push(form.section);
    return sections.sort();
  }, [classes, form.className, form.section]);

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

  const { shownError, clearError, handleBlur, validateOnSubmit, isFormValid } = useFieldValidation(validate);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateOnSubmit()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      // If onSubmit succeeded, the parent closes this modal anyway — this
      // only matters for the failure path, where the form stays open and
      // needs to be interactive again.
      setIsSubmitting(false);
    }
  }

  return (
    <form className="modal-form" onSubmit={handleSubmit} noValidate>
      <div className="form-section-title">Student Information</div>

      <div className="form-row">
        <label className="field-label">
          Student Name<span className="required-asterisk">*</span>
        </label>
        <input
          className={shownError("name") ? "text-input text-input-error" : "text-input"}
          value={form.name}
          onChange={(e) => {
            updateField("name", e.target.value);
            clearError("name");
          }}
          onBlur={() => handleBlur("name")}
          disabled={isSubmitting}
        />
        {shownError("name") && <span className="field-error">{shownError("name")}</span>}
      </div>

      <div className="form-row form-row-split">
        <div>
          <label className="field-label">
            Class<span className="required-asterisk">*</span>
          </label>
          <select
            className={shownError("className") ? "select-input text-input-error" : "select-input"}
            value={form.className}
            onChange={(e) => {
              updateField("className", e.target.value);
              // Sections are scoped to a class — a section chosen for the
              // previous class may not exist for the newly picked one.
              updateField("section", "");
              clearError("className");
            }}
            onBlur={() => handleBlur("className")}
            disabled={isSubmitting}
          >
            <option value="">Select a class…</option>
            {classNameOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {shownError("className") && <span className="field-error">{shownError("className")}</span>}
          {classNameOptions.length === 0 && (
            <span className="field-error">
              No classes set up yet —{" "}
              <Link to="/students/classes" target="_blank" rel="noopener">
                add one first
              </Link>
              .
            </span>
          )}
        </div>
        <div>
          <label className="field-label">
            Section<span className="required-asterisk">*</span>
          </label>
          <select
            className={shownError("section") ? "select-input text-input-error" : "select-input"}
            value={form.section}
            onChange={(e) => {
              updateField("section", e.target.value);
              clearError("section");
            }}
            onBlur={() => handleBlur("section")}
            disabled={isSubmitting || !form.className}
          >
            <option value="">Select a section…</option>
            {sectionOptions.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
          {shownError("section") && <span className="field-error">{shownError("section")}</span>}
        </div>
      </div>

      <div className="form-row">
        <label className="field-label">
          Roll Number<span className="required-asterisk">*</span>
        </label>
        <input
          className={shownError("rollNo") ? "text-input text-input-error" : "text-input"}
          value={form.rollNo}
          onChange={(e) => {
            updateField("rollNo", e.target.value);
            clearError("rollNo");
          }}
          onBlur={() => handleBlur("rollNo")}
          placeholder="e.g. 10-A-03"
          disabled={isSubmitting}
        />
        {shownError("rollNo") && <span className="field-error">{shownError("rollNo")}</span>}
      </div>

      <div className="form-section-title">Guardian Information</div>

      <div className="form-row">
        <label className="field-label">
          Guardian Name<span className="required-asterisk">*</span>
        </label>
        <input
          className={shownError("guardianName") ? "text-input text-input-error" : "text-input"}
          value={form.guardianName}
          onChange={(e) => {
            updateField("guardianName", e.target.value);
            clearError("guardianName");
          }}
          onBlur={() => handleBlur("guardianName")}
          disabled={isSubmitting}
        />
        {shownError("guardianName") && <span className="field-error">{shownError("guardianName")}</span>}
      </div>

      <div className="form-row">
        <label className="field-label">
          Contact Number<span className="required-asterisk">*</span>
        </label>
        <input
          className={shownError("contact") ? "text-input text-input-error" : "text-input"}
          value={form.contact}
          onChange={(e) => {
            updateField("contact", e.target.value);
            clearError("contact");
          }}
          onBlur={() => handleBlur("contact")}
          placeholder="10-digit mobile number"
          disabled={isSubmitting}
        />
        {shownError("contact") && <span className="field-error">{shownError("contact")}</span>}
      </div>

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Enroll Student"}
        </button>
      </div>
    </form>
  );
}
