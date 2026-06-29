import { useRef, useState } from "react";
import { Download, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useRefresh } from "@/lib/data";

export function BackupClient() {
  const refresh = useRefresh();
  const [pending, setPending] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; counts: Record<string, number> }
    | { ok: false; error: string }
    | null
  >(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function exportBackup() {
    setExporting(true);
    await api.exportBackup();
    setExporting(false);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = window.confirm(
      "Importar substitui TODOS os dados atuais pelos dados do arquivo. Deseja continuar?",
    );
    if (!ok) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setResult(null);
    setPending(true);
    const text = await file.text();
    const r = await api.importBundle(text);
    if (r.ok) {
      setResult({ ok: true, counts: r.counts ?? {} });
      refresh();
    } else {
      setResult({ ok: false, error: r.error ?? "Erro ao importar" });
    }
    if (fileRef.current) fileRef.current.value = "";
    setPending(false);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-6">
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
          <Download size={20} />
        </div>
        <h2 className="font-semibold">Exportar base (JSON)</h2>
        <p className="mt-1 text-sm text-muted">
          Salve um arquivo com todos os seus clientes, apólices, cotações, parcelas,
          sinistros e relacionamento. Guarde como backup.
        </p>
        <button className="btn btn-primary mt-4" disabled={exporting} onClick={exportBackup}>
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Salvar backup
        </button>
      </div>

      <div className="card p-6">
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
          <Upload size={20} />
        </div>
        <h2 className="font-semibold">Importar base (JSON)</h2>
        <p className="mt-1 text-sm text-muted">
          Restaure a partir de um backup no mesmo formato.{" "}
          <span className="text-warning">Atenção: substitui todos os dados atuais.</span>
        </p>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
        <button
          className="btn btn-ghost mt-4"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Selecionar arquivo
        </button>

        {result && result.ok && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent-soft px-3 py-2.5 text-sm text-accent">
            <CheckCircle2 size={16} className="mt-0.5" />
            <span>
              Importado:{" "}
              {Object.entries(result.counts)
                .filter(([, n]) => n > 0)
                .map(([t, n]) => `${n} ${t}`)
                .join(", ") || "nenhum registro"}
              .
            </span>
          </div>
        )}
        {result && !result.ok && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm text-danger">
            <AlertTriangle size={16} className="mt-0.5" />
            <span>{result.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
