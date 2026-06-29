// ===========================================================================
// Repositório de dados — porte de src/lib/data.ts + src/lib/actions.ts do
// projeto original, agora sobre SQLite (better-sqlite3) e sem owner_id.
// Todas as funções são síncronas (better-sqlite3 é síncrono).
// ===========================================================================
import { getDb, newId, nowISO } from "./db";
import { saveFile, removeFile } from "./storage";
import {
  daysUntil,
  monthKey,
  parseISO,
  addMonthsISO,
  addYearsISO,
  todayISO,
} from "@shared/format";
import { RENEWAL_WINDOW_DAYS } from "@shared/constants";
import { renewalMailto, installmentMailto } from "@shared/mail";
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
  ExpiringPolicy,
  Goal,
  Installment,
  PaymentMethod,
  PendingInstallment,
  Policy,
  PolicyType,
  Quote,
  QuoteOption,
  SearchResult,
  SearchResult as TSearchResult,
  ShellData,
} from "@shared/types";

// ---------------------------------------------------------------------------
// Mapeadores de linha (SQLite -> tipos do domínio)
// ---------------------------------------------------------------------------
function mapClient(r: any): Client {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    cpf: r.cpf,
    city: r.city,
    state: r.state,
    birthdate: r.birthdate,
    tags: r.tags ? safeJsonArray(r.tags) : [],
    notes: r.notes,
    created_at: r.created_at,
  };
}
function safeJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function mapPolicy(r: any): Policy {
  return { ...r } as Policy;
}
function mapOption(r: any): QuoteOption {
  return {
    ...r,
    is_best: !!r.is_best,
    chosen: !!r.chosen,
  } as QuoteOption;
}

const FILE_PROTOCOL = "apolice-file://";

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------
export function getClientsWithStats(): ClientWithStats[] {
  const db = getDb();
  const clients = db.prepare("SELECT * FROM clients ORDER BY name").all();
  const policies = db
    .prepare("SELECT client_id, premium, status FROM policies")
    .all() as { client_id: string; premium: number; status: string }[];

  const stats = new Map<string, { count: number; premium: number }>();
  for (const p of policies) {
    if (p.status === "cancelada") continue;
    const s = stats.get(p.client_id) ?? { count: 0, premium: 0 };
    s.count += 1;
    s.premium += Number(p.premium);
    stats.set(p.client_id, s);
  }

  return clients.map((c: any) => ({
    ...mapClient(c),
    policy_count: stats.get(c.id)?.count ?? 0,
    premium_total: stats.get(c.id)?.premium ?? 0,
  }));
}

export function getClientsList(): Pick<Client, "id" | "name">[] {
  return getDb()
    .prepare("SELECT id, name FROM clients ORDER BY name")
    .all() as Pick<Client, "id" | "name">[];
}

export function getClient(id: string): Client | null {
  const r = getDb().prepare("SELECT * FROM clients WHERE id = ?").get(id);
  return r ? mapClient(r) : null;
}

export function getClientPolicies(clientId: string): Policy[] {
  return getDb()
    .prepare(
      "SELECT * FROM policies WHERE client_id = ? ORDER BY created_at DESC",
    )
    .all(clientId)
    .map(mapPolicy);
}

export function getClientQuotes(
  clientId: string,
): (Quote & { options: QuoteOption[] })[] {
  const db = getDb();
  const quotes = db
    .prepare(
      "SELECT * FROM quotes WHERE client_id = ? ORDER BY created_at DESC",
    )
    .all(clientId) as Quote[];
  const optStmt = db.prepare(
    "SELECT * FROM quote_options WHERE quote_id = ? ORDER BY created_at",
  );
  return quotes.map((q) => ({
    ...q,
    options: optStmt.all(q.id).map(mapOption),
  }));
}

export function getClientClaims(clientId: string): Claim[] {
  return getDb()
    .prepare("SELECT * FROM claims WHERE client_id = ? ORDER BY date DESC")
    .all(clientId) as Claim[];
}

export function getClientDocuments(clientId: string): DocumentRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM documents WHERE client_id = ? ORDER BY created_at DESC",
    )
    .all(clientId) as DocumentRow[];
}

export function getClientComments(clientId: string): Comment[] {
  return getDb()
    .prepare(
      "SELECT * FROM comments WHERE client_id = ? ORDER BY created_at DESC",
    )
    .all(clientId) as Comment[];
}

