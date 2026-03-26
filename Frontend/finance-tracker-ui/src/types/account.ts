export type Account = {
  id: string;
  name: string;
  type: string;
  openingBalance: number;
  currentBalance: number;
  institutionName?: string | null;
  createdAt: string;
  lastUpdatedAt: string;
};

export type CreateAccountRequest = {
  name: string;
  type: string;
  openingBalance: number;
  institutionName?: string;
};