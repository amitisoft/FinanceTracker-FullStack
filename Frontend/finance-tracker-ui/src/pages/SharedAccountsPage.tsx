import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "../components/AppShell";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import { getAccounts } from "../features/accounts/accountApi";
import { getAccountMembers, inviteAccountMember, updateAccountMember } from "../features/sharing/sharingApi";

export default function SharedAccountsPage() {
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });

  const { data: members } = useQuery({
    queryKey: ["account-members", selectedAccountId],
    queryFn: () => getAccountMembers(selectedAccountId),
    enabled: !!selectedAccountId,
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteAccountMember(selectedAccountId, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account-members", selectedAccountId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, role, isActive }: { userId: string; role: string; isActive: boolean }) =>
      updateAccountMember(selectedAccountId, userId, { role, isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account-members", selectedAccountId] }),
  });

  const canInvite = useMemo(() => selectedAccountId && inviteEmail.trim(), [selectedAccountId, inviteEmail]);

  return (
    <AppShell title="Shared Accounts">
      <div className="space-y-6 p-3 sm:p-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">Family mode</p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Shared accounts</h2>
          <p className="mt-2 text-white/55">Invite editors or viewers to collaborate.</p>
        </div>

        <GlassCard className="p-5">
          <label className="block text-sm text-white/70">Select account</label>
          <select
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            <option value="" className="text-black">Choose account</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id} className="text-black">
                {a.name}
              </option>
            ))}
          </select>
        </GlassCard>

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <GlassCard className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Invite member</h3>
            <NeonInput
              label="Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="person@email.com"
            />
            <div className="mt-3">
              <label className="block text-sm text-white/70">Role</label>
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="editor" className="text-black">Editor</option>
                <option value="viewer" className="text-black">Viewer</option>
              </select>
            </div>
            <button
              className="mt-4 w-full rounded-2xl bg-white/12 px-4 py-3 text-white disabled:opacity-50"
              disabled={!canInvite || inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
            >
              {inviteMutation.isPending ? "Inviting..." : "Send invite"}
            </button>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Members</h3>
            {!selectedAccountId ? (
              <p className="text-sm text-white/55">Select an account to view members.</p>
            ) : (members?.length ?? 0) === 0 ? (
              <p className="text-sm text-white/55">No members yet.</p>
            ) : (
              <div className="space-y-3">
                {members?.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-white text-sm">{m.userId}</p>
                      <p className="text-xs text-white/50">{m.isActive ? "Active" : "Inactive"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white"
                        value={m.role}
                        onChange={(e) => updateMutation.mutate({ userId: m.userId, role: e.target.value, isActive: m.isActive })}
                      >
                        <option value="editor" className="text-black">Editor</option>
                        <option value="viewer" className="text-black">Viewer</option>
                      </select>
                      <button
                        className="rounded-xl border border-white/10 px-3 py-1 text-xs text-white/70"
                        onClick={() => updateMutation.mutate({ userId: m.userId, role: m.role, isActive: !m.isActive })}
                      >
                        {m.isActive ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
