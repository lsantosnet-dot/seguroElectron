import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useData } from "@/lib/data";
import { QuoteWizard } from "@/components/quote/QuoteWizard";
import { PageLoading } from "@/components/ui";
import type { Client, Quote, QuoteOption } from "@shared/types";

export function NovaCotacaoPage() {
  const [sp] = useSearchParams();
  const clientParam = sp.get("client") ?? undefined;
  const quoteParam = sp.get("quote") ?? undefined;

  const { data, loading } = useData(async () => {
    const [clients, resume] = await Promise.all([
      api.getClientsList(),
      quoteParam ? api.getQuote(quoteParam) : Promise.resolve(null),
    ]);
    return { clients, resume };
  }, [quoteParam]);

  if (loading || !data) return <PageLoading />;

  return (
    <div>
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
      >
        <ChevronLeft size={16} /> Voltar
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Nova cotação</h1>
      <QuoteWizard
        clients={data.clients as Pick<Client, "id" | "name">[]}
        preselectedClientId={clientParam}
        resume={
          (data.resume as (Quote & { options: QuoteOption[]; client: Client }) | null) ??
          undefined
        }
      />
    </div>
  );
}