export function getClientInstallments(
  clientId: string,
): Record<string, Installment[]> {
  const db = getDb();
  const policies = db
    .prepare("SELECT id FROM policies WHERE client_id = ?")
    .all(clientId) as { id: string }[];
  const grouped: Record<string, Installment[]> = {};
  if (policies.length === 0) return grouped;
  const stmt = db.prepare(
    "SELECT * FROM installments WHERE policy_id = ? ORDER BY number",
  );
  for (const p of policies) {
    grouped[p.id] = stmt.all(p.id) as Installment[];
  }
  // só mantém grupos com parcelas, igual ao original (que agrupa o que existe)
  for (const k of Object.keys(grouped)) {
    if (grouped[k].length === 0) delete grouped[k];
  }
  return grouped;
}

export function getPolicyInstallments(policyId: string): Installment[] {
  return getDb()
    .prepare("SELECT * FROM installments WHERE policy_id = ? ORDER BY number")
    .all(policyId) as Installment[];
}

// ---------------------------------------------------------------------------
// Cotações
// ---------------------------------------------------------------------------
export function getQuote(
  id: string,
): (Quote & { options: QuoteOption[]; client: Client }) | null {
  const db = getDb();
  const q = db.prepare("SELECT * FROM quotes WHERE id = ?").get(id) as
    | Quote
    | undefined;
  if (!q) return null;
  const client = getClient(q.client_id);
  if (!client) return null;
  const options = db
    .prepare("SELECT * FROM quote_options WHERE quote_id = ? ORDER BY created_at")
    .all(id)
    .map(mapOption);
  return { ...q, options, client };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
const MONTH_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function getDashboardData(): DashboardData {
  const db = getDb();
  const clients = db
    .prepare("SELECT id, created_at FROM clients")
    .all() as { id: string; created_at: string }[];

  const policies = (
    db.prepare("SELECT * FROM policies").all() as Policy[]
  ).map((p) => ({
    ...p,
    client: getClientMini(p.client_id),
  })) as ExpiringPolicy[];

  const quotes = db.prepare("SELECT id, status FROM quotes").all() as {
    id: string;
    status: string;
  }[];

  const installments = (
    db
      .prepare("SELECT * FROM installments WHERE status != 'paga'")
      .all() as Installment[]
  )
    .map((i) => {
      const policy = db
        .prepare("SELECT id, type, insurer, client_id FROM policies WHERE id = ?")
        .get(i.policy_id) as
        | { id: string; type: string; insurer: string; client_id: string }
        | undefined;
      if (!policy) return null;
      return {
        ...i,
        policy: {
          id: policy.id,
          type: policy.type,
          insurer: policy.insurer,
          client: getClientMini(policy.client_id),
        },
      };
    })
    .filter(Boolean) as PendingInstallment[];

  const goal = db
    .prepare("SELECT * FROM goals WHERE month = ?")
    .get(monthKey()) as Goal | undefined;

  const thisMonth = monthKey();
  const newClientsThisMonth = clients.filter(
    (c) => monthKey(new Date(c.created_at)) === thisMonth,
  ).length;

  const active = policies.filter((p) => p.status === "vigente");
  const premiumTotal = active.reduce((s, p) => s + Number(p.premium), 0);
  const commissionEstimate = active.reduce(
    (s, p) => s + (Number(p.premium) * Number(p.commission_rate)) / 100,
    0,
  );

  const expiring = active
    .filter((p) => p.end_date && daysUntil(p.end_date) <= RENEWAL_WINDOW_DAYS)
    .sort((a, b) => daysUntil(a.end_date) - daysUntil(b.end_date));

  const pendingInstallments = installments.sort(
    (a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime(),
  );

  const byMonth = new Map<string, number>();
  for (const p of active) {
    if (!p.start_date) continue;
    const key = p.start_date.slice(0, 7);
    const commission = (Number(p.premium) * Number(p.commission_rate)) / 100;
    byMonth.set(key, (byMonth.get(key) ?? 0) + commission);
  }
  const commissionByMonth: DashboardData["commissionByMonth"] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    commissionByMonth.push({
      month: key,
      label: MONTH_SHORT[d.getMonth()],
      value: byMonth.get(key) ?? 0,
    });
  }

  const goalAchieved = byMonth.get(thisMonth) ?? 0;
  const goalTarget = goal ? Number(goal.target) : 12000;

  return {
    clientCount: clients.length,
    newClientsThisMonth,
    activePolicies: active.length,
    openQuotes: quotes.filter((q) => q.status === "aberta").length,
    premiumTotal,
    commissionEstimate,
    expiring,
    pendingInstallments,
    commissionByMonth,
    goalTarget,
    goalAchieved,
    isEmpty: clients.length === 0,
  };
}

function getClientMini(id: string): Pick<Client, "id" | "name" | "email"> {
  const r = getDb()
    .prepare("SELECT id, name, email FROM clients WHERE id = ?")
    .get(id) as Pick<Client, "id" | "name" | "email"> | undefined;
  return r ?? { id, name: "—", email: null };
}

// ---------------------------------------------------------------------------
// Shell (sidebar): contadores + meta do mês
// ---------------------------------------------------------------------------
export function getShellData(): ShellData {
  const db = getDb();
  const policies = db
    .prepare(
      "SELECT end_date, status, premium, commission_rate, start_date FROM policies WHERE status = 'vigente'",
    )
    .all() as {
    end_date: string | null;
    premium: number;
    commission_rate: number;
    start_date: string | null;
  }[];

  const expiring = policies.filter(
    (p) => p.end_date && daysUntil(p.end_date) <= RENEWAL_WINDOW_DAYS,
  ).length;

  const pendingInstallments = (
    db
      .prepare("SELECT COUNT(*) AS n FROM installments WHERE status != 'paga'")
      .get() as { n: number }
  ).n;

  const claimsCount = (
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM claims WHERE status IN ('aberto','em_analise','aprovado')",
      )
      .get() as { n: number }
  ).n;

  const goal = db
    .prepare("SELECT target FROM goals WHERE month = ?")
    .get(monthKey()) as { target: number } | undefined;

  const thisMonth = monthKey();
  const achieved = policies
    .filter((p) => p.start_date && p.start_date.slice(0, 7) === thisMonth)
    .reduce(
      (s, p) => s + (Number(p.premium) * Number(p.commission_rate)) / 100,
      0,
    );

  return {
    agenda: expiring + pendingInstallments,
    sinistros: claimsCount,
    meta: { achieved, target: goal ? Number(goal.target) : 12000 },
  };
}

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------
export function getAgenda(): AgendaItem[] {
  const db = getDb();
  const items: AgendaItem[] = [];

  const policies = db
    .prepare(
      "SELECT * FROM policies WHERE status = 'vigente' AND end_date IS NOT NULL",
    )
    .all() as Policy[];
  for (const p of policies) {
    const client = getClientMini(p.client_id);
    items.push({
      id: `pol-${p.id}`,
      kind: "renovacao",
      title: client.name,
      subtitle: `Renovação ${p.type} • ${p.insurer}`,
      date: p.end_date!,
      days: daysUntil(p.end_date),
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      amount: Number(p.premium),
      mailHref: renewalMailto({
        clientName: client.name,
        email: client.email,
        type: p.type,
        insurer: p.insurer,
        endDate: p.end_date,
      }),
    });
  }

  const installments = db
    .prepare("SELECT * FROM installments WHERE status != 'paga'")
    .all() as Installment[];
  for (const i of installments) {
    const policy = db
      .prepare("SELECT id, type, insurer, client_id FROM policies WHERE id = ?")
      .get(i.policy_id) as
      | { id: string; type: string; insurer: string; client_id: string }
      | undefined;
    if (!policy) continue;
    const client = getClientMini(policy.client_id);
    items.push({
      id: `inst-${i.id}`,
      kind: "parcela",
      title: client.name,
      subtitle: `Parcela ${i.number} • ${policy.type} ${policy.insurer}`,
      date: i.due_date,
      days: daysUntil(i.due_date),
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      amount: Number(i.amount),
      mailHref: installmentMailto({
        clientName: client.name,
        email: client.email,
        number: i.number,
        amount: Number(i.amount),
        dueDate: i.due_date,
        insurer: policy.insurer,
      }),
    });
  }

  return items.sort((a, b) => a.days - b.days);
}

