import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../features/dashboard/dashboardApi";
import { getAccounts } from "../features/accounts/accountApi";
import { getMonthlyForecast } from "../features/forecast/forecastApi";
import { getHealthScore } from "../features/insights/insightsApi";
import { getIncomeVsExpenseReport } from "../features/reports/reportsApi";
import { clearDemoData, seedDemoData } from "../features/demo/demoApi";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { formatCurrency, formatDate } from "../utils/format";
import GlassCard from "../components/Glasscard";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  LineChart,
  Line,
} from "recharts";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [showDemoGuide, setShowDemoGuide] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string>("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary", month, year],
    queryFn: () => getDashboardSummary(month, year),
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const { data: forecast } = useQuery({
    queryKey: ["forecast-month"],
    queryFn: getMonthlyForecast,
  });

  const { data: health } = useQuery({
    queryKey: ["health-score"],
    queryFn: getHealthScore,
  });

  const incomeExpenseDateTo = now.toISOString().slice(0, 10);
  const incomeExpenseDateFrom = new Date(year, month - 6, 1)
    .toISOString()
    .slice(0, 10);

  const { data: incomeVsExpense } = useQuery({
    queryKey: [
      "dashboard-income-expense",
      incomeExpenseDateFrom,
      incomeExpenseDateTo,
    ],
    queryFn: () => getIncomeVsExpenseReport(incomeExpenseDateFrom, incomeExpenseDateTo),
  });

  const alerts = useMemo(() => {
    const items: { level: "warn" | "danger"; message: string }[] = [];

    data?.budgetProgressCards?.forEach((budget) => {
      if (!budget.triggeredThreshold) return;
      if (budget.progressPercent >= 120) {
        items.push({
          level: "danger",
          message: `Over budget in ${budget.categoryName} by ${formatCurrency(budget.spent - budget.budgetAmount)}.`,
        });
      } else if (budget.progressPercent >= 100) {
        items.push({
          level: "danger",
          message: `Budget exceeded in ${budget.categoryName}.`,
        });
      } else if (budget.progressPercent >= 80) {
        items.push({
          level: "warn",
          message: `Budget at ${budget.progressPercent}% for ${budget.categoryName}.`,
        });
      }
    });

    if (forecast?.riskLevel === "high") {
      items.push({
        level: "danger",
        message: "Projected balance may go negative before month end.",
      });
    } else if (forecast?.riskLevel === "medium") {
      items.push({
        level: "warn",
        message: "Projected balance looks tight this month. Watch spending.",
      });
    }

    return items;
  }, [data?.budgetProgressCards, forecast]);

  const invalidateAllDemoQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["recurring"] });
    queryClient.invalidateQueries({ queryKey: ["rules"] });
    queryClient.invalidateQueries({ queryKey: ["forecast-month"] });
    queryClient.invalidateQueries({ queryKey: ["insights"] });
    queryClient.invalidateQueries({ queryKey: ["health-score"] });
    queryClient.invalidateQueries({ queryKey: ["trends"] });
    queryClient.invalidateQueries({ queryKey: ["net-worth"] });
    queryClient.invalidateQueries({ queryKey: ["report-category-spend"] });
    queryClient.invalidateQueries({ queryKey: ["report-income-expense"] });
    queryClient.invalidateQueries({ queryKey: ["report-account-trend"] });
  };

  const demoMutation = useMutation({
    mutationFn: seedDemoData,
    onSuccess: (result) => {
      const message =
        result?.message ||
        (result?.alreadySeeded ? "Demo data already exists." : "Demo data created.");
      setDemoMessage(message);
      setShowDemoGuide(true);
      invalidateAllDemoQueries();
    },
    onError: (error) => {
      setDemoMessage(getApiErrorMessage(error, "Failed to seed demo data."));
      setShowDemoGuide(true);
    },
  });

  const clearDemoMutation = useMutation({
    mutationFn: clearDemoData,
    onSuccess: (result) => {
      setDemoMessage(result?.message || "Demo data cleared.");
      setShowDemoGuide(true);
      invalidateAllDemoQueries();
    },
    onError: (error) => {
      setDemoMessage(getApiErrorMessage(error, "Failed to clear demo data."));
      setShowDemoGuide(true);
    },
  });

  if (isLoading) {
    return <GlassCard className="p-6 text-white/70">Loading dashboard...</GlassCard>;
  }

  if (isError || !data) {
    return <GlassCard className="p-6 text-rose-300">Failed to load dashboard.</GlassCard>;
  }

  const incomeExpenseChartData = (incomeVsExpense ?? []).map((p) => ({
    period: p.period,
    income: p.income,
    expense: p.expense,
  }));

  const onboardingSteps = [
    {
      id: "accounts",
      done: (accounts?.length ?? 0) > 0,
      title: "Create your first account",
      action: "/accounts",
    },
    {
      id: "transaction",
      done: (data.recentTransactions?.length ?? 0) > 0,
      title: "Add your first transaction",
      action: "/transactions",
    },
    {
      id: "budget",
      done: (data.budgetProgressCards?.length ?? 0) > 0,
      title: "Set a monthly budget",
      action: "/budgets",
    },
    {
      id: "goal",
      done: (data.goalsSummary?.length ?? 0) > 0,
      title: "Create a savings goal",
      action: "/goals",
    },
  ];

  const remainingSteps = onboardingSteps.filter((s) => !s.done);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">Overview</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="mt-2 text-4xl font-semibold text-white">Dashboard</h2>
            <p className="mt-2 text-white/55">
              Month {month} / {year}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (demoMutation.isPending || clearDemoMutation.isPending) return;
                setDemoMessage("");
                demoMutation.mutate();
              }}
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-50"
              disabled={demoMutation.isPending || clearDemoMutation.isPending}
            >
              {demoMutation.isPending ? "Launching..." : "Launch Showcase"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (demoMutation.isPending || clearDemoMutation.isPending) return;
                const ok = window.confirm(
                  "Exit Showcase mode and remove only demo data (demo accounts, transactions, budgets, goals, recurring, rules)? Your own data stays."
                );
                if (!ok) return;
                setDemoMessage("");
                clearDemoMutation.mutate();
              }}
              className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100/90 transition hover:bg-rose-500/15 disabled:opacity-50"
              disabled={demoMutation.isPending || clearDemoMutation.isPending}
            >
              {clearDemoMutation.isPending ? "Exiting..." : "Exit Showcase"}
            </button>
          </div>
        </div>
      </div>

      {remainingSteps.length > 0 && (
        <GlassCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Onboarding</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Finish your setup</h3>
              <p className="mt-1 text-sm text-white/55">
                Complete the quick steps below to unlock full analytics.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
              {onboardingSteps.length - remainingSteps.length}/{onboardingSteps.length} done
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {onboardingSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                  step.done
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-white/80"
                }`}
              >
                <span className="text-sm">{step.title}</span>
                {step.done ? (
                  <span className="text-xs text-emerald-100/80">Done</span>
                ) : (
                  <Link
                    to={step.action}
                    className="text-xs text-cyan-200 underline-offset-4 hover:underline"
                  >
                    Start
                  </Link>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Income" value={formatCurrency(data.incomeTotal)} />
        <StatCard title="Expenses" value={formatCurrency(data.expenseTotal)} />
        <StatCard title="Net" value={formatCurrency(data.net)} />
        <StatCard title="Balance" value={formatCurrency(data.totalAccountBalance)} />
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Alerts</h3>
        {alerts.length === 0 ? (
          <p className="text-sm text-white/55">No alerts right now.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={`${alert.message}-${idx}`}
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  alert.level === "danger"
                    ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                    : "border-amber-400/30 bg-amber-500/10 text-amber-200"
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-6">
          <p className="text-sm text-white/50">Projected end-of-month</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {forecast ? formatCurrency(forecast.projectedEndBalance) : "--"}
          </p>
          <p className="mt-2 text-xs text-white/50">
            Risk: {forecast?.riskLevel ?? "unknown"}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-sm text-white/50">Safe to spend</p>
          <div className="mt-4 flex items-center gap-4">
            <SafeToSpendGauge
              value={forecast?.daily?.[0]?.safeToSpend ?? 0}
              max={Math.max(1, (forecast?.projectedEndBalance ?? 1) / 30)}
            />
            <div>
              <p className="text-3xl font-semibold text-white">
                {forecast?.daily?.length ? formatCurrency(forecast.daily[0].safeToSpend) : "--"}
              </p>
              <p className="mt-1 text-xs text-white/50">Daily projection</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-sm text-white/50">Health score</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {health?.hasData === false ? "--" : (health?.score ?? "--")}
          </p>
          <p className="mt-2 text-xs text-white/50">
            {health?.hasData === false ? health?.note ?? "Add transactions to calculate a score." : "0-100 scale"}
          </p>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <GlassCard className="lg:col-span-7 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">Category spending</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categorySpending}>
                <defs>
                  <linearGradient id="categorySpendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="55%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="categoryName" stroke="rgba(255,255,255,0.55)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.55)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                  }}
                  itemStyle={{ color: "#22d3ee" }}
                  formatter={(value: number) => [formatCurrency(value), "Amount"]}
                />
                <Bar
                  dataKey="totalAmount"
                  fill="url(#categorySpendGradient)"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-5 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">Budget health</h3>
          <div className="space-y-4">
            {data.budgetProgressCards.length === 0 ? (
              <p className="text-sm text-white/55">No budgets available.</p>
            ) : (
              data.budgetProgressCards.map((item) => (
                <div key={item.budgetId}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{item.categoryName}</span>
                    <span className="text-white/55">{item.progressPercent}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-all duration-500"
                      style={{ width: `${Math.min(item.progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-12 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">Projected balance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast?.daily ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.55)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.55)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Projected"]}
                />
                <Line type="monotone" dataKey="projectedBalance" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-6 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">Upcoming expenses</h3>
          {(forecast?.upcoming ?? []).length === 0 ? (
            <p className="text-sm text-white/55">No upcoming items yet.</p>
          ) : (
            <div className="space-y-3">
              {forecast?.upcoming?.slice(0, 6).map((item, idx) => (
                <div
                  key={`${item.title}-${item.date}-${idx}`}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-white/55">
                      {formatDate(item.date)} • {item.source}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      String(item.type).toLowerCase() === "expense"
                        ? "text-rose-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {String(item.type).toLowerCase() === "expense" ? "-" : "+"}
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-6 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">Forecast coverage</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-xs text-white/50">Starting balance</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {forecast ? formatCurrency(forecast.startingBalance) : "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-xs text-white/50">Projected end</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {forecast ? formatCurrency(forecast.projectedEndBalance) : "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-xs text-white/50">Income (forecast)</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {forecast ? formatCurrency(forecast.totalIncome) : "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-xs text-white/50">Expenses (forecast)</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {forecast ? formatCurrency(forecast.totalExpense) : "--"}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-12 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">Recent transactions</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-white/55">No recent transactions.</p>
            ) : (
              data.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-white/5 bg-white/5 px-4 py-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{tx.merchant || tx.categoryName}</p>
                      <p className="text-sm text-white/50">
                        {tx.accountName} • {tx.categoryName}
                      </p>
                      <p className="mt-1 text-xs text-white/40">{formatDate(tx.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${String(tx.type).toLowerCase() === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {String(tx.type).toLowerCase() === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-white/30">{tx.type}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-6 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">Upcoming recurring</h3>
          {(data.upcomingRecurring ?? []).length === 0 ? (
            <p className="text-sm text-white/55">No upcoming recurring items this month.</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingRecurring.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.title}
                      {item.isPaused ? " (Paused)" : ""}
                    </p>
                    <p className="text-xs text-white/55">
                      {formatDate(item.nextRunDate)} • {item.accountName ?? "No account"} •{" "}
                      {item.categoryName ?? "No category"}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      String(item.type).toLowerCase() === "expense"
                        ? "text-rose-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {String(item.type).toLowerCase() === "expense" ? "-" : "+"}
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-6 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">Savings goals</h3>
          {(data.goalsSummary ?? []).length === 0 ? (
            <p className="text-sm text-white/55">No goals yet. Create one from the Goals page.</p>
          ) : (
            <div className="space-y-4">
              {data.goalsSummary.map((goal) => (
                <div key={goal.id} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">
                      {goal.icon ? `${goal.icon} ` : ""}
                      {goal.name}
                    </p>
                    <p className="text-xs text-white/55">{Math.round(goal.progressPercent)}%</p>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                      style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/55">
                    <span>
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </span>
                    <span>{goal.targetDate ? `Due ${formatDate(goal.targetDate)}` : goal.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-12 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">Income vs expense</h3>
          {incomeExpenseChartData.length === 0 ? (
            <p className="text-sm text-white/55">Not enough data yet.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeExpenseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="period" stroke="rgba(255,255,255,0.55)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.55)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                    }}
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  />
                  <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expense" stroke="#fb7185" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </div>

      {showDemoGuide ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 py-6">
          <GlassCard className="w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">
                  Demo mode
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  Ready for judging
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  {demoMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoGuide(false)}
                className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <GuideLink to="/transactions" title="Flow" desc="View & edit seeded transactions." />
              <GuideLink to="/budgets" title="Limits" desc="See budget progress and alerts." />
              <GuideLink to="/reports" title="Pulse" desc="Open reports and export CSV." />
              <GuideLink to="/insights" title="Signals" desc="Health score + trends + net worth." />
              <GuideLink to="/recurring" title="AutoPay" desc="Upcoming bills and processing." />
              <GuideLink to="/rules" title="Autopilot" desc="Rule-based auto-categorization." />
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}

function GuideLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 transition hover:bg-white/10"
    >
      <p className="text-sm uppercase tracking-[0.24em] text-white/45">{title}</p>
      <p className="mt-2 text-sm font-medium text-white">{desc}</p>
    </Link>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <GlassCard className="p-6">
      <p className="text-sm text-white/50">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </GlassCard>
  );
}

function SafeToSpendGauge({ value, max }: { value: number; max: number }) {
  const radius = 34;
  const stroke = 6;
  const normalizedMax = Math.max(1, max);
  const pct = Math.min(1, Math.max(0, value / normalizedMax));
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke="#22d3ee"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        fill="none"
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="44" textAnchor="middle" fontSize="12" fill="white">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
