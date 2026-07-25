import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ToastVariant = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  /** Call this from anywhere to show a message — replaces window.alert(). */
  showToast: (variant: ToastVariant, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 1;

/**
 * Renders a stack of dismissible notification banners in the corner of the
 * screen, instead of using the browser's built-in alert() popup (which is
 * ugly, blocks the whole page, and can't be styled).
 *
 * Wrap the whole app in this once (see App.tsx); any page can then call
 * useToast() to show a message.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function dismiss(id: number) {
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  const showToast = useCallback((variant: ToastVariant, message: string) => {
    const id = nextToastId++;
    setToasts((current) => [...current, { id, variant, message }]);
    // Auto-dismiss after 4 seconds so notifications don't pile up.
    setTimeout(() => dismiss(id), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.variant}`}
            role="status"
            onClick={() => dismiss(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Gives any component a showToast(variant, message) function. */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a <ToastProvider>");
  }
  return context;
}
