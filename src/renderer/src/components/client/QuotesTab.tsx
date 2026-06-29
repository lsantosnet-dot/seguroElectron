import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Plus,
  FileSearch,
  Star,
  CheckCircle2,
  ArrowRight,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRefresh } from "@/lib/data";
import { EmptyState } from "@/components/ui";
import { POLICY_TYPE_LABEL } from "@shared/constants";
import { formatBRL, formatDate } from "@shared/format";
import type { Quote, QuoteOption } from "@shared/types";

type QuoteWithOptions = Quote & { options: QuoteOption[] };

export function QuotesTab({
  clientId,
  quotes,
}: {
  clientId: string;
  quotes: QuoteWithOptions[];
}) {
  const refresh = useRefresh();
  const [pendingId, setPendingId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link to={`/cotacoes/nova?client=${clientId}`} className="btn btn-ghost">
          <Plus size={16} /> Nova cotação
        </Link>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={<FileSearch size={24} />}
          title="Nenhuma cotação"
          description="Compare propostas de várias seguradoras e oficialize a melhor."
        />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => {
            const best = q.options.reduce<QuoteOption | null>(
              (acc, o) => (!acc || o.premium < acc.premium ? o : acc),
              null,
            );
            return (
              <div key={q.id} className="card p-5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    Cotação {POLICY_TYPE_LABEL[q.type]}
                  </span>
                  {q.status === "oficializada" ? (
                    <span className="badge badge-green">
                      <CheckCircle2 size={12} /> Oficializada
                    </span>
                  ) : q.status === "descartada" ? (
                    <span className="badge badge-gray">Descartada</span>
                  ) : (
                    <span className="badge badge-blue">Em aberto</span>
                  )}
                  <span className="num ml-auto text-xs text-faint">
                    {formatDate(q.created_at)}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {q.options.length === 0 && (
                    <p className="text-sm text-faint">Sem propostas adicionadas.</p>
                  )}
                  {q.options.map((o) => {
                    const isCheapest = best && o.id === best.id;
                    return (
                      <div
                        key={o.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                          o.chosen
                            ? "border-accent bg-accent-soft"
                            : "border-border bg-panel-2"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-sm font-medium">
                            {o.insurer}
                            {o.is_best && (
                              <Star size={13} className="fill-warning text-warning" />
                            )}
                            {isCheapest && !o.is_best && (
                              <span className="badge badge-green">menor preço</span>
                            )}
                            {o.chosen && (
                              <span className="badge badge-green">contratada</span>
                            )}
                          </p>
                          {o.coverage && (
                            <p className="truncate text-xs text-muted">{o.coverage}</p>
                          )}
                        </div>
                        {o.pdf_path && (
                          <button
                            onClick={() => api.openFile(o.pdf_path!)}
                            className="text-faint hover:text-accent"
                            title="Ver PDF"
                          >
                            <FileText size={15} />
                          </button>
                        )}
                        <span className="num ml-auto text-sm font-semibold">
                          {formatBRL(o.premium)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
                  {q.status === "aberta" && (
                    <>
                      <button
                        className="text-faint hover:text-danger"
                        disabled={pendingId === q.id}
                        onClick={async () => {
                          setPendingId(q.id);
                          await api.deleteQuote(q.id);
                          setPendingId(null);
                          refresh();
                        }}
                        title="Excluir cotação"
                      >
                        {pendingId === q.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                      <Link
                        to={`/cotacoes/nova?quote=${q.id}`}
                        className="btn btn-primary !py-1.5 !text-xs"
                      >
                        Continuar / oficializar <ArrowRight size={14} />
                      </Link>
                    </>
                  )}
                  {q.status === "oficializada" && q.policy_id && (
                    <span className="text-xs text-faint">
                      Apólice gerada a partir desta cotação.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
