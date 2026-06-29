import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { SearchResult } from "@shared/types";

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setPending(true);
      const r = await api.search(q);
      setResults(r);
      setOpen(true);
      setPending(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQ("");
    navigate(href);
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2.5">
        {pending ? (
          <Loader2 size={16} className="animate-spin text-faint" />
        ) : (
          <Search size={16} className="text-faint" />
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Buscar cliente, apólice, seguradora…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-faint"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => go(r.href)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent">
                {r.type === "cliente" ? <User size={15} /> : <FileText size={15} />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{r.title}</span>
                <span className="block truncate text-xs text-muted">
                  {r.subtitle}
                </span>
              </span>
              <span className="badge badge-gray ml-auto capitalize">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
