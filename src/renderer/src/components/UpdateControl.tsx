import { useEffect, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { UpdaterStatus } from "@/lib/api";

// Mostra a versão atual do app e permite verificar atualizações manualmente,
// com feedback visível (sem falhas silenciosas).
export function UpdateControl() {
  const [version, setVersion] = useState("");
  const [status, setStatus] = useState<UpdaterStatus>({ state: "idle" });

  useEffect(() => {
    api.getAppVersion().then(setVersion);
    api.updater.getStatus().then((s) => s && setStatus(s));
    const off = api.updater.onStatus(setStatus);
    return off;
  }, []);

  const label = (() => {
    switch (status.state) {
      case "checking":
        return "Verificando…";
      case "available":
        return `Nova versão ${status.version}`;
      case "downloading":
        return `Baixando… ${status.percent}%`;
      case "downloaded":
        return `Pronto para instalar`;
      case "none":
        return "Você está atualizado";
      case "offline":
        return "Sem conexão";
      case "error":
        return "Falha ao verificar";
      default:
        return "";
    }
  })();

  const checking = status.state === "checking";

  return (
    <div className="px-5 pb-3">
      <div className="flex items-center justify-between">
        <span className="num text-[0.7rem] text-faint">
          {version ? `v${version}` : ""}
        </span>
        <button
          onClick={() => api.updater.check()}
          disabled={checking}
          className="inline-flex items-center gap-1 text-[0.7rem] text-faint transition-colors hover:text-accent disabled:opacity-60"
          title="Verificar atualizações"
        >
          {checking ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          Verificar
        </button>
      </div>
      {label && (
        <p
          className={`mt-1 text-[0.7rem] ${
            status.state === "error" || status.state === "offline"
              ? "text-danger"
              : status.state === "available" || status.state === "downloaded"
                ? "text-accent"
                : "text-faint"
          }`}
        >
          {label}
        </p>
      )}
    </div>
  );
}
