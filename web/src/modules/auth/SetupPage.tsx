import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../shared/toast/ToastContext";
import { PasswordInput } from "../../shared/components/PasswordInput";
import { BrandFact } from "../../shared/components/BrandFact";
import { required, isEmail, minLength } from "../../shared/validation/rules";
import { isSetupRequired, setup } from "../../shared/auth/authApi";
import { setToken, setSchoolName } from "../../shared/auth/tokenStorage";
import { ApiError } from "../../shared/api/client";

interface FieldErrors {
  schoolName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const PASSWORD_MIN_LENGTH = 8;

/**
 * First-run setup wizard — the free tier's single admin account (and the
 * one school record this installation serves) are created here, by the
 * school, in the browser. This replaces the old approach of seeding a
 * default admin from a config value: no installation ever ships with a
 * shared default password, because there is no default — the school
 * picks their own on first run.
 *
 * LoginPage redirects here when the backend reports setup isn't done yet
 * (see LoginPage.tsx). This page does the mirror check on mount: if setup
 * turns out to already be complete (e.g. someone bookmarked /setup), it
 * sends them to /login instead.
 */
export function SetupPage() {
  const [schoolName, setSchoolNameInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
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
        if (!required) navigate("/login", { replace: true });
      })
      // If the check itself fails (backend unreachable), fail open and
      // just let the form render — worst case the actual submit fails
      // with a clear error instead of the page getting stuck.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Clears a field's error the moment the visitor edits it, rather than
  // leaving a stale "required" message on screen after they've already
  // started fixing it — matches how most production sign-up forms behave.
  function clearError(field: keyof FieldErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};

    const schoolNameError = required(schoolName, "School name");
    if (schoolNameError) nextErrors.schoolName = schoolNameError;

    const emailError = required(email, "Email") ?? isEmail(email);
    if (emailError) nextErrors.email = emailError;

    const passwordError = required(password, "Password") ?? minLength(password, PASSWORD_MIN_LENGTH, "Password");
    if (passwordError) nextErrors.password = passwordError;

    if (!passwordError && confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  }

  // Only shown once a field has been visited (blur) or a submit was
  // already attempted — otherwise every field would show "required"
  // before the visitor has had a chance to type anything.
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
    setTouched({ schoolName: true, email: true, password: true, confirmPassword: true });

    if (Object.keys(validationErrors).length > 0) {
      showToast("error", "Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await setup(schoolName, email, password, confirmPassword);
      setToken(result.token);
      setSchoolName(result.schoolName);
      // A brief confirmation screen instead of an instant redirect — gives
      // the visitor visible proof the account was actually created before
      // the page moves on, rather than a jarring, unexplained jump.
      setIsComplete(true);
      setTimeout(() => navigate("/"), 1100);
    } catch (error) {
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
        <h2 className="auth-brand-heading">Set up your school's workspace.</h2>
        <p className="auth-brand-subtext">
          This creates the administrator account for your institution and the one-time settings that identify it
          across CampusCore.
        </p>
        <div className="auth-brand-facts">
          <BrandFact>Self-hosted — your data stays on your server</BrandFact>
          <BrandFact>Open source, licensed under AGPL-3.0</BrandFact>
          <BrandFact>No default password — you choose your own credentials now</BrandFact>
        </div>
      </aside>

      <div className="auth-form-panel">
        {isComplete ? (
          <div className="auth-card">
            <div className="auth-success">
              <div className="auth-success-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div className="auth-success-title">Workspace created</div>
              <div className="auth-success-subtext">Redirecting to your dashboard…</div>
            </div>
          </div>
        ) : (
          <form className="auth-card" onSubmit={handleSubmit} noValidate>
            <h1 className="auth-title">Create your administrator account</h1>
            <p className="auth-subtitle">Set your institution's name and your own login to get started.</p>

            <label className="field-label" htmlFor="schoolName">
              School or institution name
            </label>
            <input
              id="schoolName"
              type="text"
              autoFocus
              autoComplete="organization"
              className={shownError("schoolName") ? "text-input text-input-error" : "text-input"}
              placeholder="e.g. St. Mary's School"
              value={schoolName}
              onChange={(e) => {
                setSchoolNameInput(e.target.value);
                clearError("schoolName");
              }}
              onBlur={() => handleBlur("schoolName")}
              disabled={isSubmitting}
            />
            {shownError("schoolName") && <span className="field-error">{shownError("schoolName")}</span>}

            <label className="field-label" htmlFor="email">
              Administrator email
            </label>
            <input
              id="email"
              type="email"
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
              autoComplete="new-password"
              className={shownError("password") ? "text-input text-input-error" : "text-input"}
              placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              onBlur={() => handleBlur("password")}
              disabled={isSubmitting}
            />
            {shownError("password") && <span className="field-error">{shownError("password")}</span>}

            <label className="field-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              className={shownError("confirmPassword") ? "text-input text-input-error" : "text-input"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError("confirmPassword");
              }}
              onBlur={() => handleBlur("confirmPassword")}
              disabled={isSubmitting}
            />
            {shownError("confirmPassword") && <span className="field-error">{shownError("confirmPassword")}</span>}

            <button type="submit" className="primary-button" disabled={isSubmitting || !isFormValid}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
