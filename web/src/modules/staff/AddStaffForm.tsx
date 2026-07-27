import { useState, type FormEvent } from "react";
import type { StaffMember } from "../../shared/types";
import { required, isPhone, notFutureDate } from "../../shared/validation/rules";
import { useFieldValidation } from "../../shared/validation/useFieldValidation";

interface AddStaffFormProps {
  /** When set, the form starts pre-filled and behaves as an edit rather than adding a new staff member. */
  initialValues?: Omit<StaffMember, "id">;
  onCancel: () => void;
  onSubmit: (staff: Omit<StaffMember, "id">) => Promise<void>;
}

interface FormErrors {
  name?: string;
  role?: string;
  department?: string;
  contact?: string;
  joinedOn?: string;
}

/**
 * Form shown inside the "Add Staff Member" modal.
 * Business rule enforced here: the joining date can't be in the future —
 * you can't record someone as having joined a date that hasn't happened.
 */
export function AddStaffForm({ initialValues, onCancel, onSubmit }: AddStaffFormProps) {
  const isEditing = initialValues !== undefined;
  const [form, setForm] = useState(
    initialValues ?? {
      name: "",
      role: "",
      department: "",
      contact: "",
      joinedOn: "",
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    const nameError = required(form.name, "Staff name");
    if (nameError) nextErrors.name = nameError;

    const roleError = required(form.role, "Role");
    if (roleError) nextErrors.role = roleError;

    const departmentError = required(form.department, "Department");
    if (departmentError) nextErrors.department = departmentError;

    const contactError = required(form.contact, "Contact number") ?? isPhone(form.contact);
    if (contactError) nextErrors.contact = contactError;

    const joinedOnError =
      required(form.joinedOn, "Joined on") ?? notFutureDate(form.joinedOn, "Joined on");
    if (joinedOnError) nextErrors.joinedOn = joinedOnError;

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
          Staff Name<span className="required-asterisk">*</span>
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
            Role<span className="required-asterisk">*</span>
          </label>
          <input
            className={shownError("role") ? "text-input text-input-error" : "text-input"}
            value={form.role}
            onChange={(e) => {
              updateField("role", e.target.value);
              clearError("role");
            }}
            onBlur={() => handleBlur("role")}
            placeholder="e.g. Teacher"
            disabled={isSubmitting}
          />
          {shownError("role") && <span className="field-error">{shownError("role")}</span>}
        </div>
        <div>
          <label className="field-label">
            Department<span className="required-asterisk">*</span>
          </label>
          <input
            className={shownError("department") ? "text-input text-input-error" : "text-input"}
            value={form.department}
            onChange={(e) => {
              updateField("department", e.target.value);
              clearError("department");
            }}
            onBlur={() => handleBlur("department")}
            disabled={isSubmitting}
          />
          {shownError("department") && <span className="field-error">{shownError("department")}</span>}
        </div>
      </div>

      <div className="form-row form-row-split">
        <div>
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
        <div>
          <label className="field-label">
            Joined On<span className="required-asterisk">*</span>
          </label>
          <input
            type="date"
            className={shownError("joinedOn") ? "text-input text-input-error" : "text-input"}
            value={form.joinedOn}
            onChange={(e) => {
              updateField("joinedOn", e.target.value);
              clearError("joinedOn");
            }}
            onBlur={() => handleBlur("joinedOn")}
            disabled={isSubmitting}
          />
          {shownError("joinedOn") && <span className="field-error">{shownError("joinedOn")}</span>}
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Add Staff Member"}
        </button>
      </div>
    </form>
  );
}
