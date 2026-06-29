import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Mail,
  ChevronRight,
  CircleDot,
  Plus,
} from "lucide-react";
import type { DashboardData } from "@shared/types";
import {
  formatBRL,
  formatBRLCompact,
  formatDate,
  dueLabel,
  daysUntil,
} from "@shared/format";
import { DynIcon } from "@/components/DynIcon";
import { POLICY_TYPE_ICON } from "@shared/constants";
import { renewalMailto, installmentMailto } from "@shared/mail";
import { EmptyState } from "@/components/ui";

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent">
          {icon}
        </span>
      </div>
      <p className="num mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-1.5 text-xs text-faint">{hint}</p>
    </div>
  );
}

export function DashboardView({
  data,
  userName,
  dateLong,
  greetingText,
}: {
  data: DashboardData;
  userName: string;
  dateLong: string;
  greetingText: string;
}) {
  const [view, setView] = useState<"executivo" | "operacional">("executivo");
  const maxCommission = Math.max(1, ...data.commissionByMonth.map((m) => m.value));
  const goalPct =
    data.goalTarget > 0
      ? Math.min(100, Math.round((data.goalAchieved / data.goalTarget) * 100))
      : 0;

  if (data.isEmpty) {
    return (
      <>
        <Header
          dateLong={dateLong}
          greetingText={greetingText}
          userName={userName}
          view={view}
          setView={setView}
        />
        <EmptyState
          icon={<ShieldCheck size={26} />}
          title="Comece a sua carteira"
          description="Cadastre o seu primeiro cliente para explorar o app."
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/clientes/novo" className="btn btn-primary">
              <Plus size={16} /> Cadastrar cliente
            </Link>
          </div>
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <Header
        dateLong={dateLong}
        greetingText={greetingText}
        userName={userName}
        view={view}
        setView={setView}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={<Users size={16} />}
          label="Clientes ativos"
          value={String(data.clientCount)}
          hint={`+${data.newClientsThisMonth} este mês`}
        />
        <Kpi
          icon={<ShieldCheck size={16} />}
          label="Apólices vigentes"
          value={String(data.activePolicies)}
          hint={`${data.openQuotes} em cotação`}
        />
        <Kpi
          icon={<DollarSign size={16} />}
          label="Prêmio/ano"
          value={formatBRLCompact(data.premiumTotal)}
          hint="carteira total"
        />
        <Kpi
          icon={<TrendingUp size={16} />}
          label="Comissão est."
          value={formatBRLCompact(data.commissionEstimate)}
          hint={`meta ${goalPct}%`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <CircleDot size={14} className="text-warning" /> Seguros a vencer
            </h2>
            <span className="text-xs text-faint">próximos 30 dias</span>
          </div>
          {data.expiring.length === 0 ? (
            <p className="py-6 text-center text-sm text-faint">
              Nenhuma renovação no período. 🎉
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.expiring.slice(0, 5).map((p) => {
                const d = daysUntil(p.end_date);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl bg-surface p-3"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                      <DynIcon name={POLICY_TYPE_ICON[p.type]} size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.client.name}</p>
                      <p className="truncate text-xs text-muted capitalize">
                        {p.type} · {p.insurer}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <span
                        className={`badge ${d < 0 ? "badge-red" : d <= 15 ? "badge-amber" : "badge-green"}`}
                      >
                        {dueLabel(p.end_date)}
                      </span>
                      <p className="num mt-1 text-[0.7rem] text-faint">
                        {formatDate(p.end_date)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <a
                        href={renewalMailto({
                          clientName: p.client.name,
                          email: p.client.email,
                          type: p.type,
                          insurer: p.insurer,
                          endDate: p.end_date,
                        })}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-panel-2 text-muted hover:text-accent"
                        title="Enviar lembrete por e-mail"
                      >
                        <Mail size={15} />
                      </a>
                      <Link
                        to={`/clientes/${p.client.id}`}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-panel-2 text-muted hover:text-text"
                      >
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <CircleDot size={14} className="text-danger" /> Parcelas a cobrar
            </h2>
            <span className="text-xs text-faint">
              {data.pendingInstallments.length} pendentes
            </span>
          </div>
          {data.pendingInstallments.length === 0 ? (
            <p className="py-6 text-center text-sm text-faint">Tudo em dia. 🎉</p>
          ) : (
            <div className="space-y-2.5">
              {data.pendingInstallments.slice(0, 5).map((i) => {
                const overdue = daysUntil(i.due_date) < 0;
                return (
                  <div
                    key={i.id}
                    className="flex items-center gap-3 rounded-xl bg-surface p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {i.policy.client.name}
                      </p>
                      <p className="truncate text-xs text-muted capitalize">
                        {i.policy.type} · parcela {i.number} · {formatDate(i.due_date)}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="num text-sm font-semibold">{formatBRL(i.amount)}</p>
                      <span
                        className={`badge ${overdue ? "badge-red" : "badge-amber"} mt-0.5`}
                      >
                        {overdue
                          ? `Atrasada ${Math.abs(daysUntil(i.due_date))}d`
                          : dueLabel(i.due_date)}
                      </span>
                    </div>
                    <a
                      href={installmentMailto({
                        clientName: i.policy.client.name,
                        email: i.policy.client.email,
                        number: i.number,
                        amount: i.amount,
                        dueDate: i.due_date,
                      })}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-panel-2 text-muted hover:text-accent"
                      title="Enviar lembrete por e-mail"
                    >
                      <Mail size={15} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {view === "executivo" && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Comissão por mês</h2>
              <span className="num text-sm font-semibold text-accent">
                {formatBRLCompact(
                  data.commissionByMonth.reduce((s, m) => s + m.value, 0),
                )}
              </span>
            </div>
            <div className="flex h-40 items-end justify-between gap-3">
              {data.commissionByMonth.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-accent/80 transition-all"
                      style={{
                        height: `${Math.max(3, (m.value / maxCommission) * 100)}%`,
                      }}
                      title={formatBRL(m.value)}
                    />
                  </div>
                  <span className="text-[0.7rem] capitalize text-faint">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card flex flex-col justify-between p-5">
            <h2 className="font-semibold">Meta do mês</h2>
            <div className="my-4 text-center">
              <p className="num text-4xl font-bold text-accent">{goalPct}%</p>
              <p className="num mt-1 text-sm text-muted">
                {formatBRL(data.goalAchieved)} de {formatBRL(data.goalTarget)}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Header({
  dateLong,
  greetingText,
  userName,
  view,
  setView,
}: {
  dateLong: string;
  greetingText: string;
  userName: string;
  view: "executivo" | "operacional";
  setView: (v: "executivo" | "operacional") => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-faint">
          {dateLong}
        </p>
        <h1 className="mt-1 text-3xl font-bold">
          {greetingText}, {userName} 👋
        </h1>
      </div>
      <div className="flex rounded-xl bg-surface p-1">
        {(["executivo", "operacional"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              view === v ? "bg-accent-soft text-accent" : "text-muted"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
