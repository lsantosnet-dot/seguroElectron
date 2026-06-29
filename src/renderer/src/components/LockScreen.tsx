import { useState } from "react";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Tela de acesso local. Em primeira execução (sem PIN definido) pede para
 * criar uma senha; nas próximas vezes, pede a senha para destravar.
 */
export function LockScreen({
  mode,
  onUnlocked,
}: {
  mode: "create" | "unlock";
  onUnlocked: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    if (mode === "create") {
      if (pin !== confirm) {
        setPending(false);
        return setError("As senhas não conferem");
      }
      const r = await api.auth.set(pin);
      setPending(false);
      if (!r.ok) return setError(r.error ?? "Erro");
      onUnlocked();
    } else {
      const ok = await api.auth.verify(pin);
      setPending(false);
      if (!ok) {
        setPin("");
        return setError("Senha incorreta");
      }
      onUnlocked();
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <form onSubmit={submit} className="card w-full max-w-sm space-y-5 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
            {mode === "create" ? <ShieldCheck size={26} /> : <Lock size={26} />}
          </div>
          <h1 className="mt-4 text-xl font-bold">Apólice</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "create"
              ? "Crie uma senha de acesso para proteger seus dados."
              : "Digite sua senha para acessar."}
          </p>
        </div>

        <div>
          <label className="label">Senha</label>
          <input
            className="input"
            type="password"
            value={pin}
            autoFocus
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••••"
          />
        </div>

        {mode === "create" && (
          <div>
            <label className="label">Confirmar senha</label>
            <input
              className="input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••"
            />
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button className="btn btn-primary w-full" disabled={pending || !pin}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {mode === "create" ? "Criar senha e entrar" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