// ---------------------------------------------------------------------------
// Sinistros (todos)
// ---------------------------------------------------------------------------
export function getAllClaims(): ClaimWithClient[] {
  const db = getDb();
  const claims = db
    .prepare("SELECT * FROM claims ORDER BY date DESC")
    .all() as Claim[];
  return claims.map((c) => {
    const client = (db
      .prepare("SELECT id, name FROM clients WHERE id = ?")
      .get(c.client_id) as Pick<Client, "id" | "name"> | undefined) ?? {
      id: c.client_id,
      name: "—",
    };
    const policy = c.policy_id
      ? (db
          .prepare("SELECT type, insurer FROM policies WHERE id = ?")
          .get(c.policy_id) as Pick<Policy, "type" | "insurer"> | undefined) ??
        null
      : null;
    return { ...c, client, policy };
  });
}

// ---------------------------------------------------------------------------
// Busca global
// ---------------------------------------------------------------------------
export function search(q: string): SearchResult[] {
  const term = q.trim();
  if (!term) return [];
  const like = `%${term}%`;
  const db = getDb();
  const results: TSearchResult[] = [];

  const clients = db
    .prepare(
      `SELECT id, name, city, state FROM clients
       WHERE name LIKE ? COLLATE NOCASE OR email LIKE ? COLLATE NOCASE OR cpf LIKE ? COLLATE NOCASE
       LIMIT 8`,
    )
    .all(like, like, like) as {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
  }[];
  for (const c of clients) {
    results.push({
      type: "cliente",
      id: c.id,
      href: `/clientes/${c.id}`,
      title: c.name,
      subtitle: [c.city, c.state].filter(Boolean).join("/") || "Cliente",
    });
  }

  const policies = db
    .prepare(
      `SELECT id, client_id, type, insurer, policy_number FROM policies
       WHERE insurer LIKE ? COLLATE NOCASE OR policy_number LIKE ? COLLATE NOCASE
       LIMIT 8`,
    )
    .all(like, like) as {
    id: string;
    client_id: string;
    type: string;
    insurer: string;
  }[];
  for (const p of policies) {
    const client = db
      .prepare("SELECT name FROM clients WHERE id = ?")
      .get(p.client_id) as { name: string } | undefined;
    results.push({
      type: "apolice",
      id: p.id,
      href: `/clientes/${p.client_id}`,
      title: `${p.insurer} • ${p.type}`,
      subtitle: client?.name ?? "Apólice",
    });
  }
  return results;
}

