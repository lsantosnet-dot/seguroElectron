import { useEffect, useState } from "react";
import { Download, RefreshCw, X, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { UpdaterStatus } from "@/lib/api";

// Banner de atualização automática (via GitHub). Aparece quando há uma nova
// versão disponível; o usuário decide baixar e instalar.
export function UpdateBanner() {
  const [status, setStatus] = useState<UpdaterStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const off = api.updater.onStatus((s) => {
      setStatus(s);
      setDismissed(false);
    });
    return off;
  }, []);

  if (!status || dismissed) return null;
  if (status.state === "none" || status.state === "offline" || status.state === "error")
    return null;

  let content: React.ReactNode = null;

  if (status.state === "available") {
    content = (
      <>
        <Download size={16} />
        <span>
          Nova versão <b>{status.version}</b> disponível.
        </span>
        <button
          className="btn btn-soft !py-1 !text-xs"
          onClick={() => api.updater.download()}
        >
          Baixar agora
        </button>
      </>
    );
  } else if (status.state === "downloading") {
    content = (
      <>
        <Loader2 size={16} className="animate-spin" />
        <span>Baixando atualização… {status.percent}%</span>
      </>
    );
  } else if (status.state === "downloaded") {
    content = (
      <>
        <CheckCircle2 size={16} />
        <span>
          Versão <b>{status.version}</b> pronta para instalar.
        </span>
        <button
          className="btn btn-primary !py-1 !text-xs"
          onClick={() => api.updater.install()}
        >
          <RefreshCw size={13} /> Reiniciar e atualizar
        </button>
      </>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b border-border bg-accent-soft px-4 py-2.5 text-sm text-accent sm:px-6">
      {content}
      <button
        className="ml-auto text-accent/70 hover:text-accent"
        onClick={() => setDismissed(true)}
        title="Dispensar"
      >
        <X size={16} />
      </button>
    </div>
  );
}
