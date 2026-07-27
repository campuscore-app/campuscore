import { useState } from "react";

/**
 * Shared machinery behind every modal form's inline validation: a field's
 * error only shows once it's been visited (blurred) or a submit was
 * already attempted, clears the moment it's edited, and the caller can use
 * isFormValid to disable submit until the whole form passes. Used by every
 * Add/Edit modal (Students, Staff, Fees, Attendance) and the auth pages so
 * this logic lives in one place instead of duplicated per form.
 *
 * Constrained to `object` rather than `Record<string, string | undefined>`
 * deliberately — a plain `interface FormErrors { name?: string }` has no
 * index signature, so TypeScript won't accept it as satisfying a `Record`
 * constraint during generic inference even though every property really
 * is `string | undefined`. `object` sidesteps that without weakening
 * anything the callers below actually rely on.
 */
export function useFieldValidation<Errors extends object>(validate: () => Errors) {
  const [errors, setErrors] = useState<Errors>({} as Errors);
  const [touched, setTouched] = useState<Partial<Record<keyof Errors, boolean>>>({});

  function clearError(field: keyof Errors) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function handleBlur(field: keyof Errors) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate()[field] }));
  }

  function shownError(field: keyof Errors): Errors[keyof Errors] | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  /** Call from the submit handler: reveals every currently-failing field's
   * error (not just ones already touched) and reports whether the form as
   * a whole is valid. */
  function validateOnSubmit(): boolean {
    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(validationErrors) as (keyof Errors)[]) {
        next[key] = true;
      }
      return next;
    });
    return Object.keys(validationErrors).length === 0;
  }

  const isFormValid = Object.keys(validate()).length === 0;

  return { shownError, clearError, handleBlur, validateOnSubmit, isFormValid };
}
