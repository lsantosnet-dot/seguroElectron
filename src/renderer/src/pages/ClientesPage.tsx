import { Link } from "react-router-dom";
import { Plus, Users, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useData } from "@/lib/data";
import { formatBRLCompact } from "@shared/format";
import { Avatar, Tag, EmptyState, PageLoading } from "@/components/ui";
import type { ClientWithStats } from "@shared/types";

export function ClientesPage() {
  const { data, loading } = useData<ClientWithStats[]>(
    () => api.getClientsWithStats(),
    [],
  );
  if (loading || !data) return <PageLoading />;
  const clients = data;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Clientes <span className="text-muted">({clients.length})</span>
        </h1>
        <Link to="/clientes/novo" className="btn btn-primary">
          <Plus size={16} /> Novo cliente
        </Link>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users size={26} />}
          title="Nenhum cliente ainda"
          description="Cadastre o seu primeiro cliente."
        >
          <Link to="/clientes/novo" className="btn btn-primary">
            <Plus size={16} /> Cadastrar cliente
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {clients.map((c) => (
            <Link
              key={c.id}
              to={`/clientes/${c.id}`}
              className="card group p-5 transition-colors hover:border-border-strong"
            >
              <div className="flex items-center gap-3">
                <Avatar name={c.name} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="truncate text-sm text-muted">
                    {[c.city, c.state].filter(Boolean).join("/") || "—"}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="ml-auto text-faint transition-transform group-hover:translate-x-0.5"
                />
              </div>

              {c.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <Tag key={t} label={t} />
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
                <div>
                  <p className="num text-xl font-bold">{c.policy_count}</p>
                  <p className="text-xs text-faint">apólices</p>
                </div>
                <div className="text-right">
                  <p className="num text-xl font-bold text-accent">
                    {formatBRLCompact(c.premium_total)}
                  </p>
                  <p className="text-xs text-faint">prêmio/ano</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
