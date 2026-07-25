import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** "wide" for content like a class roster table that doesn't fit the default 420px form width. */
  size?: "default" | "wide";
}

/**
 * Generic popup dialog shell used for forms (e.g. "Enroll New Student").
 * Clicking the dark backdrop or the × closes it; clicking inside the card
 * does not (stopPropagation), so an accidental click on the form itself
 * doesn't dismiss it.
 */
export function Modal({ title, onClose, children, size = "default" }: ModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={size === "wide" ? "modal-card modal-card-wide" : "modal-card"}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {/* Only this part scrolls on short screens — the title/close button
            above always stay visible so the dialog never loses its context. */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
