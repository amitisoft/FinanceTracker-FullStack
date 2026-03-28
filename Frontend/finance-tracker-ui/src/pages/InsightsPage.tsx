import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AppShell from "../components/AppShell";
import GlassCard from "../components/Glasscard";
import { getInsights, getHealthScore } from "../features/insights/insightsApi";
import { getTrendsReport, getNetWorthReport } from "../features/reports/reportsV2Api";
import { formatCurrency } from "../utils/format";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function InsightsPage() {
  const today = new Date();
  const dateTo = today.toISOString().slice(0, 10);
  const dateFrom = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().slice(0, 10);

  const { data: insights } = useQuery({ queryKey: ["insights"], queryFn: getInsights });
  const { data: health } = useQuery({ queryKey: ["health-score"], queryFn: getHealthScore });
  const { data: trends } = useQuery({ queryKey: ["trends", dateFrom, dateTo], queryFn: () => getTrendsReport(dateFrom, dateTo) });
  const { data: netWorth } = useQuery({ queryKey: ["net-worth", dateFrom, dateTo], queryFn: () => getNetWorthReport(dateFrom, dateTo) });

  const netWorthData = useMemo(() => (netWorth ?? []).map((p) => ({
    date: p.date.slice(0, 7),
    netWorth: p.netWorth,
  })), [netWorth]);

  return (
    <AppShell title="Insights">
      <div className="space-y-6 p-3 sm:p-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">Insights</p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Financial insights</h2>
          <p className="mt-2 text-white/55">Trends, health score, and key signals.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="p-5">
            <p className="text-sm text-white/60">Health score</p>
            <p className="mt-2 text-4xl font-semibold text-white">
              {health?.hasData === false ? "--" : (health?.score ?? "--")}
            </p>
            <p className="mt-2 text-xs text-white/50">
              {health?.hasData === false
                ? health?.note ?? "Add transactions to calculate a score."
                : "Based on savings rate, stability, budget adherence, buffer."}
            </p>
          </GlassCard>

          <GlassCard className="p-5 lg:col-span-2">
            <p className="text-sm text-white/60">Highlights</p>
            <div className="mt-3 space-y-2">
              {(insights ?? []).map((i, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm text-white">{i.title}</p>
                  <p className="text-xs text-white/60">{i.message}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Savings rate trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends?.savingsRateTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="period" stroke="rgba(255,255,255,0.55)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.55)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                    }}
                    formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, "Savings rate"]}
                  />
                  <Line type="monotone" dataKey="savingsRate" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Net worth</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={netWorthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.55)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.55)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Net worth"]}
                  />
                  <Line type="monotone" dataKey="netWorth" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
