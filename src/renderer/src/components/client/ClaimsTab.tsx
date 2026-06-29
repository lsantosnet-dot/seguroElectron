import { useState } from "react";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useRefresh } from "@/lib/data";
import { CLAIM_STATUS_LABEL } from "@shared/constants";
import { ClaimStatusBadge, EmptyState } from "@/components/ui";
import { formatBRL, formatDate, todayISO } from "@shared/format";
import type { Claim, ClaimStatus, Policy } from "@shared/types";

const STATUSES: ClaimStatus[] = ["aberto", "em_analise", "aprovado", "negado", "pago"];

export function ClaimsTab({
  clientId,
  claims,
  policies,
}: {
  clientId: string;
  claims: Claim[];
  policies: Policy[];
}) {
  const refresh = useRefresh();
  const [pending, setPending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    policyId: "",
    amount: "",
    description: "",
    status: "aberto" as ClaimStatus,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await api.addClaim({
      clientId,
      policyId: form.policyId || null,
      date: form.date,
      amount: parseFloat(form.amount.replace(",", ".")) || 0,
      description: form.description,
      status: form.status,
    });
    setForm({ date: todayISO(), policyId: "", amount: "", description: "", status: "aberto" });
    setAdding(false);
    setPending(false);
    refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {!adding && (
          <button className="btn btn-ghost" onClick={() => setAdding(true)}>
            <Plus size={16} /> Registrar sinistro
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={submit} className="card mb-4 space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Data</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Apólice</label>
              <select
                className="input"
                value={form.policyId}
                onChange={(e) => setForm({ ...form, policyId: e.target.value })}
              >
                <option value="">—</option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.type} · {p.insurer}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input
                className="input"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input min-h-20"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary" disabled={pending}>
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Salvar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {claims.length === 0 && !adding ? (
        <EmptyState
          icon={<AlertTriangle size={24} />}
          title="Nenhum sinistro"
          description="O histórico de sinistros do cliente aparece aqui."
        />
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent">
                  <AlertTriangle size={16} />
                </span>
                <div>
                  <p className="num text-sm font-semibold">{formatDate(c.date)}</p>
                  <p className="num text-xs text-faint">{formatBRL(c.amount)}</p>
                </div>
                <select
                  className="input ml-auto !w-auto !py-1.5 text-xs"
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
              </div>
              {c.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{c.description}</p>
              )}
              <div className="mt-2">
                <ClaimStatusBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
