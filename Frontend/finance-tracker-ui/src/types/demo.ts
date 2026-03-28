export type DemoSeedResult = {
  alreadySeeded: boolean;
  accountsCreated: number;
  transactionsCreated: number;
  budgetsCreated: number;
  goalsCreated: number;
  recurringCreated: number;
  rulesCreated: number;
  message: string;
};

export type DemoClearResult = {
  cleared: boolean;
  accountsDeleted: number;
  transactionsDeleted: number;
  budgetsDeleted: number;
  goalsDeleted: number;
  recurringDeleted: number;
  rulesDeleted: number;
  message: string;
};
