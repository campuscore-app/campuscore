import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { DotsIcon } from "./icons";

interface RowMenuProps {
  /** aria-label for the trigger button, e.g. "Actions for Ravi Kumar". */
  label: string;
  children: ReactNode;
}

/**
 * The three-dot row action menu used in table rows (Students, and any
 * future table that needs one). Rendered through a portal onto
 * document.body, positioned from the trigger button's own screen
 * coordinates, rather than as a plain absolutely-positioned child of the
 * row — a table row sits inside a scrollable wrapper (see
 * .table-scroll-wrapper) whose overflow:auto clips anything that would
 * render past its edge, which cut the dropdown's lower items off for rows
 * near the bottom of the visible table area.
 */
export function RowMenu({ label, children }: RowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + 4, left: rect.right - 150 });
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        !triggerRef.current?.contains(event.target as Node) &&
        !dropdownRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    // Closes on scroll rather than repositioning on every scroll event —
    // simpler, and avoids the menu visibly drifting away from its row.
    function handleScroll() {
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  return (
    <div className="row-menu">
      <button
        type="button"
        ref={triggerRef}
        className="row-menu-trigger"
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        aria-label={label}
      >
        <DotsIcon width={16} height={16} />
      </button>
      {isOpen &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            className="row-menu-dropdown row-menu-dropdown-portal"
            style={{ top: position.top, left: position.left }}
            onClick={() => setIsOpen(false)}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
