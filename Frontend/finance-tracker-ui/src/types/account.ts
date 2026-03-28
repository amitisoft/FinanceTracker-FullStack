export type Account = {
  id: string;
  ownerUserId: string;
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

export type TransferFundsRequest = {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  date: string;
  note?: string;
  paymentMethod?: string;
};

export type TransferFundsResult = {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  sourceAccountBalance: number;
  destinationAccountBalance: number;
  message: string;
};
