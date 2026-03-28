import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import GlassCard from "../components/Glasscard";
import { verifyEmail } from "../features/auth/authApi";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { useAuthTheme } from "../lib/useAuthTheme";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { theme, toggle } = useAuthTheme();
  const isLight = theme === "light";

  const [message, setMessage] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    let alive = true;
    setStatus("loading");
    setMessage("Verifying your email…");

    verifyEmail(token)
      .then((res) => {
        if (!alive) return;
        setStatus(res?.verified ? "success" : "error");
        setMessage(res?.message || (res?.verified ? "Email verified." : "Verification failed."));
      })
      .catch((err) => {
        if (!alive) return;
        setStatus("error");
        setMessage(getApiErrorMessage(err, "Verification failed."));
      });

    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <div
      className={clsx(
        "grid-glow relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-6 sm:px-4 sm:py-10",
        isLight
          ? "grid-glow-light bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900"
          : "text-white"
      )}
    >
      <div className={clsx("absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full blur-3xl", isLight ? "bg-cyan-400/15" : "bg-cyan-400/10")} />
      <div className={clsx("absolute bottom-[-140px] right-[-100px] h-96 w-96 rounded-full blur-3xl", isLight ? "bg-fuchsia-500/12" : "bg-fuchsia-500/10")} />

      <GlassCard tone={theme} className="w-full max-w-xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <p className={clsx("text-sm uppercase tracking-[0.25em]", isLight ? "text-slate-600" : "text-white/45")}>
            Verify email
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

        <h1 className={clsx("mt-4 text-3xl font-semibold", isLight ? "text-slate-900" : "text-white")}>
          {status === "success" ? "Activated" : "Verification"}
        </h1>

        <p className={clsx("mt-3 text-sm", isLight ? "text-slate-700" : "text-white/60")}>
          {message}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/login"
            className={clsx(
              "rounded-xl border px-4 py-2 text-sm font-medium transition",
              isLight
                ? "border-slate-900/10 bg-slate-900/5 text-slate-800 hover:bg-slate-900/10"
                : "border-white/10 bg-white/10 text-white/80 hover:bg-white/15"
            )}
          >
            Go to login
          </Link>
          <Link
            to="/register"
            className={clsx(
              "rounded-xl border px-4 py-2 text-sm font-medium transition",
              isLight
                ? "border-slate-900/10 bg-transparent text-slate-700 hover:bg-slate-900/5"
                : "border-white/10 bg-transparent text-white/70 hover:bg-white/10"
            )}
          >
            Create new account
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

