import { useMemo, useState } from "react";
import type { AttendanceRecord, Student } from "../../shared/types";
import { required, notFutureDate } from "../../shared/validation/rules";

interface TakeAttendanceViewProps {
  students: Student[];
  onCancel: () => void;
  onSave: (
    date: string,
    entries: { studentName: string; className: string; status: AttendanceRecord["status"] }[],
  ) => void;
}

const STATUS_OPTIONS: AttendanceRecord["status"][] = ["Present", "Absent", "Late"];

/**
 * Bulk attendance-marking screen: pick a class + date once, then mark
 * every enrolled student in that class in a single save — instead of the
 * one-student-per-modal flow, which isn't realistic for a teacher marking
 * a full class of 30+ students every day.
 *
 * Business rule: the date can't be in the future (same rule as single-entry
 * marking). AttendancePage is responsible for the same-day-edit-lock rule
 * when this is used to re-take attendance for a date that was already
 * marked — this view only builds the roster and hands off the raw entries.
 */
export function TakeAttendanceView({ students, onCancel, onSave }: TakeAttendanceViewProps) {
  const classOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.className))).sort(),
    [students],
  );

  const [selectedClass, setSelectedClass] = useState(classOptions[0] ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateError, setDateError] = useState<string | undefined>();
  const [statusByStudentId, setStatusByStudentId] = useState<Record<number, AttendanceRecord["status"]>>(
    {},
  );

  const roster = useMemo(
    () => students.filter((s) => s.className === selectedClass),
    [students, selectedClass],
  );

  function statusFor(studentId: number): AttendanceRecord["status"] {
    return statusByStudentId[studentId] ?? "Present";
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

  function handleSave() {
    const validationError = required(date, "Date") ?? notFutureDate(date, "Date");
    setDateError(validationError);
    if (validationError) return;

    const entries = roster.map((s) => ({
      studentName: s.name,
      className: s.className,
      status: statusFor(s.id),
    }));
    onSave(date, entries);
  }

  return (
    <div className="modal-form">
      <div className="form-row form-row-split">
        <div>
          <label className="field-label">Class</label>
          <select
            className="select-input"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Date</label>
          <input
            type="date"
            className={dateError ? "text-input text-input-error" : "text-input"}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {dateError && <span className="field-error">{dateError}</span>}
        </div>
      </div>

      <div className="roster-toolbar">
        <span className="payment-summary">{roster.length} students in {selectedClass || "this class"}</span>
        <button type="button" className="link-button" onClick={markAllPresent}>
          Mark all Present
        </button>
      </div>

      {roster.length === 0 ? (
        <p className="payment-summary">No students are enrolled in this class yet.</p>
      ) : (
        <div className="history-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>
                    <div className="status-toggle-group">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={
                            statusFor(student.id) === option
                              ? `status-toggle status-toggle-active status-toggle-${option.toLowerCase()}`
                              : "status-toggle"
                          }
                          onClick={() => setStatus(student.id, option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="primary-button" onClick={handleSave} disabled={roster.length === 0}>
          Save Attendance
        </button>
      </div>
    </div>
  );
}
