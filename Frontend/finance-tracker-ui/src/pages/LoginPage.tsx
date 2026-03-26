import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login } from "../features/auth/authApi";
import { authStore } from "../store/authStore";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import IntentCapsule from "../components/IntentCapsule";

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

  const [form, setForm] = useState<LoginFormState>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [authShapeError, setAuthShapeError] = useState("");

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data: any) => {
      const accessToken =
        data?.accessToken ??
        data?.token ??
        data?.jwt ??
        data?.data?.accessToken ??
        data?.data?.token ??
        data?.data?.jwt;

      const refreshToken =
        data?.refreshToken ??
        data?.data?.refreshToken ??
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

  function setField<K extends keyof LoginFormState>(
    key: K,
    value: LoginFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setAuthShapeError("");
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

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    mutation.mutate({
      email: form.email.trim(),
      password: form.password,
    });
  }

  return (
    <div className="grid-glow relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-6 sm:px-4 sm:py-10">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-100px] h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="absolute right-[10%] top-[20%] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="grid w-full max-w-6xl gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="hidden flex-col justify-center lg:flex"
        >
          <div className="max-w-xl">
            <p className="mb-4 text-sm uppercase tracking-[0.28em] text-cyan-300/80">
              Encrypted Finance Habitat
            </p>

            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Enter your <span className="text-neon">financial space</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
              Immersive budgeting, transaction intelligence, and premium control —
              all in one fluid workspace.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="glass-soft rounded-3xl p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Security
                </p>
                <p className="mt-3 text-xl font-semibold text-white">
                  JWT protected access
                </p>
              </div>

              <div className="glass-soft rounded-3xl p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Experience
                </p>
                <p className="mt-3 text-xl font-semibold text-white">
                  Spatial navigation
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <GlassCard className="mx-auto w-full max-w-xl p-5 sm:p-8 md:p-10">
          <div className="mb-8">
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-white/45">
              Welcome back
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Sign in
            </h2>
            <p className="mt-3 text-sm text-white/60 sm:text-base">
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
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              error={errors.email}
            />

            <NeonInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              error={errors.password}
            />

            {(mutation.isError || authShapeError) && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
                <p className="text-sm font-medium text-rose-200">
                  {authShapeError ||
                    getApiErrorMessage(mutation.error, "Login failed.")}
                </p>
              </div>
            )}

            <div className="pt-2">
              <IntentCapsule
                label="Press and hold to enter"
                loadingLabel="Entering workspace..."
                disabled={mutation.isPending}
                onComplete={submitIntent}
              />
            </div>
          </form>

          <div className="mt-8 flex flex-col gap-3 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <span>Secure session · Real-time sync</span>
            <Link to="/register" className="text-cyan-300 hover:text-cyan-200">
              Create account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
