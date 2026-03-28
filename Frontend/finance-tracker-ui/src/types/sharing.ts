export type AccountMember = {
  userId: string;
  role: string;
  isActive: boolean;
  email: string;
  displayName?: string | null;
  isOwner: boolean;
};

export type AccountInvite = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
};

export type PendingAccountInvite = {
  id: string;
  accountId: string;
  accountName: string;
  role: string;
  expiresAt: string;
};

export type InviteAccountMemberInput = {
  email: string;
  role: string;
};

export type UpdateAccountMemberInput = {
  role: string;
  isActive: boolean;
};
