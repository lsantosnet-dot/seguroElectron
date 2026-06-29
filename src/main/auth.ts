// Trava de acesso local (PIN/senha). Sem servidor: guarda apenas um hash
// scrypt na tabela `settings` do próprio banco local.
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { getDb } from "./db";

const KEY = "auth_pin";

function getStored(): string | null {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(KEY) as { value: string | null } | undefined;
  return row?.value ?? null;
}

export function hasPin(): boolean {
  return !!getStored();
}

export function setPin(pin: string): { ok: boolean; error?: string } {
  if (!pin || pin.length < 4)
    return { ok: false, error: "Use ao menos 4 caracteres" };
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .run(KEY, `${salt}:${hash}`);
  return { ok: true };
}

export function verifyPin(pin: string): boolean {
  const stored = getStored();
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(pin, salt, 64);
  const original = Buffer.from(hash, "hex");
  return (
    candidate.length === original.length &&
    timingSafeEqual(candidate, original)
  );
}

export function changePin(
  current: string,
  next: string,
): { ok: boolean; error?: string } {
  if (hasPin() && !verifyPin(current))
    return { ok: false, error: "Senha atual incorreta" };
  return setPin(next);
}
