import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

interface ConfirmContextValue {
  /**
   * Shows a styled confirmation dialog and resolves to true/false based on
   * what the user clicked. Replaces window.confirm(), which can't be
   * styled and looks like an OS error box.
   *
   * Usage: const confirmed = await confirm({ title, message });
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    // Wrapping in a Promise lets calling code do
    // "const confirmed = await confirm(...)" instead of passing callbacks.
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function respond(confirmed: boolean) {
    pending?.resolve(confirmed);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div className="modal-backdrop">
          <div className="modal-card confirm-card">
            <h2>{pending.title}</h2>
            <p className="confirm-message">{pending.message}</p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => respond(false)}>
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button className="danger-button" onClick={() => respond(true)}>
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

/** Gives any component a confirm({ title, message }) function that returns a Promise<boolean>. */
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used inside a <ConfirmProvider>");
  }
  return context.confirm;
}
