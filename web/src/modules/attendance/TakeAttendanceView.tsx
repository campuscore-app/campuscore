import { useMemo, useState } from "react";
import type { AttendanceRecord, Student } from "../../shared/types";
import { required, notFutureDate } from "../../shared/validation/rules";
import { useFieldValidation } from "../../shared/validation/useFieldValidation";
import { useConfirm } from "../../shared/confirm/ConfirmContext";

interface TakeAttendanceViewProps {
  students: Student[];
  onCancel: () => void;
  onSave: (
    date: string,
    entries: { studentName: string; className: string; status: AttendanceRecord["status"] }[],
  ) => Promise<void>;
}

const STATUS_OPTIONS: AttendanceRecord["status"][] = ["Present", "Absent", "Late"];

interface FormErrors {
  date?: string;
}

/** One combined "10-A" option — a class on its own isn't specific enough
 * to take attendance against: two sections of the same class are two
 * different rosters, not one. */
interface ClassSectionOption {
  key: string;
  className: string;
  section: string;
}

/**
 * Bulk attendance-marking screen: pick a class + section + date once, then
 * mark every enrolled student in that section in a single save — instead
 * of the one-student-per-modal flow, which isn't realistic for a teacher
 * marking a full class of 30-60 students every day.
 *
 * A student is only ever counted as Present/Absent/Late once the teacher
 * has actually clicked one of those buttons for them — left untouched,
 * they show as "Not marked" rather than silently defaulting to Present,
 * so the teacher gets an explicit warning (not a silent guess) if they try
 * to save with students still unreviewed.
 *
 * Business rule: the date can't be in the future (same rule as single-entry
 * marking). AttendancePage is responsible for the same-day-edit-lock rule
 * when this is used to re-take attendance for a date that was already
 * marked — this view only builds the roster and hands off the raw entries.
 */
