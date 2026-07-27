import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../shared/toast/ToastContext";
import { PasswordInput } from "../../shared/components/PasswordInput";
import { BrandFact } from "../../shared/components/BrandFact";
import { required, isEmail, minLength } from "../../shared/validation/rules";
import { isSetupRequired, login } from "../../shared/auth/authApi";
import { setToken, setSchoolName } from "../../shared/auth/tokenStorage";
import { ApiError } from "../../shared/api/client";

interface FieldErrors {
  email?: string;
  password?: string;
}

/**
 * Login page — the "Auth" free/core module.
 *
 * On mount, checks whether this is a fresh install with no admin account
 * yet (see SetupPage.tsx) and redirects there instead — a school should
 * never be shown an empty login form with nothing to actually sign into.
 *
 * Otherwise, validates the form client-side first for instant feedback
 * (required fields, valid email format, minimum password length), then
 * calls the real backend (POST /api/auth/login). The client-side checks
 * are just UX — the backend re-validates everything and is the actual
 * source of truth on whether the credentials are correct.
 */
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    // React StrictMode double-invokes this effect in development (mount,
    // discard, mount again). The `cancelled` flag stops a stale response
    // from the discarded first mount navigating late, after the second
    // mount's own check has already settled things.
    let cancelled = false;
    isSetupRequired()
      .then((required) => {
        if (cancelled) return;
        if (required) navigate("/setup", { replace: true });
      })
      // If the check itself fails (backend unreachable), fail open to the
      // normal login form rather than getting stuck on a blank page.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Clears a field's error the moment the visitor edits it, rather than
  // leaving a stale "required" message on screen after they've already
  // started fixing it — matches how most production sign-in forms behave.
  function clearError(field: keyof FieldErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  /** Runs all field validations and returns the set of errors found (empty = valid). */
  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};

    const emailError = required(email, "Email") ?? isEmail(email);
    if (emailError) nextErrors.email = emailError;

    const passwordError = required(password, "Password") ?? minLength(password, 6, "Password");
    if (passwordError) nextErrors.password = passwordError;

    return nextErrors;
  }

  // Only shown once a field has been visited (blur) or a submit was
  // already attempted, so the form doesn't flash "required" on both
  // fields before the visitor has had a chance to type anything.
  function handleBlur(field: keyof FieldErrors) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldError = validate()[field];
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  }

  const liveErrors = validate();
  const isFormValid = Object.keys(liveErrors).length === 0;

  function shownError(field: keyof FieldErrors): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(validationErrors).length > 0) {
      showToast("error", "Please correct the highlighted fields before signing in.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      setToken(result.token);
      setSchoolName(result.schoolName);
      showToast("success", "Signed in successfully. Redirecting to your dashboard...");
      navigate("/");
    } catch (error) {
      // ApiError carries the backend's own message (e.g. "Invalid email or
      // password") — anything else (a network failure, an unexpected 500)
      // gets a generic fallback instead of leaking a raw error object.
      const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      showToast("error", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-brand-panel">
        <div className="auth-brand-mark">CampusCore</div>
        <h2 className="auth-brand-heading">Run your school's records, on your own terms.</h2>
        <p className="auth-brand-subtext">
          Student records, attendance, and fee collection in one self-hosted dashboard — your data never leaves your
          server.
        </p>
        <div className="auth-brand-facts">
          <BrandFact>Self-hosted — your data stays on your server</BrandFact>
          <BrandFact>Open source, licensed under AGPL-3.0</BrandFact>
          <BrandFact>Free core, forever</BrandFact>
        </div>
      </aside>

      <div className="auth-form-panel">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Enter your administrator credentials to access your school's dashboard.</p>

          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoFocus
            autoComplete="email"
            className={shownError("email") ? "text-input text-input-error" : "text-input"}
            placeholder="you@school.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            onBlur={() => handleBlur("email")}
            disabled={isSubmitting}
          />
          {shownError("email") && <span className="field-error">{shownError("email")}</span>}

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            className={shownError("password") ? "text-input text-input-error" : "text-input"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
            onBlur={() => handleBlur("password")}
            disabled={isSubmitting}
          />
          {shownError("password") && <span className="field-error">{shownError("password")}</span>}

          <button type="submit" className="primary-button" disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
