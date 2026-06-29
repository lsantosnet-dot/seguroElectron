import { Link } from "react-router-dom";
import { CalendarDays, Mail, ChevronRight, RefreshCw, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { useData } from "@/lib/data";
import { formatBRL, formatDate, dueLabel } from "@shared/format";
import { EmptyState, PageLoading } from "@/components/ui";
import type { AgendaItem } from "@shared/types";

const GROUPS: { key: string; label: string; test: (d: number) => boolean }[] = [
  { key: "atrasado", label: "Atrasado", test: (d) => d < 0 },
  { key: "hoje", label: "Hoje", test: (d) => d === 0 },
  { key: "semana", label: "Próximos 7 dias", test: (d) => d >= 1 && d <= 7 },
  { key: "mes", label: "Próximos 30 dias", test: (d) => d >= 8 && d <= 30 },
  { key: "depois", label: "Mais adiante", test: (d) => d > 30 },
];

export function AgendaPage() {
  const { data, loading } = useData<AgendaItem[]>(() => api.getAgenda(), []);
  if (loading || !data) return <PageLoading />;
  const items = data;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Agenda de vencimentos</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={26} />}
          title="Nada na agenda"
          description="Renovações de apólices e parcelas a vencer aparecem aqui."
        />
      ) : (
        <div className="space-y-7">
          {GROUPS.map((g) => {
            const groupItems = items.filter((i) => g.test(i.days));
            if (groupItems.length === 0) return null;
            return (
              <section key={g.key}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
                    {g.label}
                  </h2>
                  <span className="badge badge-gray">{groupItems.length}</span>
                </div>
                <div className="space-y-2.5">
                  {groupItems.map((item) => (
                    <Row key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ item }: { item: AgendaItem }) {
  const overdue = item.days < 0;
  const soon = item.days >= 0 && item.days <= 7;
  return (
    <div className="card flex items-center gap-3 p-4">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
          item.kind === "renovacao"
            ? "bg-accent-soft text-accent"
            : "bg-white/6 text-muted"
        }`}
      >
        {item.kind === "renovacao" ? <RefreshCw size={17} /> : <Receipt size={17} />}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium">{item.title}</p>
        <p className="truncate text-sm capitalize text-muted">{item.subtitle}</p>
      </div>
      <div className="ml-auto text-right">
        <p className="num text-sm font-semibold">{formatBRL(item.amount)}</p>
        <p className="num text-xs text-faint">{formatDate(item.date)}</p>
      </div>
      <span
        className={`badge ${overdue ? "badge-red" : soon ? "badge-amber" : "badge-green"}`}
      >
        {dueLabel(item.date)}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={item.mailHref}
          className="grid h-8 w-8 place-items-center rounded-lg bg-panel-2 text-muted hover:text-accent"
          title="Enviar lembrete por e-mail"
        >
          <Mail size={15} />
        </a>
        <Link
          to={`/clientes/${item.clientId}`}
          className="grid h-8 w-8 place-items-center rounded-lg bg-panel-2 text-muted hover:text-text"
        >
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
