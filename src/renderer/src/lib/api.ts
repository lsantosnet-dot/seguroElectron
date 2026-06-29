// Acesso à API exposta pelo preload (window.api). Toda leitura/escrita do
// banco e ações passam por aqui (IPC -> processo main -> SQLite).
export const api = window.api;

export type { Api, FilePayload, UpdaterStatus } from "../../../preload/index.d";

/** Lê um File (input type=file) como payload serializável para o IPC. */
export async function fileToPayload(file: File): Promise<{
  name: string;
  size: number;
  data: Uint8Array;
}> {
  const buf = await file.arrayBuffer();
  return { name: file.name, size: file.size, data: new Uint8Array(buf) };
}
