import { useState } from "react";
import { Plus, Mail, ChevronDown, ShieldCheck } from "lucide-react";
import { DynIcon } from "@/components/DynIcon";
import { PolicyStatusBadge, EmptyState } from "@/components/ui";
import { InstallmentsList } from "./InstallmentsList";
import { AddPolicyForm } from "./AddPolicyForm";
import {
  PAYMENT_METHOD_LABEL,
  POLICY_TYPE_ICON,
  POLICY_TYPE_LABEL,
} from "@shared/constants";
import {
  formatBRL,
  formatDate,
  daysUntil,
  effectiveInstallmentStatus,
} from "@shared/format";
import { renewalMailto } from "@shared/mail";
import type { Client, Installment, Policy } from "@shared/types";

export function PoliciesTab({
  client,
  policies,
  installmentsByPolicy,
}: {
  client: Client;
  policies: Policy[];
  installmentsByPolicy: Record<string, Installment[]>;
}) {
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {!adding && (
          <button className="btn btn-ghost" onClick={() => setAdding(true)}>
            <Plus size={16} /> Nova apólice
          </button>
        )}
      </div>

      {adding && <AddPolicyForm clientId={client.id} onDone={() => setAdding(false)} />}

      {policies.length === 0 && !adding ? (
        <EmptyState
          icon={<ShieldCheck size={24} />}
          title="Nenhuma apólice"
          description="Adicione uma apólice avulsa ou oficialize uma cotação."
        />
      ) : (
        <div className="space-y-3">
          {policies.map((p) => {
            const insts = installmentsByPolicy[p.id] ?? [];
            const paidCount = insts.filter(
              (i) => effectiveInstallmentStatus(i) === "paga",
            ).length;
            const d = daysUntil(p.end_date);
            const soon = p.status === "vigente" && d >= 0 && d <= 30;
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                    <DynIcon name={POLICY_TYPE_ICON[p.type]} size={19} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{POLICY_TYPE_LABEL[p.type]}</span>
                      {soon ? (
                        <span className="badge badge-amber">Vence em breve</span>
                      ) : (
                        <PolicyStatusBadge status={p.status} />
                      )}
                    </div>
                    <p className="truncate text-sm text-muted">
                      {p.insurer}
                      {p.policy_number ? ` · Apólice ${p.policy_number}` : ""}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="num text-lg font-bold">{formatBRL(p.premium)}</p>
                    <p className="text-xs capitalize text-faint">
                      {p.payment_method ? PAYMENT_METHOD_LABEL[p.payment_method] : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
                  <div className="flex gap-6">
                    <Field label="Início" value={formatDate(p.start_date)} />
                    <Field
                      label="Vencimento"
                      value={formatDate(p.end_date)}
                      highlight={soon || d < 0}
                    />
                    <Field
                      label="Parcelas"
                      value={`${paidCount}/${insts.length || p.installments_count} pagas`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={renewalMailto({
                        clientName: client.name,
                        email: client.email,
                        type: p.type,
                        insurer: p.insurer,
                        endDate: p.end_date,
                      })}
                      className="btn btn-soft !py-1.5 !text-xs"
                    >
                      <Mail size={14} /> Renovação
                    </a>
                    <button
                      className="btn btn-ghost !py-1.5 !text-xs"
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    >
                      Ver parcelas
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${expanded === p.id ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                </div>

                {expanded === p.id && (
                  <InstallmentsList
                    installments={insts}
                    clientName={client.name}
                    clientEmail={client.email}
                    insurer={p.insurer}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-wide text-faint">{label}</p>
      <p className={`num text-sm ${highlight ? "text-warning" : ""}`}>{value}</p>
    </div>
  );
}
