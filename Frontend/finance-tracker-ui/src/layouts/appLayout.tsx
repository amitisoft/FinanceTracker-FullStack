import { Link, Outlet, useLocation } from "react-router-dom";
import { authStore } from "../store/authStore";
import { decodeJwt } from "../utils/jwt";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../features/profile/profileApi";
import NotificationBanner from "../components/NotificationBanner";

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
  { to: "/settings", label: "Profile" },
];

export default function AppLayout() {
  const location = useLocation();
  const clearAuth = authStore((s) => s.clearAuth);
  const accessToken = authStore((s) => s.accessToken);
  const jwt = decodeJwt(accessToken);
  const userEmail = jwt?.email ?? "";

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!accessToken,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const displayName = profile?.displayName?.trim() || "";
  const identityLabel = displayName || userEmail || "User";
  const initials = (identityLabel || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean)
    .join("");
  const avatarColor = profile?.avatarColor?.trim() || "#22c55e";

  return (
    <div className="grid-glow min-h-screen overflow-x-hidden px-4 pb-28 pt-6 md:px-8">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-cyan-500/90 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="mx-auto max-w-7xl">
        <header className="glass-soft mb-4 flex items-center justify-between rounded-[28px] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/40">Finance Tracker</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Calm Command Center</h1>
            {userEmail ? (
              <Link to="/settings" className="mt-2 inline-flex items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-white/5">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initials || "U"}
                  </div>
                )}
                <div className="min-w-0">
                  {displayName && displayName !== userEmail ? (
                    <p className="truncate text-xs text-white/70">{displayName}</p>
                  ) : null}
                  <p className="truncate text-[11px] text-white/50">{userEmail}</p>
                </div>
              </Link>
            ) : null}
          </div>

          <button
            onClick={clearAuth}
            className="rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/80 transition hover:bg-white/12"
          >
            Logout
          </button>
        </header>

        <NotificationBanner />

        <main id="main-content">
          <Outlet />
        </main>
      </div>

      {/* Desktop/Tablet quick actions */}
      <div className="fixed bottom-24 right-6 z-40 hidden flex-col gap-3 sm:flex">
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

      {/* Mobile quick action */}
      <Link
        to="/transactions"
        className="fixed bottom-24 right-5 z-40 inline-flex items-center justify-center rounded-full bg-cyan-500/90 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 sm:hidden"
      >
        + Add
      </Link>

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
