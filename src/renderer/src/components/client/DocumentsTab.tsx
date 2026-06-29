import { useRef, useState } from "react";
import { Loader2, Upload, FileText, Trash2, FolderOpen, ExternalLink } from "lucide-react";
import { api, fileToPayload } from "@/lib/api";
import { useRefresh } from "@/lib/data";
import { DOC_CATEGORIES, DOC_CATEGORY_LABEL } from "@shared/constants";
import { EmptyState } from "@/components/ui";
import { formatDate } from "@shared/format";
import type { DocCategory, DocumentRow } from "@shared/types";

function fileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsTab({
  clientId,
  documents,
}: {
  clientId: string;
  documents: DocumentRow[];
}) {
  const refresh = useRefresh();
  const [pending, setPending] = useState(false);
  const [category, setCategory] = useState<DocCategory>("cnh");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPending(true);
    const payload = await fileToPayload(file);
    const r = await api.uploadDocument(clientId, category, payload);
    if (!r.ok) setError(r.error ?? "Erro no upload");
    if (fileRef.current) fileRef.current.value = "";
    setPending(false);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-end gap-4 p-4">
        <div className="flex-1 min-w-48">
          <label className="label">Categoria</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as DocCategory)}
          >
            {DOC_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <input ref={fileRef} type="file" hidden onChange={onFileChange} />
        <button
          className="btn btn-primary"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Enviar documento
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}

      {documents.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={24} />}
          title="Nenhum documento"
          description="Envie CNH, documento do veículo, contratos e apólices em PDF."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {documents.map((d) => (
            <div key={d.id} className="card flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                <FileText size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-faint">
                  {d.category ? DOC_CATEGORY_LABEL[d.category] : "Documento"} ·{" "}
                  {fileSize(d.file_size)} · {formatDate(d.created_at)}
                </p>
              </div>
              {d.file_path && (
                <button
                  onClick={() => api.openFile(d.file_path!)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-accent"
                  title="Abrir documento"
                >
                  <ExternalLink size={15} />
                </button>
              )}
              <DeleteDoc id={d.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteDoc({ id }: { id: string }) {
  const refresh = useRefresh();
  const [pending, setPending] = useState(false);
  return (
    <button
      className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-danger"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await api.deleteDocument(id);
        setPending(false);
        refresh();
      }}
      title="Excluir"
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  );
}
