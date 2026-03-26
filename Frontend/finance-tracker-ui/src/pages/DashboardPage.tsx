import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../features/dashboard/dashboardApi";
import { getMonthlyForecast } from "../features/forecast/forecastApi";
import { getHealthScore } from "../features/insights/insightsApi";
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
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary", month, year],
    queryFn: () => getDashboardSummary(month, year),
  });

  const { data: forecast } = useQuery({
    queryKey: ["forecast-month"],
    queryFn: getMonthlyForecast,
  });

  const { data: health } = useQuery({
    queryKey: ["health-score"],
    queryFn: getHealthScore,
  });

  if (isLoading) {
    return <GlassCard className="p-6 text-white/70">Loading dashboard...</GlassCard>;
  }

  if (isError || !data) {
    return <GlassCard className="p-6 text-rose-300">Failed to load dashboard.</GlassCard>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">Overview</p>
        <h2 className="mt-2 text-4xl font-semibold text-white">Dashboard</h2>
        <p className="mt-2 text-white/55">
          Month {month} / {year}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Income" value={formatCurrency(data.incomeTotal)} />
        <StatCard title="Expenses" value={formatCurrency(data.expenseTotal)} />
        <StatCard title="Net" value={formatCurrency(data.net)} />
        <StatCard title="Balance" value={formatCurrency(data.totalAccountBalance)} />
      </div>

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
          <p className="mt-3 text-3xl font-semibold text-white">
            {forecast?.daily?.length ? formatCurrency(forecast.daily[0].safeToSpend) : "--"}
          </p>
          <p className="mt-2 text-xs text-white/50">Daily projection</p>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-sm text-white/50">Health score</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {health?.score ?? "--"}
          </p>
          <p className="mt-2 text-xs text-white/50">0–100 scale</p>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <GlassCard className="lg:col-span-7 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">Category spending</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categorySpending}>
                {/* DEFS must be inside the Chart component */}
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
                      <p className={`font-semibold ${tx.type === 'EXPENSE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {tx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-white/30">{tx.type}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
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
