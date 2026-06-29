import { api } from "@/lib/api";
import { useData } from "@/lib/data";
import { formatDateLong, greeting } from "@shared/format";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { PageLoading } from "@/components/ui";
import type { DashboardData } from "@shared/types";

export function DashboardPage() {
  const { data, loading } = useData<DashboardData>(() => api.getDashboardData(), []);
  if (loading || !data) return <PageLoading />;
  return (
    <DashboardView
      data={data}
      userName="corretor"
      dateLong={formatDateLong()}
      greetingText={greeting()}
    />
  );
}
