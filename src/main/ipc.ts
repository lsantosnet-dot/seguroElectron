// Registro dos handlers IPC: expõe o repositório (banco) e ações ao renderer.
import { ipcMain, shell, dialog, BrowserWindow } from "electron";
import { writeFileSync } from "fs";
import * as repo from "./repo";
import * as auth from "./auth";

type Handler = (...args: any[]) => any;

export function registerIpc() {
  const handlers: Record<string, Handler> = {
    // ---- Queries ----
    "db:getClientsWithStats": () => repo.getClientsWithStats(),
    "db:getClientsList": () => repo.getClientsList(),
    "db:getClient": (id: string) => repo.getClient(id),
    "db:getClientPolicies": (clientId: string) => repo.getClientPolicies(clientId),
    "db:getClientQuotes": (clientId: string) => repo.getClientQuotes(clientId),
    "db:getClientClaims": (clientId: string) => repo.getClientClaims(clientId),
    "db:getClientDocuments": (clientId: string) => repo.getClientDocuments(clientId),
    "db:getClientComments": (clientId: string) => repo.getClientComments(clientId),
    "db:getClientInstallments": (clientId: string) =>
      repo.getClientInstallments(clientId),
    "db:getPolicyInstallments": (policyId: string) =>
      repo.getPolicyInstallments(policyId),
    "db:getQuote": (id: string) => repo.getQuote(id),
    "db:getDashboardData": () => repo.getDashboardData(),
    "db:getShellData": () => repo.getShellData(),
    "db:getAgenda": () => repo.getAgenda(),
    "db:getAllClaims": () => repo.getAllClaims(),
    "db:search": (q: string) => repo.search(q),

    // ---- Mutações ----
    "db:createClient": (input: any) => repo.createClient(input),
    "db:updateClient": (id: string, input: any) => repo.updateClient(id, input),
    "db:deleteClient": (id: string) => repo.deleteClient(id),
    "db:addComment": (clientId: string, channel: any, body: string) =>
      repo.addComment(clientId, channel, body),
    "db:deleteComment": (id: string) => repo.deleteComment(id),
    "db:addClaim": (input: any) => repo.addClaim(input),
    "db:updateClaimStatus": (id: string, status: any) =>
      repo.updateClaimStatus(id, status),
    "db:uploadDocument": (clientId: string, category: any, file: any) =>
      repo.uploadDocument(clientId, category, file),
    "db:deleteDocument": (id: string) => repo.deleteDocument(id),
    "db:togglePaidInstallment": (id: string, paid: boolean) =>
      repo.togglePaidInstallment(id, paid),
    "db:createQuote": (input: any) => repo.createQuote(input),
    "db:addQuoteOption": (quoteId: string, input: any) =>
      repo.addQuoteOption(quoteId, input),
    "db:markBestOption": (quoteId: string, optionId: string) =>
      repo.markBestOption(quoteId, optionId),
    "db:deleteQuoteOption": (optionId: string) => repo.deleteQuoteOption(optionId),
    "db:deleteQuote": (quoteId: string) => repo.deleteQuote(quoteId),
    "db:officializeQuote": (input: any) => repo.officializeQuote(input),
    "db:createPolicy": (input: any) => repo.createPolicy(input),
    "db:setGoal": (month: string, target: number) => repo.setGoal(month, target),
    "db:importBundle": (json: string) => repo.importBundle(json),

    // ---- Backup (exportação via diálogo de salvar) ----
    "backup:export": async () => {
      const bundle = repo.getExportBundle();
      const date = new Date().toISOString().slice(0, 10);
      const win = BrowserWindow.getFocusedWindow();
      const res = await dialog.showSaveDialog(win!, {
        title: "Salvar backup",
        defaultPath: `apolice-backup-${date}.json`,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (res.canceled || !res.filePath) return { ok: false, canceled: true };
      writeFileSync(res.filePath, JSON.stringify(bundle, null, 2), "utf-8");
      return { ok: true, path: res.filePath };
    },

    // ---- Arquivos (abrir documento/PDF no app padrão do SO) ----
    "files:open": async (path: string) => {
      if (!path) return { ok: false };
      const err = await shell.openPath(path);
      return { ok: !err, error: err || undefined };
    },

    // ---- Autenticação local (PIN/senha) ----
    "auth:has": () => auth.hasPin(),
    "auth:verify": (pin: string) => auth.verifyPin(pin),
    "auth:set": (pin: string) => auth.setPin(pin),
    "auth:change": (current: string, next: string) =>
      auth.changePin(current, next),
  };

  for (const [channel, fn] of Object.entries(handlers)) {
    ipcMain.handle(channel, (_e, ...args) => fn(...args));
  }
}
