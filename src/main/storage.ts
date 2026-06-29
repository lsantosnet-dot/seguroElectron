// Armazenamento local de arquivos (documentos e PDFs de cotação).
// Substitui o Supabase Storage do projeto original. Os arquivos ficam em
// userData/data/files, ao lado do banco — fora da pasta do app.
import { join } from "path";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { randomUUID } from "crypto";
import { dataDir } from "./db";

export function filesDir(): string {
  const dir = join(dataDir(), "files");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeName(name: string): string {
  return name.replace(/[^\w.\-]/g, "_");
}

/**
 * Salva um buffer numa subpasta (scope) e retorna o caminho absoluto + tamanho.
 * scope: ex. clientId, ou "cotacoes/<quoteId>".
 */
export function saveFile(
  scope: string,
  originalName: string,
  data: Uint8Array,
): { path: string; size: number } {
  const dir = join(filesDir(), ...scope.split("/").map(safeName));
  mkdirSync(dir, { recursive: true });
  const target = join(dir, `${randomUUID()}-${safeName(originalName)}`);
  const buffer = Buffer.from(data);
  writeFileSync(target, buffer);
  return { path: target, size: buffer.length };
}

export function removeFile(path: string | null | undefined) {
  if (!path) return;
  try {
    rmSync(path, { force: true });
  } catch {
    /* ignora */
  }
}
