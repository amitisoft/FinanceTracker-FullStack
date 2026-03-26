import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { register as registerUser } from "../features/auth/authApi";
import { useNavigate, Link } from "react-router-dom";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { motion } from "framer-motion";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import IntentCapsule from "../components/IntentCapsule";

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

  const [form, setForm] = useState<RegisterFormState>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<RegisterFormErrors>({});

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
      navigate("/login", { replace: true });
    },
  });

  function setField<K extends keyof RegisterFormState>(
    key: K,
    value: RegisterFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
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
              Neon Glass Onboarding
            </p>

            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Build your <span className="text-neon">premium finance zone</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
              Create your account and enter an immersive personal finance workspace.
            </p>
          </div>
        </motion.div>

        <GlassCard className="mx-auto w-full max-w-xl p-5 sm:p-8 md:p-10">
          <div className="mb-8">
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-white/45">
              Create account
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Get started
            </h2>
            <p className="mt-3 text-sm text-white/60 sm:text-base">
              Enter a valid profile to initialize your workspace.
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
              label="Display Name"
              placeholder="Your name"
              value={form.displayName}
              onChange={(e) => setField("displayName", e.target.value)}
              error={errors.displayName}
            />

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
              placeholder="Create a strong password"
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
              />
            </div>
          </form>

          <div className="mt-8 flex flex-col gap-3 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <span>Secure registration · instant access</span>
            <Link to="/login" className="text-cyan-300 hover:text-cyan-200">
              Log in
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}