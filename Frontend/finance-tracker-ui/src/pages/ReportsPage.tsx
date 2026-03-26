import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import GlassCard from "../components/Glasscard";
import { getAccounts } from "../features/accounts/accountApi";
import {
  getAccountBalanceTrendReport,
  getCategorySpendReport,
  getIncomeVsExpenseReport,
} from "../features/reports/reportsApi";
import { formatCurrency, formatDate } from "../utils/format";

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-31");
  const [accountId, setAccountId] = useState("");

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const { data: categorySpend } = useQuery({
    queryKey: ["report-category-spend", dateFrom, dateTo, accountId],
    queryFn: () => getCategorySpendReport(dateFrom, dateTo, accountId || undefined),
  });

  const { data: incomeVsExpense } = useQuery({
    queryKey: ["report-income-expense", dateFrom, dateTo],
    queryFn: () => getIncomeVsExpenseReport(dateFrom, dateTo),
  });

  const { data: accountTrend } = useQuery({
    queryKey: ["report-account-trend", accountId, dateFrom, dateTo],
    queryFn: () => getAccountBalanceTrendReport(accountId, dateFrom, dateTo),
    enabled: !!accountId,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">Reports</p>
        <h2 className="mt-2 text-4xl font-semibold text-white">Analytics and insights</h2>
      </div>

      <GlassCard className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-white/80">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Account Trend</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white"
            >
              <option value="" className="text-black">Optional account</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id} className="text-black">
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Category Spend</h3>
          <div className="space-y-3">
            {categorySpend?.map((item) => (
              <div key={item.categoryId} className="flex items-center justify-between rounded-2xl bg-white/6 p-4">
                <span className="text-white">{item.categoryName}</span>
                <span className="font-semibold text-white">{formatCurrency(item.totalAmount)}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Income vs Expense</h3>
          <div className="space-y-3">
            {incomeVsExpense?.map((item) => (
              <div key={item.period} className="rounded-2xl bg-white/6 p-4">
                <p className="font-medium text-white">{item.period}</p>
                <p className="mt-2 text-sm text-white/60">
                  Income: {formatCurrency(item.income)} • Expense: {formatCurrency(item.expense)}
                </p>
                <p className="mt-1 font-semibold text-white">Net: {formatCurrency(item.net)}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-white">Account Balance Trend</h3>
          {!accountId ? (
            <p className="text-sm text-white/55">Select an account to view balance trend.</p>
          ) : (
            <div className="space-y-3">
              {accountTrend?.map((item, index) => (
                <div key={`${item.date}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/6 p-4">
                  <span className="text-white">{formatDate(item.date)}</span>
                  <span className="font-semibold text-white">{formatCurrency(item.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}