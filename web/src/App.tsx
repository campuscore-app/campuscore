import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { ToastProvider } from "./shared/toast/ToastContext";
import { ConfirmProvider } from "./shared/confirm/ConfirmContext";

/**
 * App's top-level component. ToastProvider and ConfirmProvider wrap
 * everything so any page (Login included, since it's outside the sidebar
 * layout) can show notifications/confirmation dialogs. StudentsProvider
 * (shared enrolled-students list for Students/Attendance/Fees) is scoped
 * inside app/routes.tsx instead of here, so visiting Staff alone doesn't
 * fetch students it never uses. Underneath that, RouterProvider decides
 * which page to render based on the URL (see app/routes.tsx for the route
 * list).
 */
function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <RouterProvider router={router} />
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
