import { useState } from "react";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import SidebarNav from "./SidebarNav";
import { authStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

type Props = {
  title?: string;
  children: ReactNode;
};

export default function AppShell({ title = "Finance Tracker", children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const clearAuth = authStore((s) => s.clearAuth);
  const navigate = useNavigate();

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="flex min-h-screen">
        {/* Desktop / tablet sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-white/5 p-6 lg:block">
          <div className="flex h-full flex-col justify-between">
            <SidebarNav />
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/20"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main section */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#07111f]/95 px-3 py-3 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <h1 className="text-base font-semibold text-white">{title}</h1>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
            >
              Logout
            </button>
          </header>

          {/* Mobile overlay */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] border-r border-white/10 bg-[#081321] p-5 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
                    Menu
                  </p>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex h-[calc(100%-56px)] flex-col justify-between">
                  <SidebarNav onNavigate={() => setMobileMenuOpen(false)} />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/20"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
