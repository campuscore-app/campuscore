import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  title: string;
  /** Short line of context under the title (e.g. "Add a new staff member to your institution"). */
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** "wide" for content like a class roster table that doesn't fit the default form width. */
  size?: "default" | "wide";
}

/**
 * Generic popup dialog shell used for forms (e.g. "Enroll New Student").
 * Clicking the dark backdrop or the × closes it; clicking inside the card
 * does not (stopPropagation), so an accidental click on the form itself
 * doesn't dismiss it.
 */
export function Modal({ title, subtitle, onClose, children, size = "default" }: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Runs once per mount, not on every onClose identity change — otherwise
  // a parent re-render (e.g. background data refreshing while the modal
  // is open) would steal focus back to the first field mid-keystroke.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const firstField = cardRef.current?.querySelector<HTMLElement>(
      "input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
    );
    firstField?.focus();

    // Returning focus to whatever opened the modal (usually the trigger
    // button) means keyboard users don't lose their place in the page
    // once the dialog closes.
    return () => previouslyFocused?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={cardRef}
        className={size === "wide" ? "modal-card modal-card-wide" : "modal-card"}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {/* Only this part scrolls on short screens — the title/close button
            above and the action buttons below always stay visible so the
            dialog never loses its context. */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
