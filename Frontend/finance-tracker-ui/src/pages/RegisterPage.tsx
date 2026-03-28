import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { register as registerUser } from "../features/auth/authApi";
import { useNavigate, Link } from "react-router-dom";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { motion } from "framer-motion";
import clsx from "clsx";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import IntentCapsule from "../components/IntentCapsule";
import { useAuthTheme } from "../lib/useAuthTheme";
import type { RegisterResponse } from "../types/auth";

type RegisterFormState = {
  displayName: string;
  email: string;
  password: string;
};

type RegisterFormErrors = Partial<Record<keyof RegisterFormState, string>>;

const DEFAULT_VALUES: RegisterFormState = {
  displayName: "",
  email: "",
  password: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useAuthTheme();
  const isLight = theme === "light";

  const [form, setForm] = useState<RegisterFormState>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [success, setSuccess] = useState<RegisterResponse | null>(null);

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
      setSuccess(data ?? { message: "Verification email sent.", emailSent: true });
    },
  });

  function setField<K extends keyof RegisterFormState>(
    key: K,
    value: RegisterFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSuccess(null);
  }

  function validateForm(values: RegisterFormState): RegisterFormErrors {
    const nextErrors: RegisterFormErrors = {};

    const trimmedDisplayName = values.displayName.trim();
    if (!trimmedDisplayName) {
      nextErrors.displayName = "Display name is required";
    } else if (trimmedDisplayName.length < 2) {
      nextErrors.displayName = "Display name must be at least 2 characters";
    }

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
    } else if (!/[A-Z]/.test(values.password)) {
      nextErrors.password = "Password must contain at least 1 uppercase letter";
    } else if (!/[a-z]/.test(values.password)) {
      nextErrors.password = "Password must contain at least 1 lowercase letter";
    } else if (!/[0-9]/.test(values.password)) {
      nextErrors.password = "Password must contain at least 1 number";
    }

    return nextErrors;
  }

  function submitIntent() {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setSuccess(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    mutation.mutate({
      displayName: form.displayName.trim(),
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
            <h1
              className={clsx(
                "text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              Build your <span className="text-neon">premium finance zone</span>
            </h1>

            <p
              className={clsx(
                "mt-6 max-w-lg text-base leading-7 sm:text-lg sm:leading-8",
                isLight ? "text-slate-700" : "text-white/65"
              )}
            >
              Create your account and enter an immersive personal finance workspace.
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
                Create account
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
              Get started
            </h2>
            <p className={clsx("mt-3 text-sm sm:text-base", isLight ? "text-slate-700" : "text-white/60")}>
              Enter a valid profile to initialize your workspace.
            </p>
          </div>

          {success ? (
            <div className={clsx(
              "mb-6 rounded-2xl border px-4 py-4",
              isLight
                ? "border-emerald-600/15 bg-emerald-500/10 text-emerald-950"
                : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
            )}>
              <p className={clsx("text-sm font-medium", isLight ? "text-emerald-900" : "text-emerald-100")}>
                {success.message}
              </p>
              {success.verificationUrl ? (
                <a
                  className={clsx("mt-2 inline-block text-sm underline", isLight ? "text-emerald-800" : "text-emerald-200")}
                  href={success.verificationUrl}
                >
                  Verify now
                </a>
              ) : (
                <p className={clsx("mt-2 text-xs", isLight ? "text-emerald-800/80" : "text-emerald-200/80")}>
                  Check your inbox/spam for the verification link.
                </p>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/login", { replace: true })}
                  className={clsx(
                    "rounded-xl border px-4 py-2 text-sm font-medium transition",
                    isLight
                      ? "border-emerald-900/15 bg-white text-emerald-900 hover:bg-emerald-50"
                      : "border-emerald-200/20 bg-white/10 text-emerald-100 hover:bg-white/15"
                  )}
                >
                  Go to login
                </button>
              </div>
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="space-y-5"
            noValidate
          >
            <NeonInput
              label="Display Name"
              placeholder="Your name"
              autoComplete="name"
              tone={theme}
              value={form.displayName}
              onChange={(e) => setField("displayName", e.target.value)}
              error={errors.displayName}
            />

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
              placeholder="Create a strong password"
              autoComplete="new-password"
              tone={theme}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              error={errors.password}
            />

            {mutation.isError && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
                <p className="text-sm font-medium text-rose-200">
                  {getApiErrorMessage(mutation.error, "Registration failed.")}
                </p>
              </div>
            )}

            <div className="pt-2">
              <IntentCapsule
                label="Press and hold to create account"
                loadingLabel="Creating workspace..."
                disabled={mutation.isPending}
                onComplete={submitIntent}
                tone={theme}
              />
            </div>
          </form>

          <div
            className={clsx(
              "mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between",
              isLight ? "text-slate-600" : "text-white/55"
            )}
          >
            <span>Secure registration • instant access</span>
            <Link to="/login" className={clsx(isLight ? "text-cyan-700 hover:text-cyan-600" : "text-cyan-300 hover:text-cyan-200")}>
              Log in
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
