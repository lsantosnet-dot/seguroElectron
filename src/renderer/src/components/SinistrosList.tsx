import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useRefresh } from "@/lib/data";
import { CLAIM_STATUS_LABEL } from "@shared/constants";
import { formatBRL, formatDate } from "@shared/format";
import type { ClaimStatus, ClaimWithClient } from "@shared/types";

const STATUSES: ClaimStatus[] = ["aberto", "em_analise", "aprovado", "negado", "pago"];

export function SinistrosList({ claims }: { claims: ClaimWithClient[] }) {
  const refresh = useRefresh();

  return (
    <div className="space-y-3">
      {claims.map((c) => (
        <div key={c.id} className="card flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{c.client.name}</p>
            <p className="truncate text-sm text-muted">
              {c.policy ? (
                <span className="capitalize">
                  {c.policy.type} · {c.policy.insurer}
                </span>
              ) : (
                "Sem apólice vinculada"
              )}
              {c.description ? ` — ${c.description}` : ""}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="num text-sm font-semibold">{formatBRL(c.amount)}</p>
            <p className="num text-xs text-faint">{formatDate(c.date)}</p>
          </div>
          <select
            className="input !w-auto !py-1.5 text-xs"
            value={c.status}
            onChange={async (e) => {
              await api.updateClaimStatus(c.id, e.target.value as ClaimStatus);
              refresh();
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {CLAIM_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <Link
            to={`/clientes/${c.client.id}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-panel-2 text-muted hover:text-text"
          >
            <ChevronRight size={15} />
          </Link>
        </div>
      ))}
    </div>
  );
}
