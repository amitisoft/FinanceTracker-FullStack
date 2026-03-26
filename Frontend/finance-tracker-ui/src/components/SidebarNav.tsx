import { NavLink } from "react-router-dom";
import clsx from "clsx";

type Props = {
  onNavigate?: () => void;
};

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/accounts", label: "Accounts" },
  { to: "/transactions", label: "Transactions" },
  { to: "/budgets", label: "Budgets" },
  { to: "/goals", label: "Goals" },
  { to: "/categories", label: "Categories" },
  { to: "/recurring", label: "Recurring" },
];

export default function SidebarNav({ onNavigate }: Props) {
  return (
    <nav className="flex h-full flex-col gap-3">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
          Finance Tracker
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Workspace</h1>
      </div>

      <div className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                "rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "border border-cyan-400/30 bg-cyan-500/20 text-white"
                  : "border border-white/8 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}