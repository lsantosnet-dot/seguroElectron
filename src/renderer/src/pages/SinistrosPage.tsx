import { AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useData } from "@/lib/data";
import { EmptyState, PageLoading } from "@/components/ui";
import { SinistrosList } from "@/components/SinistrosList";
import type { ClaimWithClient } from "@shared/types";

export function SinistrosPage() {
  const { data, loading } = useData<ClaimWithClient[]>(() => api.getAllClaims(), []);
  if (loading || !data) return <PageLoading />;
  const claims = data;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        Sinistros <span className="text-muted">({claims.length})</span>
      </h1>

      {claims.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle size={26} />}
          title="Nenhum sinistro registrado"
          description="Registre sinistros pela aba Sinistros de cada cliente."
        />
      ) : (
        <SinistrosList claims={claims} />
      )}
    </div>
  );
}
