import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import { api } from "../api/client";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/auth/reset-password", { token, newPassword: password });
    },
    onSuccess: () => {
      navigate("/login", { replace: true });
    },
  });

  return (
    <div className="grid-glow min-h-screen flex items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-md p-6">
        <h2 className="text-2xl font-semibold text-white">Reset password</h2>
        <p className="mt-2 text-sm text-white/60">
          Paste your reset token and set a new password.
        </p>

        <div className="mt-6 space-y-4">
          <NeonInput
            label="Reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="token"
          />

          <NeonInput
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
          />

          <button
            className="w-full rounded-2xl bg-white/12 px-4 py-3 text-white disabled:opacity-50"
            onClick={() => mutation.mutate()}
            disabled={!token || !password || mutation.isPending}
          >
            {mutation.isPending ? "Updating..." : "Update password"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
