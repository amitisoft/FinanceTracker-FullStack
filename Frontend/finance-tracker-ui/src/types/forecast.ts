export type ForecastDailyPoint = {
  date: string;
  projectedBalance: number;
  safeToSpend: number;
};

export type ForecastUpcoming = {
  title: string;
  date: string;
  amount: number;
  type: string;
  source: string;
};

export type MonthlyForecast = {
  startingBalance: number;
  projectedEndBalance: number;
  totalIncome: number;
  totalExpense: number;
  riskLevel: string;
  upcoming: ForecastUpcoming[];
  daily: ForecastDailyPoint[];
};
