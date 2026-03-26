import { Link, Outlet, useLocation } from "react-router-dom";
import { authStore } from "../store/authstore";
import { motion } from "framer-motion";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/accounts", label: "Accounts" },
  { to: "/categories", label: "Categories" },
  { to: "/transactions", label: "Transactions" },
  { to: "/budgets", label: "Budgets" },
  { to: "/goals", label: "Goals" },
  { to: "/recurring", label: "Recurring" },
  { to: "/reports", label: "Reports" },
];

export default function AppLayout() {
  const location = useLocation();
  const clearAuth = authStore((s) => s.clearAuth);

  return (
    <div className="grid-glow min-h-screen px-4 pb-28 pt-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="glass-soft mb-6 flex items-center justify-between rounded-[28px] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/40">Finance Tracker</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Calm Command Center</h1>
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

      <nav className="fixed bottom-5 left-1/2 z-50 w-[min(95vw,980px)] -translate-x-1/2">
        <div className="glass-card scrollbar-thin flex items-center gap-2 overflow-x-auto rounded-full px-3 py-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to;

            return (
              <Link key={item.to} to={item.to} className="relative">
                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative rounded-full px-5 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-white/14 text-white neon-ring"
                      : "text-white/60 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {item.label}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}