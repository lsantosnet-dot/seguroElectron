// Tipos do domínio — espelham as tabelas SQLite (src/main/db.ts)

export type PolicyType =
  | "auto"
  | "residencial"
  | "vida"
  | "empresarial"
  | "saude"
  | "viagem"
  | "outros";

export type PolicyStatus = "vigente" | "em_cotacao" | "vencida" | "cancelada";
export type QuoteStatus = "aberta" | "oficializada" | "descartada";
export type InstallmentStatus = "pendente" | "paga" | "atrasada";
export type ClaimStatus = "aberto" | "em_analise" | "aprovado" | "negado" | "pago";
export type PaymentMethod = "boleto" | "cartao" | "debito" | "pix" | "avista";
export type Channel = "ligacao" | "whatsapp" | "email" | "presencial" | "outros";
export type DocCategory =
  | "cnh"
  | "doc_veiculo"
  | "rg"
  | "contrato"
  | "apolice"
  | "outros";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  city: string | null;
  state: string | null;
  birthdate: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export interface Policy {
  id: string;
  client_id: string;
  type: PolicyType;
  insurer: string;
  policy_number: string | null;
  premium: number;
  commission_rate: number;
  payment_method: PaymentMethod | null;
  installments_count: number;
  start_date: string | null;
  end_date: string | null;
  status: PolicyStatus;
  notes: string | null;
  created_at: string;
}

export interface Quote {
  id: string;
  client_id: string;
  type: PolicyType;
  status: QuoteStatus;
  policy_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface QuoteOption {
  id: string;
  quote_id: string;
  insurer: string;
  premium: number;
  coverage: string | null;
  installments_count: number;
  payment_method: PaymentMethod | null;
  pdf_url: string | null;
  pdf_path: string | null;
  pdf_name: string | null;
  is_best: boolean;
  chosen: boolean;
  created_at: string;
}

export interface Installment {
  id: string;
  policy_id: string;
  number: number;
  amount: number;
  due_date: string;
  status: InstallmentStatus;
  paid_at: string | null;
  created_at: string;
}

export interface Claim {
  id: string;
  client_id: string;
  policy_id: string | null;
  date: string;
  description: string | null;
  amount: number;
  status: ClaimStatus;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  client_id: string;
  name: string;
  category: DocCategory | null;
  file_url: string | null;
  file_path: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Comment {
  id: string;
  client_id: string;
  channel: Channel;
  body: string;
  created_at: string;
}

export interface Goal {
  id: string;
  month: string;
  target: number;
  created_at: string;
}

// Cliente enriquecido com agregados para listagens
export interface ClientWithStats extends Client {
  policy_count: number;
  premium_total: number;
}

// ---------------------------------------------------------------------------
// Tipos de agregação (dashboard / agenda / busca) — espelham data.ts
// ---------------------------------------------------------------------------
export type ExpiringPolicy = Policy & {
  client: Pick<Client, "id" | "name" | "email">;
};

export type PendingInstallment = Installment & {
  policy: Pick<Policy, "id" | "type" | "insurer"> & {
    client: Pick<Client, "id" | "name" | "email">;
  };
};

export interface DashboardData {
  clientCount: number;
  newClientsThisMonth: number;
  activePolicies: number;
  openQuotes: number;
  premiumTotal: number;
  commissionEstimate: number;
  expiring: ExpiringPolicy[];
  pendingInstallments: PendingInstallment[];
  commissionByMonth: { month: string; label: string; value: number }[];
  goalTarget: number;
  goalAchieved: number;
  isEmpty: boolean;
}

export interface ShellData {
  agenda: number;
  sinistros: number;
  meta: { achieved: number; target: number };
}

export interface AgendaItem {
  id: string;
  kind: "renovacao" | "parcela";
  title: string;
  subtitle: string;
  date: string;
  days: number;
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  amount: number;
  mailHref: string;
}

export type ClaimWithClient = Claim & {
  client: Pick<Client, "id" | "name">;
  policy: Pick<Policy, "type" | "insurer"> | null;
};

export interface SearchResult {
  type: "cliente" | "apolice";
  id: string;
  href: string;
  title: string;
  subtitle: string;
}

export type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };
