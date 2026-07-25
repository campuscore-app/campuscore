import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../shared/toast/ToastContext";
import { required, isEmail, minLength } from "../../shared/validation/rules";
import { isSetupRequired, login } from "../../shared/auth/authApi";
import { setToken } from "../../shared/auth/tokenStorage";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    isSetupRequired()
      .then((required) => {
        if (required) navigate("/setup", { replace: true });
      })
      // If the check itself fails (backend unreachable), fail open to the
      // normal login form rather than getting stuck on a blank page.
      .catch(() => {});
  }, [navigate]);

  /** Runs all field validations and returns the set of errors found (empty = valid). */
  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};

    const emailError = required(email, "Email") ?? isEmail(email);
    if (emailError) nextErrors.email = emailError;

    const passwordError = required(password, "Password") ?? minLength(password, 6, "Password");
    if (passwordError) nextErrors.password = passwordError;

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showToast("error", "Please correct the highlighted fields before signing in.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      setToken(result.token);
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
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-title">CampusCore</h1>
        <p className="auth-subtitle">Sign in to your school's dashboard</p>

        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className={errors.email ? "text-input text-input-error" : "text-input"}
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}

        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className={errors.password ? "text-input text-input-error" : "text-input"}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
        />
        {errors.password && <span className="field-error">{errors.password}</span>}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
