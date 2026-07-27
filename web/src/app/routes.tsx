import { createBrowserRouter, Outlet } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { DashboardPage } from "./DashboardPage";
import { RequireAuth } from "./RequireAuth";
import { StudentsPage } from "../modules/students/StudentsPage";
import { ClassesPage } from "../modules/classes/ClassesPage";
import { StaffPage } from "../modules/staff/StaffPage";
import { AttendancePage } from "../modules/attendance/AttendancePage";
import { TakeAttendancePage } from "../modules/attendance/TakeAttendancePage";
import { FeesPage } from "../modules/fees-basic/FeesPage";
import { LoginPage } from "../modules/auth/LoginPage";
import { SetupPage } from "../modules/auth/SetupPage";
import { StudentsProvider } from "../shared/students/StudentsContext";

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
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            // Only Dashboard/Students/Attendance/Fees actually read the
            // shared enrolled-students list — mounting the provider (and
            // firing its fetch) here instead of at the app root means
            // visiting Staff alone never triggers a Students API call.
            element: (
              <StudentsProvider>
                <Outlet />
              </StudentsProvider>
            ),
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "students", element: <StudentsPage /> },
              { path: "students/classes", element: <ClassesPage /> },
              { path: "attendance", element: <AttendancePage /> },
              { path: "attendance/take", element: <TakeAttendancePage /> },
              { path: "fees", element: <FeesPage /> },
            ],
          },
          { path: "staff", element: <StaffPage /> },
        ],
      },
    ],
  },
]);
