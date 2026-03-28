import { Link, Outlet, useLocation } from "react-router-dom";
import { authStore } from "../store/authStore";
import { decodeJwt } from "../utils/jwt";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/accounts", label: "Accounts" },
  { to: "/categories", label: "Categories" },
  { to: "/transactions", label: "Transactions" },
  { to: "/budgets", label: "Budgets" },
  { to: "/goals", label: "Goals" },
  { to: "/recurring", label: "Recurring" },
  { to: "/reports", label: "Reports" },
  { to: "/insights", label: "Insights" },
  { to: "/rules", label: "Rules" },
  { to: "/shared", label: "Shared" },
];

export default function AppLayout() {
  const location = useLocation();
  const clearAuth = authStore((s) => s.clearAuth);
  const accessToken = authStore((s) => s.accessToken);
  const jwt = decodeJwt(accessToken);
  const userLabel = jwt?.email ?? "";

  return (
    <div className="grid-glow min-h-screen px-4 pb-28 pt-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="glass-soft mb-6 flex items-center justify-between rounded-[28px] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/40">Finance Tracker</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Calm Command Center</h1>
            {userLabel ? (
              <p className="mt-1 text-xs text-white/55">Signed in as {userLabel}</p>
            ) : null}
          </div>

          <button
            onClick={clearAuth}
            className="rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/80 transition hover:bg-white/12"
          >
            Logout
          </button>
        </header>

        <main>
          <Outlet />
        </main>
      </div>

      <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3">
        <Link
          to="/transactions"
          className="rounded-full bg-cyan-500/90 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400"
        >
          + Add Expense
        </Link>
        <Link
          to="/transactions"
          className="rounded-full bg-emerald-500/90 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
        >
          + Add Income
        </Link>
      </div>

      <nav className="fixed bottom-5 left-1/2 z-50 w-[min(95vw,980px)] -translate-x-1/2">
        <div className="glass-card scrollbar-thin flex items-center gap-2 overflow-x-auto rounded-full px-3 py-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to;

            return (
              <Link key={item.to} to={item.to} className="relative flex-shrink-0">
                <div
                  className={`relative rounded-full px-5 py-3 text-sm font-medium transition-all duration-200 border ${
                    active
                      ? "bg-white/14 text-white border-white/20 neon-ring"
                      : "text-white/60 border-transparent hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
