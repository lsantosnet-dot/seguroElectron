import type {
  ActionResult,
  AgendaItem,
  Claim,
  ClaimStatus,
  ClaimWithClient,
  Channel,
  Client,
  ClientWithStats,
  Comment,
  DashboardData,
  DocCategory,
  DocumentRow,
  Goal,
  Installment,
  PaymentMethod,
  Policy,
  PolicyType,
  Quote,
  QuoteOption,
  SearchResult,
  ShellData,
} from "@shared/types";

export interface FilePayload {
  name: string;
  size: number;
  data: Uint8Array;
}

export type UpdaterStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available"; version: string }
  | { state: "none" }
  | { state: "offline" }
  | { state: "downloading"; percent: number }
  | { state: "downloaded"; version: string }
  | { state: "error"; message: string };

export interface Api {
  getClientsWithStats(): Promise<ClientWithStats[]>;
  getClientsList(): Promise<Pick<Client, "id" | "name">[]>;
  getClient(id: string): Promise<Client | null>;
  getClientPolicies(clientId: string): Promise<Policy[]>;
  getClientQuotes(
    clientId: string,
  ): Promise<(Quote & { options: QuoteOption[] })[]>;
  getClientClaims(clientId: string): Promise<Claim[]>;
  getClientDocuments(clientId: string): Promise<DocumentRow[]>;
  getClientComments(clientId: string): Promise<Comment[]>;
  getClientInstallments(clientId: string): Promise<Record<string, Installment[]>>;
  getPolicyInstallments(policyId: string): Promise<Installment[]>;
  getQuote(
    id: string,
  ): Promise<(Quote & { options: QuoteOption[]; client: Client }) | null>;
  getDashboardData(): Promise<DashboardData>;
  getShellData(): Promise<ShellData>;
  getAgenda(): Promise<AgendaItem[]>;
  getAllClaims(): Promise<ClaimWithClient[]>;
  search(q: string): Promise<SearchResult[]>;

  createClient(input: {
    name: string;
    email?: string | null;
    phone?: string | null;
    cpf?: string | null;
    city?: string | null;
    state?: string | null;
    birthdate?: string | null;
    tags?: string[];
    notes?: string | null;
  }): Promise<ActionResult<{ id: string }>>;
  updateClient(
    id: string,
    input: Partial<Omit<Client, "id" | "created_at">>,
  ): Promise<ActionResult>;
  deleteClient(id: string): Promise<ActionResult>;
  addComment(clientId: string, channel: Channel, body: string): Promise<ActionResult>;
  deleteComment(id: string): Promise<ActionResult>;
  addClaim(input: {
    clientId: string;
    policyId?: string | null;
    date: string;
    description: string;
    amount: number;
    status?: ClaimStatus;
  }): Promise<ActionResult>;
  updateClaimStatus(id: string, status: ClaimStatus): Promise<ActionResult>;
  uploadDocument(
    clientId: string,
    category: DocCategory,
    file: FilePayload,
  ): Promise<ActionResult>;
  deleteDocument(id: string): Promise<ActionResult>;
  togglePaidInstallment(id: string, paid: boolean): Promise<ActionResult>;
  createQuote(input: {
    clientId: string;
    type: PolicyType;
    notes?: string | null;
  }): Promise<ActionResult<{ id: string }>>;
  addQuoteOption(
    quoteId: string,
    input: {
      insurer: string;
      premium: number;
      coverage?: string | null;
      installments_count: number;
      payment_method?: PaymentMethod | null;
      pdf?: FilePayload | null;
    },
  ): Promise<ActionResult<{ option: QuoteOption }>>;
  markBestOption(quoteId: string, optionId: string): Promise<ActionResult>;
  deleteQuoteOption(optionId: string): Promise<ActionResult>;
  deleteQuote(quoteId: string): Promise<ActionResult>;
  officializeQuote(input: {
    quoteId: string;
    optionId: string;
    policyNumber?: string | null;
    paymentMethod: PaymentMethod;
    installmentsCount: number;
    startDate: string;
    endDate?: string | null;
    firstDueDate?: string | null;
    commissionRate?: number;
  }): Promise<ActionResult<{ clientId: string; policyId: string }>>;
  createPolicy(input: {
    clientId: string;
    type: PolicyType;
    insurer: string;
    policyNumber?: string | null;
    premium: number;
    commissionRate?: number;
    paymentMethod: PaymentMethod;
    installmentsCount: number;
    startDate: string;
    endDate?: string | null;
    generateInstallments?: boolean;
  }): Promise<ActionResult>;
  setGoal(month: string, target: number): Promise<ActionResult>;
  importBundle(
    json: string,
  ): Promise<ActionResult<{ counts: Record<string, number> }>>;

  getAppVersion(): Promise<string>;
  exportBackup(): Promise<{ ok: boolean; path?: string; canceled?: boolean }>;
  openFile(path: string): Promise<{ ok: boolean; error?: string }>;

  auth: {
    has(): Promise<boolean>;
    verify(pin: string): Promise<boolean>;
    set(pin: string): Promise<{ ok: boolean; error?: string }>;
    change(current: string, next: string): Promise<{ ok: boolean; error?: string }>;
  };

  updater: {
    check(): Promise<{ ok: boolean; reason?: string }>;
    download(): Promise<void>;
    install(): Promise<void>;
    getStatus(): Promise<UpdaterStatus>;
    onStatus(cb: (payload: UpdaterStatus) => void): () => void;
  };
}

declare global {
  interface Window {
    api: Api;
  }
}
