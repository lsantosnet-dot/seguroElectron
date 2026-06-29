import type { ReactNode } from "react";
import { initials } from "@shared/format";
import type {
  ClaimStatus,
  InstallmentStatus,
  PolicyStatus,
} from "@shared/types";
import {
  CLAIM_STATUS_LABEL,
  INSTALLMENT_STATUS_LABEL,
  POLICY_STATUS_LABEL,
} from "@shared/constants";

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-xl bg-accent-soft font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials(name)}
    </div>
  );
}

const TAG_STYLE: Record<string, string> = {
  vip: "badge-amber",
  atrasada: "badge-red",
  novo: "badge-blue",
};

export function Tag({ label }: { label: string }) {
  const cls = TAG_STYLE[label.toLowerCase()] ?? "badge-green";
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  const cls =
    status === "vigente"
      ? "badge-green"
      : status === "em_cotacao"
        ? "badge-blue"
        : status === "vencida"
          ? "badge-red"
          : "badge-gray";
  return <span className={`badge ${cls}`}>{POLICY_STATUS_LABEL[status]}</span>;
}

export function InstallmentStatusBadge({ status }: { status: InstallmentStatus }) {
  const cls =
    status === "paga"
      ? "badge-green"
      : status === "atrasada"
        ? "badge-red"
        : "badge-amber";
  return (
    <span className={`badge ${cls}`}>{INSTALLMENT_STATUS_LABEL[status]}</span>
  );
}

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const cls =
    status === "aprovado" || status === "pago"
      ? "badge-green"
      : status === "negado"
        ? "badge-red"
        : status === "em_analise"
          ? "badge-amber"
          : "badge-blue";
  return <span className={`badge ${cls}`}>{CLAIM_STATUS_LABEL[status]}</span>;
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/** Spinner simples para estados de carregamento de página. */
export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-20 text-faint">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  );
}
