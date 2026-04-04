import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, resendVerification } from "../features/auth/authApi";
import { authStore } from "../store/authStore";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import IntentCapsule from "../components/IntentCapsule";
import { useAuthTheme } from "../lib/useAuthTheme";

type LoginFormState = {
  email: string;
  password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginFormState, string>>;

const DEFAULT_VALUES: LoginFormState = {
  email: "",
  password: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokens = authStore((s) => s.setTokens);
  const { theme, toggle } = useAuthTheme();
  const isLight = theme === "light";

  const [form, setForm] = useState<LoginFormState>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [authShapeError, setAuthShapeError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resendUrl, setResendUrl] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data: any) => {
      const accessToken =
        data?.accessToken ??
        data?.AccessToken ??
        data?.token ??
        data?.jwt ??
        data?.data?.accessToken ??
        data?.data?.AccessToken ??
        data?.data?.token ??
        data?.data?.jwt;

      const refreshToken =
        data?.refreshToken ??
        data?.RefreshToken ??
        data?.data?.refreshToken ??
        data?.data?.RefreshToken ??
        null;

      if (!accessToken) {
        setAuthShapeError(
          "Login succeeded but no access token was returned. Check the API response shape."
        );
        return;
      }

      setTokens(accessToken, refreshToken);
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
      setAuthShapeError("");

      navigate("/dashboard", { replace: true });
    },
  });

  const resendMutation = useMutation({
    mutationFn: (email: string) => resendVerification(email),
    onSuccess: (data) => {
      setResendMessage(data?.message ?? "Verification email sent.");
      setResendUrl(data?.verificationUrl ?? null);
    },
  });

  const loginErrorMessage =
    authShapeError || (mutation.isError ? getApiErrorMessage(mutation.error, "Login failed.") : "");
  const needsVerification = loginErrorMessage.toLowerCase().includes("verify your email");

  function setField<K extends keyof LoginFormState>(
    key: K,
    value: LoginFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setAuthShapeError("");
    setResendMessage("");
    setResendUrl(null);
  }

  function validateForm(values: LoginFormState): LoginFormErrors {
    const nextErrors: LoginFormErrors = {};

    const trimmedEmail = values.email.trim();
    if (!trimmedEmail) {
      nextErrors.email = "Email is required";
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!values.password) {
      nextErrors.password = "Password is required";
    } else if (values.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    return nextErrors;
  }

  function submitIntent() {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setAuthShapeError("");
    setResendMessage("");
    setResendUrl(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    mutation.mutate({
      email: form.email.trim(),
      password: form.password,
    });
  }

  return (
    <div
      className={clsx(
        "grid-glow relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-6 sm:px-4 sm:py-10",
        isLight
          ? "grid-glow-light bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900"
          : "text-white"
      )}
    >
      <div
        className={clsx(
          "absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full blur-3xl",
          isLight ? "bg-cyan-400/15" : "bg-cyan-400/10"
        )}
      />
      <div
        className={clsx(
          "absolute bottom-[-140px] right-[-100px] h-96 w-96 rounded-full blur-3xl",
          isLight ? "bg-fuchsia-500/12" : "bg-fuchsia-500/10"
        )}
      />
      <div
        className={clsx(
          "absolute right-[10%] top-[20%] h-56 w-56 rounded-full blur-3xl",
          isLight ? "bg-violet-500/12" : "bg-violet-500/10"
        )}
      />

      <div className="grid w-full max-w-6xl gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="hidden flex-col justify-center lg:flex"
        >
          <div className="max-w-xl">
            <p
              className={clsx(
                "mb-4 text-sm uppercase tracking-[0.28em]",
                isLight ? "text-cyan-700/90" : "text-cyan-300/80"
              )}
            >
              Encrypted Finance Habitat
            </p>

            <h1
              className={clsx(
                "text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              Enter your <span className="text-neon">financial space</span>
            </h1>

            <p
              className={clsx(
                "mt-6 max-w-lg text-base leading-7 sm:text-lg sm:leading-8",
                isLight ? "text-slate-700" : "text-white/65"
              )}
            >
              Immersive budgeting, transaction intelligence, and premium control -
              all in one fluid workspace.
            </p>


          </div>
        </motion.div>

        <GlassCard tone={theme} className="mx-auto w-full max-w-xl p-5 sm:p-8 md:p-10">
          <div className="mb-8">
            <div className="flex items-start justify-between gap-3">
              <p
                className={clsx(
                  "mb-3 text-sm uppercase tracking-[0.25em]",
                  isLight ? "text-slate-600" : "text-white/45"
                )}
              >
                Welcome back
              </p>
              <button
                type="button"
                onClick={toggle}
                className={clsx(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  isLight
                    ? "border-slate-900/10 bg-slate-900/5 text-slate-700 hover:bg-slate-900/10"
                    : "border-white/10 bg-white/10 text-white/70 hover:bg-white/15"
                )}
              >
                {isLight ? "Dark" : "Light"} mode
              </button>
            </div>
            <h2 className={clsx("text-3xl font-semibold sm:text-4xl", isLight ? "text-slate-900" : "text-white")}>
              Sign in
            </h2>
            <p className={clsx("mt-3 text-sm sm:text-base", isLight ? "text-slate-700" : "text-white/60")}>
              Access your tracker with an intent-driven entry flow.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="space-y-5"
            noValidate
          >
            <NeonInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              tone={theme}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              error={errors.email}
            />

            <NeonInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              tone={theme}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              error={errors.password}
            />

            {(mutation.isError || authShapeError) && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
                <p className="text-sm font-medium text-rose-200">
                  {loginErrorMessage}
                </p>
              </div>
            )}

            {needsVerification && form.email.trim() ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-white/70">Didn’t get the verification email?</p>
                  <button
                    type="button"
                    disabled={resendMutation.isPending}
                    onClick={() => {
                      setResendMessage("");
                      setResendUrl(null);
                      resendMutation.mutate(form.email.trim());
                    }}
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/15 disabled:opacity-50"
                  >
                    {resendMutation.isPending ? "Sending..." : "Resend link"}
                  </button>
                </div>

                {resendMessage ? (
                  <div className="mt-3 text-xs text-white/65">
                    <p>{resendMessage}</p>
                    {resendUrl ? (
                      <a className="mt-1 inline-block underline" href={resendUrl}>
                        Open verification link
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="pt-2">
              <IntentCapsule
                label="Press and hold to enter"
                loadingLabel="Entering workspace..."
                disabled={mutation.isPending}
                onComplete={submitIntent}
                tone={theme}
              />
            </div>
          </form>

          <div className={clsx("mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between", isLight ? "text-slate-600" : "text-white/55")}>
            <Link
              to="/forgot-password"
              className={clsx(isLight ? "text-cyan-700 hover:text-cyan-600" : "text-cyan-300 hover:text-cyan-200")}
            >
              Forgot password?
            </Link>
            <span>Secure session • Real-time sync</span>
            <Link
              to="/register"
              className={clsx(isLight ? "text-cyan-700 hover:text-cyan-600" : "text-cyan-300 hover:text-cyan-200")}
            >
              Create account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
