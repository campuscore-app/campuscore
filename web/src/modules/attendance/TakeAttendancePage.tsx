import { Link, useNavigate } from "react-router-dom";
import { useStudents } from "../../shared/students/StudentsContext";
import { useToast } from "../../shared/toast/ToastContext";
import { ApiError } from "../../shared/api/client";
import { TakeAttendanceView } from "./TakeAttendanceView";
import { takeAttendance, type BulkAttendanceEntry } from "./attendanceApi";

/**
 * A dedicated full page rather than a modal — bulk attendance-taking has
 * search, filters, bulk-select, a live tally, and a scrolling roster of
 * 30-60 students, which is a real workspace, not a quick action. Squeezing
 * that into a modal card meant constantly fighting for vertical space; a
 * full page just gives the roster the whole viewport.
 */
export function TakeAttendancePage() {
  const navigate = useNavigate();
  const { students } = useStudents();
  const { showToast } = useToast();

  async function handleTakeAttendance(date: string, entries: BulkAttendanceEntry[]) {
    try {
      const result = await takeAttendance(date, entries);
      const lockedNote =
        result.locked > 0
          ? ` ${result.locked} already-locked past entr${result.locked === 1 ? "y" : "ies"} left unchanged.`
          : "";
      showToast(
        "success",
        `Attendance saved for ${date}: ${result.created} added, ${result.updated} updated.${lockedNote}`,
      );
      // AttendancePage refetches on mount, so navigating back there always
      // shows the just-saved records — no manual reload plumbing needed.
      navigate("/attendance");
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Could not save attendance.");
    }
  }

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> / <Link to="/attendance">Attendance</Link> / Take Attendance
      </p>

      <div className="page-header">
        <div>
          <h1>Take Attendance</h1>
          <p className="page-subtitle">Mark attendance for an entire class at once.</p>
        </div>
      </div>

      <TakeAttendanceView
        students={students}
        onCancel={() => navigate("/attendance")}
        onSave={handleTakeAttendance}
      />
    </div>
  );
}
