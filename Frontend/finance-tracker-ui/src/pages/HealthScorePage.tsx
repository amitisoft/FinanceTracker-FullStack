import { useQuery } from "@tanstack/react-query";
import AppShell from "../components/AppShell";
import GlassCard from "../components/Glasscard";
import { getHealthScore } from "../features/insights/insightsApi";

export default function HealthScorePage() {
  const { data } = useQuery({ queryKey: ["health-score"], queryFn: getHealthScore });

  return (
    <AppShell title="Health Score">
      <div className="space-y-6 p-3 sm:p-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">Health</p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Financial health score</h2>
          <p className="mt-2 text-white/55">A weighted score based on savings, stability, budgets, and buffer.</p>
        </div>

        <GlassCard className="p-6">
          <p className="text-sm text-white/60">Score</p>
          <p className="mt-2 text-5xl font-semibold text-white">
            {data?.hasData === false ? "--" : (data?.score ?? "--")}
          </p>
          {data?.hasData === false ? (
            <p className="mt-2 text-sm text-white/55">{data?.note ?? "Add transactions to calculate a score."}</p>
          ) : null}
        </GlassCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Breakdown</h3>
            <div className="space-y-2 text-sm text-white/70">
              {data?.breakdown && Object.entries(data.breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key}</span>
                  <span>{(value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Suggestions</h3>
            <div className="space-y-2 text-sm text-white/70">
              {(data?.suggestions ?? []).map((s, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                  {s}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
