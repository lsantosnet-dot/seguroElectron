import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  Star,
  Trash2,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
} from "lucide-react";
import { api, fileToPayload } from "@/lib/api";
import { useRefresh } from "@/lib/data";
import {
  INSURERS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  POLICY_TYPES,
} from "@shared/constants";
import { addYearsISO, formatBRL, todayISO } from "@shared/format";
import type {
  Client,
  PaymentMethod,
  PolicyType,
  Quote,
  QuoteOption,
} from "@shared/types";

type Step = 1 | 2 | 3;

export function QuoteWizard({
  clients,
  preselectedClientId,
  resume,
}: {
  clients: Pick<Client, "id" | "name">[];
  preselectedClientId?: string;
  resume?: Quote & { options: QuoteOption[]; client: Client };
}) {
  const navigate = useNavigate();
  const refresh = useRefresh();

  const [step, setStep] = useState<Step>(resume ? 2 : 1);
  const [quoteId, setQuoteId] = useState<string | null>(resume?.id ?? null);
  const [clientName, setClientName] = useState(resume?.client.name ?? "");
  const [options, setOptions] = useState<QuoteOption[]>(resume?.options ?? []);

  const [mode, setMode] = useState<"existing" | "new">(
    preselectedClientId || clients.length ? "existing" : "new",
  );
  const [clientId, setClientId] = useState(preselectedClientId ?? "");
  const [type, setType] = useState<PolicyType>(resume?.type ?? "auto");
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
  });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function goToOptions() {
    setError(null);
    setPending(true);
    let cid = clientId;
    let cname = clients.find((c) => c.id === clientId)?.name ?? "";
    if (mode === "new") {
      if (!newClient.name.trim()) {
        setPending(false);
        return setError("Informe o nome do cliente");
      }
      const r = await api.createClient({
        name: newClient.name,
        email: newClient.email || null,
        phone: newClient.phone || null,
        city: newClient.city || null,
        state: newClient.state || null,
      });
      if (!r.ok) {
        setPending(false);
        return setError(r.error);
      }
      cid = r.id;
      cname = newClient.name;
    } else if (!cid) {
      setPending(false);
      return setError("Selecione um cliente");
    }
    const q = await api.createQuote({ clientId: cid, type });
    setPending(false);
    if (!q.ok) return setError(q.error);
    setQuoteId(q.id);
    setClientName(cname);
    // Não chamar refresh() aqui: ele recarregaria a página e remontaria o
    // assistente no passo 1. O refresh acontece ao oficializar (que navega).
    setStep(2);
  }

  const cheapest = options.reduce<QuoteOption | null>(
    (acc, o) => (!acc || o.premium < acc.premium ? o : acc),
    null,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Stepper step={step} />

      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="card space-y-5 p-6">
          <h2 className="font-semibold">1. Cliente e tipo de seguro</h2>

          <div className="flex gap-2">
            <button
              className={`btn ${mode === "existing" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setMode("existing")}
              disabled={clients.length === 0}
            >
              Cliente existente
            </button>
            <button
              className={`btn ${mode === "new" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setMode("new")}
            >
              Novo cliente
            </button>
          </div>

          {mode === "existing" ? (
            <div>
              <label className="label">Cliente</label>
              <select
                className="input"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Selecione…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Nome *</label>
                <input
                  className="input"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input
                  className="input"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input
                  className="input"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Cidade</label>
                <input
                  className="input"
                  value={newClient.city}
                  onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                />
              </div>
              <div>
                <label className="label">UF</label>
                <input
                  className="input"
                  value={newClient.state}
                  onChange={(e) => setNewClient({ ...newClient, state: e.target.value })}
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">Tipo de seguro</label>
            <div className="flex flex-wrap gap-2">
              {POLICY_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`badge ${type === t.value ? "badge-green" : "badge-gray"} cursor-pointer`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={goToOptions} disabled={pending}>
              {pending ? <Loader2 size={16} className="animate-spin" /> : null}
              Avançar <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && quoteId && (
        <OptionsStep
          quoteId={quoteId}
          clientName={clientName}
          options={options}
          setOptions={setOptions}
          cheapestId={cheapest?.id ?? null}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && quoteId && (
        <OfficializeStep
          quoteId={quoteId}
          options={options}
          defaultOptionId={cheapest?.id ?? options[0]?.id ?? ""}
          onBack={() => setStep(2)}
          onDone={(cid) => {
            refresh();
            navigate(`/clientes/${cid}`);
          }}
        />
      )}
    </div>
  );
}

function OptionsStep({
  quoteId,
  clientName,
  options,
  setOptions,
  cheapestId,
  onBack,
  onNext,
}: {
  quoteId: string;
  clientName: string;
  options: QuoteOption[];
  setOptions: React.Dispatch<React.SetStateAction<QuoteOption[]>>;
  cheapestId: string | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("pdf") as File | null;
    setPending(true);
    const pdf = file && file.size > 0 ? await fileToPayload(file) : null;
    const r = await api.addQuoteOption(quoteId, {
      insurer: (fd.get("insurer") as string) ?? "",
      premium: parseFloat(((fd.get("premium") as string) ?? "").replace(",", ".")) || 0,
      coverage: (fd.get("coverage") as string) || null,
      installments_count:
        parseInt((fd.get("installments_count") as string) ?? "1") || 1,
      payment_method: (fd.get("payment_method") as PaymentMethod) ?? null,
      pdf,
    });
    setPending(false);
    if (!r.ok) return setError(r.error);
    setOptions((prev) => [...prev, r.option]);
    formRef.current?.reset();
  }

  async function toggleBest(id: string) {
    await api.markBestOption(quoteId, id);
    setOptions((prev) => prev.map((o) => ({ ...o, is_best: o.id === id })));
  }

  async function remove(id: string) {
    await api.deleteQuoteOption(id);
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="font-semibold">2. Propostas das seguradoras — {clientName}</h2>
        <p className="mt-1 text-sm text-muted">
          Adicione uma proposta por seguradora. A de menor preço é destacada; você pode
          marcar a sua recomendação com a estrela.
        </p>

        <form ref={formRef} onSubmit={add} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Seguradora *</label>
              <input name="insurer" className="input" list="insurers-w" required />
              <datalist id="insurers-w">
                {INSURERS.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label">Prêmio (R$) *</label>
              <input
                name="premium"
                inputMode="decimal"
                className="input"
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Parcelas</label>
              <input
                name="installments_count"
                type="number"
                min={1}
                defaultValue={12}
                className="input"
              />
            </div>
            <div>
              <label className="label">Pagamento</label>
              <select name="payment_method" className="input" defaultValue="boleto">
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">PDF da proposta</label>
              <input
                name="pdf"
                type="file"
                accept="application/pdf"
                className="input !py-1.5 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="label">Coberturas / observações</label>
            <input
              name="coverage"
              className="input"
              placeholder="Ex.: cobertura completa, carro reserva 15 dias"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end">
            <button className="btn btn-soft" disabled={pending}>
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Adicionar proposta
            </button>
          </div>
        </form>
      </div>

      {options.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-3 text-sm font-semibold text-muted">
            Comparativo ({options.length})
          </h3>
          <div className="space-y-2">
            {options
              .slice()
              .sort((a, b) => a.premium - b.premium)
              .map((o) => (
                <div
                  key={o.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    o.id === cheapestId
                      ? "border-accent/50 bg-accent-soft"
                      : "border-border bg-panel-2"
                  }`}
                >
                  <button
                    onClick={() => toggleBest(o.id)}
                    className={o.is_best ? "text-warning" : "text-faint hover:text-warning"}
                    title="Marcar como recomendada"
                  >
                    <Star size={18} className={o.is_best ? "fill-warning" : ""} />
                  </button>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      {o.insurer}
                      {o.id === cheapestId && (
                        <span className="badge badge-green">menor preço</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {o.installments_count}x ·{" "}
                      {o.payment_method ? PAYMENT_METHOD_LABEL[o.payment_method] : "—"}
                      {o.coverage ? ` · ${o.coverage}` : ""}
                    </p>
                  </div>
                  {o.pdf_path && (
                    <button
                      onClick={() => api.openFile(o.pdf_path!)}
                      className="text-faint hover:text-accent"
                      title="Ver PDF"
                    >
                      <FileText size={16} />
                    </button>
                  )}
                  <span className="num ml-auto font-semibold">{formatBRL(o.premium)}</span>
                  <button onClick={() => remove(o.id)} className="text-faint hover:text-danger">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <button className="btn btn-primary" onClick={onNext} disabled={options.length === 0}>
          Oficializar contratação <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function OfficializeStep({
  quoteId,
  options,
  defaultOptionId,
  onBack,
  onDone,
}: {
  quoteId: string;
  options: QuoteOption[];
  defaultOptionId: string;
  onBack: () => void;
  onDone: (clientId: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optionId, setOptionId] = useState(defaultOptionId);
  const selected = options.find((o) => o.id === optionId);
  const today = todayISO();
  const [form, setForm] = useState({
    policyNumber: "",
    paymentMethod: (selected?.payment_method ?? "boleto") as PaymentMethod,
    installmentsCount: String(selected?.installments_count ?? 12),
    startDate: today,
    endDate: addYearsISO(today, 1),
    firstDueDate: today,
    commissionRate: "10",
  });

  function pick(id: string) {
    setOptionId(id);
    const o = options.find((x) => x.id === id);
    if (o) {
      setForm((f) => ({
        ...f,
        paymentMethod: (o.payment_method ?? f.paymentMethod) as PaymentMethod,
        installmentsCount: String(o.installments_count),
      }));
    }
  }

  async function submit() {
    setError(null);
    if (!optionId) return setError("Escolha a proposta contratada");
    setPending(true);
    const r = await api.officializeQuote({
      quoteId,
      optionId,
      policyNumber: form.policyNumber || null,
      paymentMethod: form.paymentMethod,
      installmentsCount: parseInt(form.installmentsCount) || 1,
      startDate: form.startDate,
      endDate: form.endDate,
      firstDueDate: form.firstDueDate,
      commissionRate: parseFloat(form.commissionRate) || 10,
    });
    setPending(false);
    if (!r.ok) return setError(r.error);
    onDone(r.clientId);
  }

  return (
    <div className="card space-y-5 p-6">
      <h2 className="font-semibold">3. Oficializar contratação</h2>

      <div>
        <label className="label">Proposta contratada</label>
        <div className="space-y-2">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                o.id === optionId ? "border-accent bg-accent-soft" : "border-border bg-panel-2"
              }`}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full border ${
                  o.id === optionId
                    ? "border-accent bg-accent text-[#06231a]"
                    : "border-border"
                }`}
              >
                {o.id === optionId && <Check size={13} />}
              </span>
              <span className="font-medium">{o.insurer}</span>
              {o.is_best && <Star size={14} className="fill-warning text-warning" />}
              <span className="num ml-auto font-semibold">{formatBRL(o.premium)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nº da apólice</label>
          <input
            className="input"
            value={form.policyNumber}
            onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Forma de pagamento</label>
          <select
            className="input"
            value={form.paymentMethod}
            onChange={(e) =>
              setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })
            }
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="label">Parcelas</label>
          <input
            className="input"
            type="number"
            min={1}
            value={form.installmentsCount}
            onChange={(e) => setForm({ ...form, installmentsCount: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Comissão (%)</label>
          <input
            className="input"
            value={form.commissionRate}
            onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Início</label>
          <input
            className="input"
            type="date"
            value={form.startDate}
            onChange={(e) =>
              setForm({
                ...form,
                startDate: e.target.value,
                endDate: addYearsISO(e.target.value, 1),
              })
            }
          />
        </div>
        <div>
          <label className="label">1ª parcela</label>
          <input
            className="input"
            type="date"
            value={form.firstDueDate}
            onChange={(e) => setForm({ ...form, firstDueDate: e.target.value })}
          />
        </div>
      </div>

      {selected && (
        <p className="rounded-lg bg-surface px-4 py-3 text-sm text-muted">
          Será gerada uma apólice de <b className="text-text">{selected.insurer}</b> no valor
          de <b className="num text-text">{formatBRL(selected.premium)}</b>, com{" "}
          <b className="text-text">{form.installmentsCount}</b> parcela(s) a partir de{" "}
          {form.firstDueDate.split("-").reverse().join("/")}.
        </p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-between">
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={pending}>
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          Oficializar apólice
        </button>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Cliente", "Propostas", "Oficializar"];
  return (
    <div className="mb-6 flex items-center gap-2">
      {labels.map((l, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={l} className="flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                active
                  ? "bg-accent text-[#06231a]"
                  : done
                    ? "bg-accent-soft text-accent"
                    : "bg-surface text-faint"
              }`}
            >
              {done ? <Check size={14} /> : n}
            </span>
            <span className={`text-sm ${active ? "font-medium" : "text-muted"}`}>{l}</span>
            {i < labels.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