// ===========================================================================
// MUTAÇÕES
// ===========================================================================
function clean(v: unknown): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}

// ---- Clientes ----
export function createClient(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  city?: string | null;
  state?: string | null;
  birthdate?: string | null;
  tags?: string[];
  notes?: string | null;
}): ActionResult<{ id: string }> {
  if (!input.name?.trim()) return { ok: false, error: "Nome é obrigatório" };
  const id = newId();
  getDb()
    .prepare(
      `INSERT INTO clients (id, name, email, phone, cpf, city, state, birthdate, tags, notes, created_at)
       VALUES (@id, @name, @email, @phone, @cpf, @city, @state, @birthdate, @tags, @notes, @created_at)`,
    )
    .run({
      id,
      name: input.name.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      cpf: input.cpf ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      birthdate: input.birthdate || null,
      tags: JSON.stringify(input.tags ?? []),
      notes: input.notes ?? null,
      created_at: nowISO(),
    });
  return { ok: true, id };
}

export function updateClient(
  id: string,
  input: Partial<{
    name: string;
    email: string | null;
    phone: string | null;
    cpf: string | null;
    city: string | null;
    state: string | null;
    birthdate: string | null;
    tags: string[];
    notes: string | null;
  }>,
): ActionResult {
  const current = getClient(id);
  if (!current) return { ok: false, error: "Cliente não encontrado" };
  const merged = {
    name: input.name ?? current.name,
    email: input.email ?? current.email,
    phone: input.phone ?? current.phone,
    cpf: input.cpf ?? current.cpf,
    city: input.city ?? current.city,
    state: input.state ?? current.state,
    birthdate: (input.birthdate ?? current.birthdate) || null,
    tags: JSON.stringify(input.tags ?? current.tags),
    notes: input.notes ?? current.notes,
  };
  getDb()
    .prepare(
      `UPDATE clients SET name=@name, email=@email, phone=@phone, cpf=@cpf,
        city=@city, state=@state, birthdate=@birthdate, tags=@tags, notes=@notes
       WHERE id=@id`,
    )
    .run({ ...merged, id });
  return { ok: true };
}

