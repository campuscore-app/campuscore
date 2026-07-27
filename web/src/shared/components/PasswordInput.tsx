import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * A password <input> with a show/hide toggle — used on every password
 * field (Login, Setup's password + confirm password) so the toggle
 * behavior and icon only live in one place. Renders a real inline SVG
 * eye icon rather than an emoji: emoji glyphs render inconsistently
 * across platforms/fonts (some render as a small colorful cartoon eye)
 * and read as less deliberate next to the rest of the UI's flat icons.
 */
export function PasswordInput({ className, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field-wrapper">
      <input {...inputProps} type={visible ? "text" : "password"} className={className} />
      <button
        type="button"
        className="password-toggle-button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24" />
            <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.14 13.14 0 0 0 2 11s3.5 7 10 7a10.94 10.94 0 0 0 4.19-.83" />
          </svg>
        )}
      </button>
    </div>
  );
}
