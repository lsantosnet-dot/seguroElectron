import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  CalendarDays,
  AlertTriangle,
  Database,
  ShieldCheck,
  Plus,
  Menu,
  X,
  Lock,
} from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { UpdateBanner } from "./UpdateBanner";
import { ThemeToggle } from "./ThemeToggle";
import { formatBRLCompact } from "@shared/format";
import { useData } from "@/lib/data";
import { api } from "@/lib/api";
import type { ShellData } from "@shared/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, countKey: "agenda" },
  { href: "/sinistros", label: "Sinistros", icon: AlertTriangle, countKey: "sinistros" },
  { href: "/backup", label: "Backup", icon: Database },
] as const;

export function AppShell({ onLock }: { onLock: () => void }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data } = useData<ShellData>(() => api.getShellData(), []);

  const counts = { agenda: data?.agenda ?? 0, sinistros: data?.sinistros ?? 0 };
  const meta = data?.meta ?? { achieved: 0, target: 12000 };
  const pct =
    meta.target > 0
      ? Math.min(100, Math.round((meta.achieved / meta.target) * 100))
      : 0;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
          <ShieldCheck size={22} />
        </div>
        <div>
          <p className="font-semibold leading-none">Apólice</p>
          <p className="mt-1 text-[0.62rem] uppercase tracking-[0.12em] text-faint">
            Gestão de seguros
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/");
          const count =
            "countKey" in item
              ? counts[item.countKey as keyof typeof counts]
              : 0;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-surface hover:text-text"
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {count > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${
                    active ? "bg-accent/20" : "bg-white/8 text-muted"
                  }`}
                >
                  {count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <Link to="/dashboard" className="mx-3 mb-3 block rounded-xl bg-surface p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-faint uppercase tracking-wide">Meta do mês</span>
          <span className="num font-semibold text-accent">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <div className="num mt-2 text-[0.7rem] text-faint">
          {formatBRLCompact(meta.achieved)} / {formatBRLCompact(meta.target)}
        </div>
      </Link>

      <div className="flex items-center gap-3 border-t border-border px-5 py-4">
        <button
          onClick={onLock}
          className="grid h-9 w-9 place-items-center rounded-lg bg-panel-2 text-muted hover:text-accent"
          title="Bloquear aplicativo"
        >
          <Lock size={16} />
        </button>
        <div className="text-sm">
          <p className="font-medium leading-none">Minha conta</p>
          <p className="mt-1 text-xs text-faint">Corretor · SUSEP</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-surface">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 text-muted"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-bg/85 px-4 py-3 backdrop-blur sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link to="/clientes/novo" className="btn btn-ghost hidden sm:inline-flex">
              <Plus size={16} /> Cliente
            </Link>
            <Link to="/cotacoes/nova" className="btn btn-primary hidden sm:inline-flex">
              <Plus size={16} /> Nova cotação
            </Link>
          </div>
        </header>

        <UpdateBanner />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