export function deleteClient(id: string): ActionResult {
  // remove arquivos físicos dos documentos antes de apagar (cascade limpa as linhas)
  const docs = getDb()
    .prepare("SELECT file_path FROM documents WHERE client_id = ?")
    .all(id) as { file_path: string | null }[];
  for (const d of docs) removeFile(d.file_path);
  getDb().prepare("DELETE FROM clients WHERE id = ?").run(id);
  return { ok: true };
}

// ---- Relacionamento ----
export function addComment(
  clientId: string,
  channel: Channel,
  body: string,
): ActionResult {
  if (!body.trim()) return { ok: false, error: "Escreva um comentário" };
  getDb()
    .prepare(
      "INSERT INTO comments (id, client_id, channel, body, created_at) VALUES (?,?,?,?,?)",
    )
    .run(newId(), clientId, channel, body.trim(), nowISO());
  return { ok: true };
}

export function deleteComment(id: string): ActionResult {
  getDb().prepare("DELETE FROM comments WHERE id = ?").run(id);
  return { ok: true };
}

// ---- Sinistros ----
export function addClaim(input: {
  clientId: string;
  policyId?: string | null;
  date: string;
  description: string;
  amount: number;
  status?: ClaimStatus;
}): ActionResult {
  getDb()
    .prepare(
      `INSERT INTO claims (id, client_id, policy_id, date, description, amount, status, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .run(
      newId(),
      input.clientId,
      input.policyId || null,
      input.date || todayISO(),
      input.description,
      input.amount,
      input.status ?? "aberto",
      nowISO(),
    );
  return { ok: true };
}

export function updateClaimStatus(id: string, status: ClaimStatus): ActionResult {
  getDb().prepare("UPDATE claims SET status = ? WHERE id = ?").run(status, id);
  return { ok: true };
}

// ---- Documentos ----
export function uploadDocument(
  clientId: string,
  category: DocCategory,
  file: { name: string; size: number; data: Uint8Array },
): ActionResult {
  if (!file || !file.data || file.size === 0)
    return { ok: false, error: "Selecione um arquivo" };
  const { path, size } = saveFile(clientId, file.name, file.data);
  getDb()
    .prepare(
      `INSERT INTO documents (id, client_id, name, category, file_url, file_path, file_size, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .run(
      newId(),
      clientId,
      file.name,
      category,
      `${FILE_PROTOCOL}${path}`,
      path,
      size,
      nowISO(),
    );
  return { ok: true };
}

export function deleteDocument(id: string): ActionResult {
  const db = getDb();
  const row = db
    .prepare("SELECT file_path FROM documents WHERE id = ?")
    .get(id) as { file_path: string | null } | undefined;
  removeFile(row?.file_path);
  db.prepare("DELETE FROM documents WHERE id = ?").run(id);
  return { ok: true };
}

// ---- Parcelas ----
export function togglePaidInstallment(id: string, paid: boolean): ActionResult {
  getDb()
    .prepare("UPDATE installments SET status = ?, paid_at = ? WHERE id = ?")
    .run(paid ? "paga" : "pendente", paid ? todayISO() : null, id);
  return { ok: true };
}

// ---- Cotações ----
export function createQuote(input: {
  clientId: string;
  type: PolicyType;
  notes?: string | null;
}): ActionResult<{ id: string }> {
  const id = newId();
  getDb()
    .prepare(
      "INSERT INTO quotes (id, client_id, type, status, policy_id, notes, created_at) VALUES (?,?,?,?,?,?,?)",
    )
    .run(id, input.clientId, input.type, "aberta", null, input.notes ?? null, nowISO());
  return { ok: true, id };
}

export function addQuoteOption(
  quoteId: string,
  input: {
    insurer: string;
    premium: number;
    coverage?: string | null;
    installments_count: number;
    payment_method?: PaymentMethod | null;
    pdf?: { name: string; size: number; data: Uint8Array } | null;
  },
): ActionResult<{ option: QuoteOption }> {
  const insurer = clean(input.insurer);
  if (!insurer) return { ok: false, error: "Informe a seguradora" };

  let pdfPath: string | null = null;
  let pdfUrl: string | null = null;
  let pdfName: string | null = null;
  if (input.pdf && input.pdf.data && input.pdf.size > 0) {
    const saved = saveFile(`cotacoes/${quoteId}`, input.pdf.name, input.pdf.data);
    pdfPath = saved.path;
    pdfUrl = `${FILE_PROTOCOL}${saved.path}`;
    pdfName = input.pdf.name;
  }

  const id = newId();
  const created_at = nowISO();
  getDb()
    .prepare(
      `INSERT INTO quote_options
        (id, quote_id, insurer, premium, coverage, installments_count, payment_method, pdf_url, pdf_path, pdf_name, is_best, chosen, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,0,0,?)`,
    )
    .run(
      id,
      quoteId,
      insurer,
      input.premium,
      clean(input.coverage),
      Math.max(1, Math.round(input.installments_count || 1)),
      input.payment_method ?? null,
      pdfUrl,
      pdfPath,
      pdfName,
      created_at,
    );
  const option = mapOption(
    getDb().prepare("SELECT * FROM quote_options WHERE id = ?").get(id),
  );
  return { ok: true, option };
}

export function markBestOption(quoteId: string, optionId: string): ActionResult {
  const db = getDb();
  db.prepare("UPDATE quote_options SET is_best = 0 WHERE quote_id = ?").run(quoteId);
  db.prepare("UPDATE quote_options SET is_best = 1 WHERE id = ?").run(optionId);
  return { ok: true };
}

export function deleteQuoteOption(optionId: string): ActionResult {
  const db = getDb();
  const row = db
    .prepare("SELECT pdf_path FROM quote_options WHERE id = ?")
    .get(optionId) as { pdf_path: string | null } | undefined;
  removeFile(row?.pdf_path);
  db.prepare("DELETE FROM quote_options WHERE id = ?").run(optionId);
  return { ok: true };
}

export function deleteQuote(quoteId: string): ActionResult {
  const db = getDb();
  const opts = db
    .prepare("SELECT pdf_path FROM quote_options WHERE quote_id = ?")
    .all(quoteId) as { pdf_path: string | null }[];
  for (const o of opts) removeFile(o.pdf_path);
  db.prepare("DELETE FROM quotes WHERE id = ?").run(quoteId);
  return { ok: true };
}

/** Oficializa a cotação: cria a apólice + parcelas a partir da opção escolhida. */
export function officializeQuote(input: {
  quoteId: string;
  optionId: string;
  policyNumber?: string | null;
  paymentMethod: PaymentMethod;
  installmentsCount: number;
  startDate: string;
  endDate?: string | null;
  firstDueDate?: string | null;
  commissionRate?: number;
}): ActionResult<{ clientId: string; policyId: string }> {
  const db = getDb();
  const quote = db
    .prepare("SELECT * FROM quotes WHERE id = ?")
    .get(input.quoteId) as Quote | undefined;
  if (!quote) return { ok: false, error: "Cotação não encontrada" };

  const option = db
    .prepare("SELECT * FROM quote_options WHERE id = ?")
    .get(input.optionId) as QuoteOption | undefined;
  if (!option) return { ok: false, error: "Opção não encontrada" };

  const start = input.startDate || todayISO();
  const end = input.endDate || addYearsISO(start, 1);
  const count = Math.max(1, Math.round(input.installmentsCount || 1));

  const tx = db.transaction(() => {
    const policyId = newId();
    db.prepare(
      `INSERT INTO policies
        (id, client_id, type, insurer, policy_number, premium, commission_rate, payment_method, installments_count, start_date, end_date, status, notes, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      policyId,
      quote.client_id,
      quote.type,
      option.insurer,
      input.policyNumber ?? null,
      option.premium,
      input.commissionRate ?? 10,
      input.paymentMethod,
      count,
      start,
      end,
      "vigente",
      option.coverage,
      nowISO(),
    );

    const total = Number(option.premium);
    const base = Math.floor((total / count) * 100) / 100;
    const firstDue = input.firstDueDate || start;
    const instStmt = db.prepare(
      "INSERT INTO installments (id, policy_id, number, amount, due_date, status, paid_at, created_at) VALUES (?,?,?,?,?,?,?,?)",
    );
    let accumulated = 0;
    for (let n = 1; n <= count; n++) {
      const amount =
        n === count ? Math.round((total - accumulated) * 100) / 100 : base;
      accumulated += base;
      instStmt.run(
        newId(),
        policyId,
        n,
        amount,
        addMonthsISO(firstDue, n - 1),
        "pendente",
        null,
        nowISO(),
      );
    }

    db.prepare("UPDATE quote_options SET chosen = 0 WHERE quote_id = ?").run(input.quoteId);
    db.prepare("UPDATE quote_options SET chosen = 1 WHERE id = ?").run(input.optionId);
    db.prepare("UPDATE quotes SET status = 'oficializada', policy_id = ? WHERE id = ?").run(
      policyId,
      input.quoteId,
    );
    return policyId;
  });

  const policyId = tx();
  return { ok: true, clientId: quote.client_id, policyId };
}

// ---- Apólice avulsa ----
export function createPolicy(input: {
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
}): ActionResult {
  const db = getDb();
  const start = input.startDate || todayISO();
  const end = input.endDate || addYearsISO(start, 1);
  const count = Math.max(1, Math.round(input.installmentsCount || 1));

  const tx = db.transaction(() => {
    const policyId = newId();
    db.prepare(
      `INSERT INTO policies
        (id, client_id, type, insurer, policy_number, premium, commission_rate, payment_method, installments_count, start_date, end_date, status, notes, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      policyId,
      input.clientId,
      input.type,
      input.insurer,
      input.policyNumber ?? null,
      input.premium,
      input.commissionRate ?? 10,
      input.paymentMethod,
      count,
      start,
      end,
      "vigente",
      null,
      nowISO(),
    );

    if (input.generateInstallments !== false) {
      const total = input.premium;
      const base = Math.floor((total / count) * 100) / 100;
      const instStmt = db.prepare(
        "INSERT INTO installments (id, policy_id, number, amount, due_date, status, paid_at, created_at) VALUES (?,?,?,?,?,?,?,?)",
      );
      let acc = 0;
      for (let n = 1; n <= count; n++) {
        const amount =
          n === count ? Math.round((total - acc) * 100) / 100 : base;
        acc += base;
        instStmt.run(
          newId(),
          policyId,
          n,
          amount,
          addMonthsISO(start, n - 1),
          "pendente",
          null,
          nowISO(),
        );
      }
    }
  });
  tx();
  return { ok: true };
}

// ---- Metas ----
export function setGoal(month: string, target: number): ActionResult {
  getDb()
    .prepare(
      `INSERT INTO goals (id, month, target, created_at) VALUES (?,?,?,?)
       ON CONFLICT(month) DO UPDATE SET target = excluded.target`,
    )
    .run(newId(), month, target, nowISO());
  return { ok: true };
}

// ---- Backup ----
const BACKUP_TABLES = [
  "clients",
  "policies",
  "quotes",
  "quote_options",
  "installments",
  "claims",
  "documents",
  "comments",
  "goals",
] as const;

export function getExportBundle() {
  const db = getDb();
  const bundle: Record<string, unknown[]> = {};
  for (const t of BACKUP_TABLES) {
    bundle[t] = db.prepare(`SELECT * FROM ${t}`).all();
  }
  return {
    app: "apolice",
    version: 1,
    exported_at: new Date().toISOString(),
    data: bundle,
  };
}

export function importBundle(
  json: string,
): ActionResult<{ counts: Record<string, number> }> {
  let parsed: { data?: Record<string, Record<string, unknown>[]> };
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "JSON inválido" };
  }
  const data = parsed.data;
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Formato de backup não reconhecido" };
  }

  const db = getDb();
  const counts: Record<string, number> = {};

  const tx = db.transaction(() => {
    // apaga base atual (ordem reversa respeita as FKs)
    for (const t of [...BACKUP_TABLES].reverse()) {
      db.prepare(`DELETE FROM ${t}`).run();
    }
    for (const t of BACKUP_TABLES) {
      const rows = data[t] ?? [];
      counts[t] = rows.length;
      for (const row of rows) {
        const normalized = normalizeRow(t, row);
        const cols = Object.keys(normalized);
        const placeholders = cols.map((c) => `@${c}`).join(", ");
        db.prepare(
          `INSERT INTO ${t} (${cols.join(", ")}) VALUES (${placeholders})`,
        ).run(normalized);
      }
    }
  });
  try {
    tx();
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erro ao importar" };
  }
  return { ok: true, counts };
}

/** Ajusta tipos vindos do JSON para o formato do SQLite (tags, booleans). */
function normalizeRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  if (table === "clients" && Array.isArray(out.tags)) {
    out.tags = JSON.stringify(out.tags);
  }
  if (table === "clients" && typeof out.tags !== "string") {
    out.tags = JSON.stringify(out.tags ?? []);
  }
  if (table === "quote_options") {
    out.is_best = out.is_best ? 1 : 0;
    out.chosen = out.chosen ? 1 : 0;
  }
  if (!out.created_at) out.created_at = nowISO();
  return out;
}
