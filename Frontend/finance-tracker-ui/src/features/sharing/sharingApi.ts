import { api } from "../../api/client";
import type {
  AccountInvite,
  AccountMember,
  InviteAccountMemberInput,
  PendingAccountInvite,
  UpdateAccountMemberInput,
} from "../../types/sharing";

export const inviteAccountMember = async (accountId: string, payload: InviteAccountMemberInput) => {
  const res = await api.post<AccountInvite>(`/api/accounts/${accountId}/invite`, payload);
  return res.data;
};

export const getAccountMembers = async (accountId: string) => {
  const res = await api.get<AccountMember[]>(`/api/accounts/${accountId}/members`);
  return res.data;
};

export const updateAccountMember = async (accountId: string, memberUserId: string, payload: UpdateAccountMemberInput) => {
  const res = await api.put<AccountMember>(`/api/accounts/${accountId}/members/${memberUserId}`, payload);
  return res.data;
};

export const getPendingInvites = async () => {
  const res = await api.get<PendingAccountInvite[]>(`/api/accounts/invites/pending`);
  return res.data;
};

export const acceptInvite = async (accountId: string) => {
  const res = await api.post<AccountMember>(`/api/accounts/${accountId}/invites/accept`);
  return res.data;
};
