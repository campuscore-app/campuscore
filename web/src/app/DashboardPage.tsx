import { useNavigate } from "react-router-dom";
import { StatCard } from "../shared/components/StatCard";
import { ErrorState } from "../shared/components/PageState";
import { useApiData } from "../shared/api/useApiData";
import { useStudents } from "../shared/students/StudentsContext";
import { getAllStaff } from "../modules/staff/staffApi";
import { getAllAttendance } from "../modules/attendance/attendanceApi";
import { getAllFees } from "../modules/fees-basic/feesApi";
import { getToken } from "../shared/auth/tokenStorage";
import { getEmailFromToken } from "../shared/auth/jwt";
import {
  StudentsIcon,
  StaffIcon,
  AttendanceIcon,
  FeesIcon,
  PlusCircleIcon,
  CheckCircleIcon,
} from "../shared/components/icons";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Dashboard — the landing page after login.
 *
 * Real ERP/admin products (and most SaaS products in general) open on a
 * summary screen rather than dropping the user straight into a list of
 * records, so staff can see the state of the school at a glance before
 * drilling into a specific module.
 *
 * Each stat is pulled from the same API the corresponding module page
 * uses, so the dashboard always reflects real, current data instead of a
 * separately-maintained summary that can drift out of sync.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  // Shared context (see app/routes.tsx) instead of its own fetch — Students
  // page and Dashboard both need the same list, so this avoids firing two
  // separate requests for it whenever Dashboard is the page you land on.
  const {
    students: studentList,
    isLoading: isStudentsLoading,
    error: studentsError,
    reload: reloadStudents,
  } = useStudents();
  const staff = useApiData(getAllStaff);
  const attendance = useApiData(getAllAttendance);
  const fees = useApiData(getAllFees);

  const isLoading = isStudentsLoading || staff.isLoading || attendance.isLoading || fees.isLoading;
  const error = studentsError ?? staff.error ?? attendance.error ?? fees.error;

  const token = getToken();
  const email = token ? getEmailFromToken(token) : null;

  function reloadAll() {
    reloadStudents();
    staff.reload();
    attendance.reload();
    fees.reload();
  }

  /** Quick Actions land on the target module's page and ask it to open its
   * "Add" modal immediately — see StudentsPage/StaffPage/AttendancePage/
   * FeesPage, which each check location.state.openAddModal on mount. */
  function goToWithAddModal(path: string) {
    navigate(path, { state: { openAddModal: true } });
  }

  if (error) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Overview for today</p>
        <ErrorState message={error} onRetry={reloadAll} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Overview for today</p>
        <div className="stat-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-stat-card" />
          ))}
        </div>
      </div>
    );
  }

  const totalStudents = studentList.length;
  const totalStaff = staff.data?.length ?? 0;
  const totalFeeRecords = fees.data?.length ?? 0;
  const totalAttendanceRecords = attendance.data?.length ?? 0;
  const hasAnyData = totalStudents > 0 || totalStaff > 0 || totalFeeRecords > 0 || totalAttendanceRecords > 0;

  const todaysAttendance = (attendance.data ?? []).filter((a) => a.date === today());
  const presentToday = todaysAttendance.filter((a) => a.status === "Present").length;
  const attendancePercent =
    todaysAttendance.length > 0 ? Math.round((presentToday / todaysAttendance.length) * 100) : 0;

  const feesCollected = (fees.data ?? []).reduce((sum, fee) => sum + fee.amountPaid, 0);
  const feesDue = (fees.data ?? []).reduce((sum, fee) => sum + fee.amountDue, 0);

  if (!hasAnyData) {
    return (
      <div className="page">
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-icon">
            <CheckCircleIcon width={28} height={28} />
          </div>
          <h1 className="dashboard-empty-title">Welcome to CampusCore</h1>
          <p className="dashboard-empty-subtext">
            Your school has no data yet. Start by adding your first student — you can add staff, mark attendance,
            and assign fees once your class is set up.
          </p>
          <button
            type="button"
            className="primary-button primary-button-inline"
            onClick={() => goToWithAddModal("/students")}
          >
            + Add First Student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {email && <p className="dashboard-welcome">Welcome back, {email}</p>}
      <h1>Dashboard</h1>
      <p className="page-subtitle">Overview for today</p>

      <div className="stat-grid">
        <StatCard
          label="Total Students"
          value={totalStudents === 0 ? "No students yet" : String(totalStudents)}
          accent="blue"
          icon={<StudentsIcon />}
          empty={totalStudents === 0}
        />
        <StatCard
          label="Total Staff"
          value={totalStaff === 0 ? "No staff yet" : String(totalStaff)}
          accent="green"
          icon={<StaffIcon />}
          empty={totalStaff === 0}
        />
        <StatCard
          label="Attendance Today"
          value={todaysAttendance.length === 0 ? "Not marked yet" : `${attendancePercent}%`}
          accent="amber"
          icon={<AttendanceIcon />}
          empty={todaysAttendance.length === 0}
        />
        <StatCard
          label="Fees Collected"
          value={
            totalFeeRecords === 0
              ? "No fee records yet"
              : `₹${feesCollected.toLocaleString("en-IN")} / ₹${feesDue.toLocaleString("en-IN")}`
          }
          accent="red"
          icon={<FeesIcon />}
          empty={totalFeeRecords === 0}
        />
      </div>

      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <button type="button" className="quick-action-button" onClick={() => goToWithAddModal("/students")}>
            <span className="quick-action-icon">
              <PlusCircleIcon width={20} height={20} />
            </span>
            Add Student
          </button>
          <button type="button" className="quick-action-button" onClick={() => goToWithAddModal("/staff")}>
            <span className="quick-action-icon">
              <PlusCircleIcon width={20} height={20} />
            </span>
            Add Staff
          </button>
          <button type="button" className="quick-action-button" onClick={() => navigate("/attendance/take")}>
            <span className="quick-action-icon">
              <AttendanceIcon width={20} height={20} />
            </span>
            Mark Attendance
          </button>
          <button type="button" className="quick-action-button" onClick={() => goToWithAddModal("/fees")}>
            <span className="quick-action-icon">
              <FeesIcon width={20} height={20} />
            </span>
            Assign Fee
          </button>
        </div>
      </div>
    </div>
  );
}
