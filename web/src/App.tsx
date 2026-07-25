import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { ToastProvider } from "./shared/toast/ToastContext";
import { ConfirmProvider } from "./shared/confirm/ConfirmContext";
import { StudentsProvider } from "./shared/students/StudentsContext";

/**
 * App's top-level component. ToastProvider and ConfirmProvider wrap
 * everything so any page (Login included, since it's outside the sidebar
 * layout) can show notifications/confirmation dialogs. StudentsProvider
 * gives every module (Students, Attendance, Fees) access to the same
 * enrolled-students list. Underneath that, RouterProvider decides which
 * page to render based on the URL (see app/routes.tsx for the route list).
 */
function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <StudentsProvider>
          <RouterProvider router={router} />
        </StudentsProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