export function TakeAttendanceView({ students, onCancel, onSave }: TakeAttendanceViewProps) {
  const confirm = useConfirm();

  const classSectionOptions = useMemo<ClassSectionOption[]>(() => {
    const seen = new Map<string, ClassSectionOption>();
    students.forEach((s) => {
      const key = `${s.className}-${s.section}`;
      if (!seen.has(key)) seen.set(key, { key, className: s.className, section: s.section });
    });
    return Array.from(seen.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [students]);

  const [selectedKey, setSelectedKey] = useState(classSectionOptions[0]?.key ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  // undefined = not yet reviewed by the teacher — deliberately distinct
  // from "Present", so an untouched row can be shown (and warned about)
  // differently from one the teacher actually confirmed as Present.
  const [statusByStudentId, setStatusByStudentId] = useState<Record<number, AttendanceRecord["status"] | undefined>>(
    {},
  );
  const [rosterSearch, setRosterSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roster = useMemo(() => {
    const selected = classSectionOptions.find((o) => o.key === selectedKey);
    if (!selected) return [];
    return students.filter((s) => s.className === selected.className && s.section === selected.section);
  }, [students, classSectionOptions, selectedKey]);

  // Search only narrows what's *shown* — Save always covers the full
  // roster, so a student scrolled out of view by a search never gets
  // silently dropped from the attendance being taken.
  const visibleRoster = useMemo(() => {
    const query = rosterSearch.trim().toLowerCase();
    return query ? roster.filter((s) => s.name.toLowerCase().includes(query)) : roster;
  }, [roster, rosterSearch]);

  const tally = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, unmarked: 0 };
    roster.forEach((s) => {
      const status = statusByStudentId[s.id];
      if (!status) counts.unmarked++;
      else counts[status]++;
    });
    return counts;
  }, [roster, statusByStudentId]);

  function validate(): FormErrors {
    const dateError = required(date, "Date") ?? notFutureDate(date, "Date");
    return dateError ? { date: dateError } : {};
  }

  const { shownError, clearError, handleBlur, validateOnSubmit } = useFieldValidation(validate);

  function statusFor(studentId: number): AttendanceRecord["status"] | undefined {
    return statusByStudentId[studentId];
  }

  function setStatus(studentId: number, status: AttendanceRecord["status"]) {
    setStatusByStudentId((current) => ({ ...current, [studentId]: status }));
  }

  function markAllPresent() {
    const next: Record<number, AttendanceRecord["status"]> = {};
    roster.forEach((s) => {
      next[s.id] = "Present";
    });
    setStatusByStudentId(next);
  }

  function markSelected(status: AttendanceRecord["status"]) {
    setStatusByStudentId((current) => {
      const next = { ...current };
      selectedIds.forEach((id) => {
        next[id] = status;
      });
      return next;
    });
    setSelectedIds(new Set());
  }

  function toggleSelected(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    const visibleIds = visibleRoster.map((s) => s.id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((current) => {
      const next = new Set(current);
      visibleIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  const allVisibleSelected = visibleRoster.length > 0 && visibleRoster.every((s) => selectedIds.has(s.id));

  async function handleSave() {
    if (!validateOnSubmit()) return;

    if (tally.unmarked > 0) {
      const confirmed = await confirm({
        title: "Unmarked Students",
        message: `${tally.unmarked} student${tally.unmarked === 1 ? " hasn't" : "s haven't"} been marked yet and will be recorded as Present. Continue?`,
        confirmLabel: "Save Anyway",
        cancelLabel: "Go Back",
      });
      if (!confirmed) return;
    }

    const entries = roster.map((s) => ({
      studentName: s.name,
      className: s.className,
      status: statusFor(s.id) ?? "Present",
    }));

    setIsSubmitting(true);
    try {
      await onSave(date, entries);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="form-row form-row-split">
        <div>
          <label className="field-label">Class</label>
          <select
            className="select-input"
            value={selectedKey}
            onChange={(e) => {
              setSelectedKey(e.target.value);
              setSelectedIds(new Set());
            }}
            disabled={isSubmitting}
          >
            {classSectionOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.key}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">
            Date<span className="required-asterisk">*</span>
          </label>
          <input
            type="date"
            className={shownError("date") ? "text-input text-input-error" : "text-input"}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              clearError("date");
            }}
            onBlur={() => handleBlur("date")}
            disabled={isSubmitting}
          />
          {shownError("date") && <span className="field-error">{shownError("date")}</span>}
        </div>
      </div>

      <div className="roster-toolbar">
        <input
          type="text"
          className="text-input roster-toolbar-search"
          placeholder="Search this roster by name…"
          value={rosterSearch}
          onChange={(e) => setRosterSearch(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="attendance-tally">
          <span>{roster.length} students</span>
          <span className="attendance-tally-chip attendance-tally-chip-present">{tally.Present} Present</span>
          <span className="attendance-tally-chip attendance-tally-chip-absent">{tally.Absent} Absent</span>
          <span className="attendance-tally-chip attendance-tally-chip-late">{tally.Late} Late</span>
          {tally.unmarked > 0 && (
            <span className="attendance-tally-chip attendance-tally-chip-unmarked">{tally.unmarked} Not Marked</span>
          )}
        </div>
        <button type="button" className="link-button" onClick={markAllPresent} disabled={isSubmitting}>
          Mark all Present
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedIds.size} selected</span>
          <div className="bulk-actions-bar-buttons">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                className="link-button"
                onClick={() => markSelected(status)}
                disabled={isSubmitting}
              >
                Mark {status}
              </button>
            ))}
          </div>
        </div>
      )}

      {roster.length === 0 ? (
        <p className="payment-summary">No students are enrolled in this class yet.</p>
      ) : (
        <div className="attendance-roster-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="select-checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all visible students"
                  />
                </th>
                <th>Student</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRoster.map((student) => {
                const currentStatus = statusFor(student.id);
                return (
                  <tr key={student.id} className={currentStatus ? undefined : "attendance-row-unmarked"}>
                    <td>
                      <input
                        type="checkbox"
                        className="select-checkbox"
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggleSelected(student.id)}
                        aria-label={`Select ${student.name}`}
                      />
                    </td>
                    <td>{student.name}</td>
                    <td>
                      <div className="status-toggle-group">
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            type="button"
                            key={option}
                            className={
                              currentStatus === option
                                ? `status-toggle status-toggle-active status-toggle-${option.toLowerCase()}`
                                : "status-toggle"
                            }
                            onClick={() => setStatus(student.id, option)}
                            disabled={isSubmitting}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="page-form-actions">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={handleSave}
          disabled={roster.length === 0 || isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Save Attendance"}
        </button>
      </div>
    </div>
  );
}
