import { useState, type FormEvent } from "react";
import type { StaffMember } from "../../shared/types";
import { required, isPhone, notFutureDate } from "../../shared/validation/rules";

interface AddStaffFormProps {
  /** When set, the form starts pre-filled and behaves as an edit rather than adding a new staff member. */
  initialValues?: Omit<StaffMember, "id">;
  onCancel: () => void;
  onSubmit: (staff: Omit<StaffMember, "id">) => void;
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
  const [errors, setErrors] = useState<FormErrors>({});

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
        <label className="field-label">Staff Name</label>
        <input
          className={errors.name ? "text-input text-input-error" : "text-input"}
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-row form-row-split">
        <div>
          <label className="field-label">Role</label>
          <input
            className={errors.role ? "text-input text-input-error" : "text-input"}
            value={form.role}
            onChange={(e) => updateField("role", e.target.value)}
            placeholder="e.g. Teacher"
          />
          {errors.role && <span className="field-error">{errors.role}</span>}
        </div>
        <div>
          <label className="field-label">Department</label>
          <input
            className={errors.department ? "text-input text-input-error" : "text-input"}
            value={form.department}
            onChange={(e) => updateField("department", e.target.value)}
          />
          {errors.department && <span className="field-error">{errors.department}</span>}
        </div>
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

      <div className="form-row">
        <label className="field-label">Joined On</label>
        <input
          type="date"
          className={errors.joinedOn ? "text-input text-input-error" : "text-input"}
          value={form.joinedOn}
          onChange={(e) => updateField("joinedOn", e.target.value)}
        />
        {errors.joinedOn && <span className="field-error">{errors.joinedOn}</span>}
      </div>

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button">
          {isEditing ? "Save Changes" : "Add Staff Member"}
        </button>
      </div>
    </form>
  );
}
