import { StatCard } from "../shared/components/StatCard";
import { LoadingState, ErrorState } from "../shared/components/PageState";
import { useApiData } from "../shared/api/useApiData";
import { getAllStudents } from "../shared/students/studentsApi";
import { getAllStaff } from "../modules/staff/staffApi";
import { getAllAttendance } from "../modules/attendance/attendanceApi";
import { getAllFees } from "../modules/fees-basic/feesApi";

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
  const students = useApiData(getAllStudents);
  const staff = useApiData(getAllStaff);
  const attendance = useApiData(getAllAttendance);
  const fees = useApiData(getAllFees);

  const isLoading = students.isLoading || staff.isLoading || attendance.isLoading || fees.isLoading;
  const error = students.error ?? staff.error ?? attendance.error ?? fees.error;

  function reloadAll() {
    students.reload();
    staff.reload();
    attendance.reload();
    fees.reload();
  }

  if (isLoading) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Overview for today</p>
        <LoadingState label="Loading dashboard…" />
      </div>
    );
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

  const totalStudents = students.data?.length ?? 0;
  const totalStaff = staff.data?.length ?? 0;

  const todaysAttendance = (attendance.data ?? []).filter((a) => a.date === today());
  const presentToday = todaysAttendance.filter((a) => a.status === "Present").length;
  const attendancePercent =
    todaysAttendance.length > 0 ? Math.round((presentToday / todaysAttendance.length) * 100) : 0;

  const feesCollected = (fees.data ?? []).reduce((sum, fee) => sum + fee.amountPaid, 0);
  const feesDue = (fees.data ?? []).reduce((sum, fee) => sum + fee.amountDue, 0);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p className="page-subtitle">Overview for today</p>

      <div className="stat-grid">
        <StatCard label="Total Students" value={String(totalStudents)} accent="blue" />
        <StatCard label="Total Staff" value={String(totalStaff)} accent="green" />
        <StatCard label="Attendance Today" value={`${attendancePercent}%`} accent="amber" />
        <StatCard
          label="Fees Collected"
          value={`₹${feesCollected.toLocaleString("en-IN")} / ₹${feesDue.toLocaleString("en-IN")}`}
          accent="red"
        />
      </div>
    </div>
  );
}
