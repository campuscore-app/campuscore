import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../shared/toast/ToastContext";
import { required, isEmail, minLength } from "../../shared/validation/rules";
import { isSetupRequired, setup } from "../../shared/auth/authApi";
import { setToken } from "../../shared/auth/tokenStorage";
import { ApiError } from "../../shared/api/client";

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * First-run setup wizard — the free tier's single admin account is
 * created here, by the school, in the browser. This replaces the old
 * approach of seeding a default admin from a config value: no
 * installation ever ships with a shared default password, because there
 * is no default — the school picks their own on first run.
 *
 * LoginPage redirects here when the backend reports setup isn't done yet
 * (see LoginPage.tsx). This page does the mirror check on mount: if setup
 * turns out to already be complete (e.g. someone bookmarked /setup), it
 * sends them to /login instead.
 */
export function SetupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    isSetupRequired()
      .then((required) => {
        if (!required) navigate("/login", { replace: true });
      })
      // If the check itself fails (backend unreachable), fail open and
      // just let the form render — worst case the actual submit fails
      // with a clear error instead of the page getting stuck.
      .catch(() => {});
  }, [navigate]);

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};

    const emailError = required(email, "Email") ?? isEmail(email);
    if (emailError) nextErrors.email = emailError;

    const passwordError = required(password, "Password") ?? minLength(password, 8, "Password");
    if (passwordError) nextErrors.password = passwordError;

    if (!passwordError && confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showToast("error", "Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await setup(email, password, confirmPassword);
      setToken(result.token);
      showToast("success", "Admin account created. Welcome to CampusCore!");
      navigate("/");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      showToast("error", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-title">Welcome to CampusCore</h1>
        <p className="auth-subtitle">Create your school's admin account to get started</p>

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
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
        />
        {errors.password && <span className="field-error">{errors.password}</span>}

        <label className="field-label" htmlFor="confirmPassword">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          className={errors.confirmPassword ? "text-input text-input-error" : "text-input"}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create Admin Account"}
        </button>
      </form>
    </div>
  );
}
