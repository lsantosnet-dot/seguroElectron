import { useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { api } from "@/lib/api";
import { RefreshProvider } from "@/lib/data";
import { LockScreen } from "@/components/LockScreen";
import { AppShell } from "@/components/AppShell";
import { PageLoading } from "@/components/ui";
import { DashboardPage } from "@/pages/DashboardPage";
import { ClientesPage } from "@/pages/ClientesPage";
import { NovoClientePage } from "@/pages/NovoClientePage";
import { ClientePage } from "@/pages/ClientePage";
import { EditarClientePage } from "@/pages/EditarClientePage";
import { NovaCotacaoPage } from "@/pages/NovaCotacaoPage";
import { AgendaPage } from "@/pages/AgendaPage";
import { SinistrosPage } from "@/pages/SinistrosPage";
import { BackupPage } from "@/pages/BackupPage";

type AuthState = "loading" | "create" | "locked" | "unlocked";

export default function App() {
  const [auth, setAuth] = useState<AuthState>("loading");

  useEffect(() => {
    api.auth.has().then((has) => setAuth(has ? "locked" : "create"));
  }, []);

  if (auth === "loading") return <PageLoading />;

  if (auth === "create" || auth === "locked") {
    return (
      <LockScreen
        mode={auth === "create" ? "create" : "unlock"}
        onUnlocked={() => setAuth("unlocked")}
      />
    );
  }

  return (
    <RefreshProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell onLock={() => setAuth("locked")} />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/clientes/novo" element={<NovoClientePage />} />
            <Route path="/clientes/:id" element={<ClientePage />} />
            <Route path="/clientes/:id/editar" element={<EditarClientePage />} />
            <Route path="/cotacoes/nova" element={<NovaCotacaoPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/sinistros" element={<SinistrosPage />} />
            <Route path="/backup" element={<BackupPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </RefreshProvider>
  );
}
