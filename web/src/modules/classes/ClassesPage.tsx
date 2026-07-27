import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { LoadingState, ErrorState } from "../../shared/components/PageState";
import { TrashIcon } from "../../shared/components/icons";
import { useApiData } from "../../shared/api/useApiData";
import { useToast } from "../../shared/toast/ToastContext";
import { useConfirm } from "../../shared/confirm/ConfirmContext";
import { ApiError } from "../../shared/api/client";
import { useFieldValidation } from "../../shared/validation/useFieldValidation";
import { required } from "../../shared/validation/rules";
import type { SchoolClass } from "../../shared/types";
import { getAllClasses, createClass, removeClass } from "./classesApi";

interface FormErrors {
  className?: string;
  section?: string;
}

/**
 * Manage Classes & Sections — master data for the Class/Section dropdowns
 * on the Student form. Kept deliberately simple: no edit, only add/remove.
 * Renaming an existing class would leave every student already enrolled
 * under the old name pointing at a value that no longer exists in this
 * list — safer to just add the corrected entry and remove the old one
 * once nothing references it, than to silently rewrite history.
 */
export function ClassesPage() {
  const { data, setData, isLoading, error, reload } = useApiData(getAllClasses);
  const classes = data ?? [];
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    const classNameError = required(className, "Class name");
    if (classNameError) nextErrors.className = classNameError;
    const sectionError = required(section, "Section");
    if (sectionError) nextErrors.section = sectionError;
    return nextErrors;
  }

  const { shownError, clearError, handleBlur, validateOnSubmit, isFormValid } = useFieldValidation(validate);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!validateOnSubmit()) return;

    setIsSubmitting(true);
    try {
      const created = await createClass({ className: className.trim(), section: section.trim() });
      setData((current) => [...(current ?? []), created]);
      setClassName("");
      setSection("");
      showToast("success", `${created.className}-${created.section} added.`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not add this class.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(schoolClass: SchoolClass) {
    const confirmed = await confirm({
      title: "Remove Class",
      message: `Are you sure you want to remove ${schoolClass.className}-${schoolClass.section}? Students already enrolled under this class/section keep their existing records — this only affects what's offered going forward.`,
      confirmLabel: "Remove Class",
      cancelLabel: "Cancel",
    });
    if (!confirmed) return;

    try {
      await removeClass(schoolClass.id);
      setData((current) => (current ?? []).filter((c) => c.id !== schoolClass.id));
      showToast("success", `${schoolClass.className}-${schoolClass.section} removed.`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not remove this class.");
    }
  }

  const columns: Column<SchoolClass>[] = [
    { header: "Class", accessor: "className", sortable: true },
    { header: "Section", accessor: "section", sortable: true },
    {
      header: "",
      accessor: "id",
      render: (_value, row) => (
        <button
          type="button"
          className="link-button link-button-danger"
          onClick={() => handleRemove(row)}
          aria-label={`Remove ${row.className}-${row.section}`}
        >
          <TrashIcon width={14} height={14} style={{ marginRight: 4, verticalAlign: -2 }} />
          Remove
        </button>
      ),
    },
  ];

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> / <Link to="/students">Students</Link> / Classes
      </p>

      <div className="page-header">
        <div>
          <h1>Classes &amp; Sections</h1>
          <p className="page-subtitle">
            The class/section options students are enrolled into — kept as one master list so they can't drift
            inconsistent (e.g. "10-A" vs "10 A") across the register.
          </p>
        </div>
      </div>

      <div className="dashboard-panel" style={{ marginBottom: 24 }}>
        <form onSubmit={handleAdd} className="form-row-split" style={{ alignItems: "flex-start" }}>
          <div>
            <label className="field-label">
              Class Name<span className="required-asterisk">*</span>
            </label>
            <input
              className={shownError("className") ? "text-input text-input-error" : "text-input"}
              value={className}
              placeholder="e.g. 10"
              onChange={(e) => {
                setClassName(e.target.value);
                clearError("className");
              }}
              onBlur={() => handleBlur("className")}
              disabled={isSubmitting}
            />
            {shownError("className") && <span className="field-error">{shownError("className")}</span>}
          </div>
          <div>
            <label className="field-label">
              Section<span className="required-asterisk">*</span>
            </label>
            <input
              className={shownError("section") ? "text-input text-input-error" : "text-input"}
              value={section}
              placeholder="e.g. A"
              onChange={(e) => {
                setSection(e.target.value);
                clearError("section");
              }}
              onBlur={() => handleBlur("section")}
              disabled={isSubmitting}
            />
            {shownError("section") && <span className="field-error">{shownError("section")}</span>}
          </div>
          <div style={{ paddingTop: 26 }}>
            <button type="submit" className="primary-button primary-button-inline" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? "Adding…" : "+ Add Class"}
            </button>
          </div>
        </form>
      </div>

      {isLoading && <LoadingState label="Loading classes…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}

      {!isLoading && !error && classes.length === 0 && (
        <div className="table-empty-state">
          <div className="table-empty-state-title">No classes added yet</div>
          <p className="table-empty-state-subtext">
            Add your first class and section above — students can then be enrolled into it.
          </p>
        </div>
      )}

      {!isLoading && !error && classes.length > 0 && (
        <DataTable columns={columns} rows={classes} keyField="id" />
      )}
    </div>
  );
}
