import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GlassCard from "../components/Glasscard";
import { getProfile, updateProfile } from "../features/profile/profileApi";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";

function getInitials(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean)
    .join("");
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarColor, setAvatarColor] = useState("#22c55e");
  const [avatarPreviewFailed, setAvatarPreviewFailed] = useState(false);

  const hydrated = useMemo(() => !!profile, [profile]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
    setAvatarColor(profile.avatarColor ?? "#22c55e");
    setAvatarPreviewFailed(false);
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        displayName: displayName.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        avatarColor: avatarColor.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const label = displayName.trim() || profile?.email || "User";
  const initials = getInitials(displayName.trim() || profile?.email || "");
  const bg = avatarColor.trim() || "#22c55e";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">Settings</p>
        <h2 className="mt-2 text-4xl font-semibold text-white">Profile</h2>
        <p className="mt-2 text-sm text-white/60">
          Update your display name and avatar used across the app.
        </p>
      </div>

      <div className="grid gap-6">
        <GlassCard className="p-6">
          {isLoading ? (
            <p className="text-sm text-white/60">Loading profile…</p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">Email</label>
                <input
                  value={profile?.email ?? ""}
                  disabled
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white/70"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">Display name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                />
                <p className="text-xs text-white/45">Max 60 characters.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">Avatar image URL (optional)</label>
                <input
                  value={avatarUrl}
                  onChange={(e) => {
                    setAvatarUrl(e.target.value);
                    setAvatarPreviewFailed(false);
                  }}
                  placeholder="https://…"
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                />
                <p className="text-xs text-white/45">Must be a valid http(s) URL.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">Avatar color</label>
                  <input
                    value={avatarColor}
                    onChange={(e) => setAvatarColor(e.target.value)}
                    placeholder="#22c55e"
                    className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">Preview</label>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    {avatarUrl.trim() ? (
                      <img
                        src={avatarUrl.trim()}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                        onError={() => setAvatarPreviewFailed(true)}
                        style={avatarPreviewFailed ? { display: "none" } : undefined}
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: bg }}
                      >
                        {initials}
                      </div>
                    )}
                    {avatarUrl.trim() && avatarPreviewFailed ? (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: bg }}
                      >
                        {initials}
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{label}</p>
                      <p className="truncate text-xs text-white/55">
                        {profile?.isEmailVerified ? "Email verified" : "Email not verified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {saveMutation.error ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {getApiErrorMessage(saveMutation.error)}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-2xl bg-cyan-500/90 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 disabled:opacity-50"
                >
                  {saveMutation.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
