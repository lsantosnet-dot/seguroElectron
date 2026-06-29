import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useData } from "@/lib/data";
import { ClientDetail } from "@/components/client/ClientDetail";
import { PageLoading } from "@/components/ui";

export function ClientePage() {
  const { id = "" } = useParams();

  const { data, loading } = useData(async () => {
    const client = await api.getClient(id);
    if (!client) return null;
    const [policies, installmentsByPolicy, quotes, claims, documents, comments] =
      await Promise.all([
        api.getClientPolicies(id),
        api.getClientInstallments(id),
        api.getClientQuotes(id),
        api.getClientClaims(id),
        api.getClientDocuments(id),
        api.getClientComments(id),
      ]);
    return { client, policies, installmentsByPolicy, quotes, claims, documents, comments };
  }, [id]);

  if (loading) return <PageLoading />;
  if (!data || !data.client) {
    return (
      <div>
        <Link
          to="/clientes"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
        >
          <ChevronLeft size={16} /> Clientes
        </Link>
        <p className="text-muted">Cliente não encontrado.</p>
      </div>
    );
  }

  return (
    <ClientDetail
      client={data.client}
      policies={data.policies}
      installmentsByPolicy={data.installmentsByPolicy}
      quotes={data.quotes}
      claims={data.claims}
      documents={data.documents}
      comments={data.comments}
    />
  );
}
