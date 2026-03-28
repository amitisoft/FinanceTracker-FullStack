import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import { api } from "../api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/auth/forgot-password", { email });
      return res.data as { resetToken?: string; expiresAt?: string };
    },
    onSuccess: (data) => {
      setToken(data.resetToken ?? null);
    },
  });

  return (
    <div className="grid-glow min-h-screen flex items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-md p-6">
        <h2 className="text-2xl font-semibold text-white">Forgot password</h2>
        <p className="mt-2 text-sm text-white/60">
          Enter your email to get a reset token (hackathon mode).
        </p>

        <div className="mt-6 space-y-4">
          <NeonInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <button
            className="w-full rounded-2xl bg-white/12 px-4 py-3 text-white disabled:opacity-50"
            onClick={() => mutation.mutate()}
            disabled={!email || mutation.isPending}
          >
            {mutation.isPending ? "Sending..." : "Generate reset token"}
          </button>

          {token && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Reset token: <span className="font-mono">{token}</span>
            </div>
          )}

          <div className="text-sm text-white/60">
            <Link to="/reset-password" className="text-cyan-300 hover:text-cyan-200">
              I have a reset token
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
