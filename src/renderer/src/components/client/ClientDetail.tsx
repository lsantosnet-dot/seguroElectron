import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, IdCard, Plus, Pencil, ChevronLeft } from "lucide-react";
import { Avatar, Tag } from "@/components/ui";
import { PoliciesTab } from "./PoliciesTab";
import { QuotesTab } from "./QuotesTab";
import { RelationshipTab } from "./RelationshipTab";
import { ClaimsTab } from "./ClaimsTab";
import { DocumentsTab } from "./DocumentsTab";
import type {
  Claim,
  Client,
  Comment,
  DocumentRow,
  Installment,
  Policy,
  Quote,
  QuoteOption,
} from "@shared/types";

type Tab = "apolices" | "cotacoes" | "relacionamento" | "sinistros" | "documentos";

export function ClientDetail({
  client,
  policies,
  installmentsByPolicy,
  quotes,
  claims,
  documents,
  comments,
}: {
  client: Client;
  policies: Policy[];
  installmentsByPolicy: Record<string, Installment[]>;
  quotes: (Quote & { options: QuoteOption[] })[];
  claims: Claim[];
  documents: DocumentRow[];
  comments: Comment[];
}) {
  const [tab, setTab] = useState<Tab>("apolices");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "apolices", label: "Apólices", count: policies.length },
    { id: "cotacoes", label: "Cotações", count: quotes.length },
    { id: "relacionamento", label: "Relacionamento", count: comments.length },
    { id: "sinistros", label: "Sinistros", count: claims.length },
    { id: "documentos", label: "Documentos", count: documents.length },
  ];

  return (
    <div>
      <Link
        to="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
      >
        <ChevronLeft size={16} /> Clientes
      </Link>

      <div className="flex flex-wrap items-start gap-4">
        <Avatar name={client.name} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
            {client.phone && (
              <span className="num flex items-center gap-1.5">
                <Phone size={14} /> {client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={14} /> {client.email}
              </span>
            )}
            {client.cpf && (
              <span className="num flex items-center gap-1.5">
                <IdCard size={14} /> {client.cpf}
              </span>
            )}
          </div>
          {client.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {client.tags.map((t) => (
                <Tag key={t} label={t} />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {client.email && (
            <a href={`mailto:${client.email}`} className="btn btn-ghost">
              <Mail size={16} /> E-mail
            </a>
          )}
          <Link to={`/clientes/${client.id}/editar`} className="btn btn-ghost">
            <Pencil size={16} /> Editar
          </Link>
          <Link to={`/cotacoes/nova?client=${client.id}`} className="btn btn-primary">
            <Plus size={16} /> Nova cotação
          </Link>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-accent text-text"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="rounded-full bg-white/8 px-1.5 text-[0.68rem] text-muted">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "apolices" && (
          <PoliciesTab
            client={client}
            policies={policies}
            installmentsByPolicy={installmentsByPolicy}
          />
        )}
        {tab === "cotacoes" && <QuotesTab clientId={client.id} quotes={quotes} />}
        {tab === "relacionamento" && (
          <RelationshipTab clientId={client.id} comments={comments} />
        )}
        {tab === "sinistros" && (
          <ClaimsTab clientId={client.id} claims={claims} policies={policies} />
        )}
        {tab === "documentos" && (
          <DocumentsTab clientId={client.id} documents={documents} />
        )}
      </div>
    </div>
  );
}
