import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { DashboardPage } from "./DashboardPage";
import { StudentsPage } from "../modules/students/StudentsPage";
import { StaffPage } from "../modules/staff/StaffPage";
import { AttendancePage } from "../modules/attendance/AttendancePage";
import { FeesPage } from "../modules/fees-basic/FeesPage";
import { LoginPage } from "../modules/auth/LoginPage";
import { SetupPage } from "../modules/auth/SetupPage";

/**
 * All the app's routes in one place.
 *
 * "/login" and "/setup" stand alone (no sidebar — you're not logged in
 * yet). Everything else is nested inside Layout, so those pages all share
 * the same sidebar/topbar automatically (see Layout.tsx's <Outlet />).
 *
 * This is also the place premium modules will plug into later: a premium
 * route (e.g. "/transport") just gets added as another child here, guarded
 * by whether that module's license is active.
 */
export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/setup",
    element: <SetupPage />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "students", element: <StudentsPage /> },
      { path: "staff", element: <StaffPage /> },
      { path: "attendance", element: <AttendancePage /> },
      { path: "fees", element: <FeesPage /> },
    ],
  },
]);
