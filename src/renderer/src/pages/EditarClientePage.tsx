import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useData } from "@/lib/data";
import { ClientForm } from "@/components/ClientForm";
import { PageLoading } from "@/components/ui";
import type { Client } from "@shared/types";

export function EditarClientePage() {
  const { id = "" } = useParams();
  const { data, loading } = useData<Client | null>(() => api.getClient(id), [id]);

  if (loading) return <PageLoading />;
  if (!data) return <p className="text-muted">Cliente não encontrado.</p>;

  return (
    <div>
      <Link
        to={`/clientes/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
      >
        <ChevronLeft size={16} /> {data.name}
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Editar cliente</h1>
      <ClientForm client={data} />
    </div>
  );
}
