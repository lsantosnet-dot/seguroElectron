import { contextBridge, ipcRenderer } from "electron";

const invoke = (channel: string, ...args: unknown[]) =>
  ipcRenderer.invoke(channel, ...args);

const api = {
  // ---- Queries ----
  getClientsWithStats: () => invoke("db:getClientsWithStats"),
  getClientsList: () => invoke("db:getClientsList"),
  getClient: (id: string) => invoke("db:getClient", id),
  getClientPolicies: (clientId: string) => invoke("db:getClientPolicies", clientId),
  getClientQuotes: (clientId: string) => invoke("db:getClientQuotes", clientId),
  getClientClaims: (clientId: string) => invoke("db:getClientClaims", clientId),
  getClientDocuments: (clientId: string) => invoke("db:getClientDocuments", clientId),
  getClientComments: (clientId: string) => invoke("db:getClientComments", clientId),
  getClientInstallments: (clientId: string) =>
    invoke("db:getClientInstallments", clientId),
  getPolicyInstallments: (policyId: string) =>
    invoke("db:getPolicyInstallments", policyId),
  getQuote: (id: string) => invoke("db:getQuote", id),
  getDashboardData: () => invoke("db:getDashboardData"),
  getShellData: () => invoke("db:getShellData"),
  getAgenda: () => invoke("db:getAgenda"),
  getAllClaims: () => invoke("db:getAllClaims"),
  search: (q: string) => invoke("db:search", q),

  // ---- Mutações ----
  createClient: (input: unknown) => invoke("db:createClient", input),
  updateClient: (id: string, input: unknown) => invoke("db:updateClient", id, input),
  deleteClient: (id: string) => invoke("db:deleteClient", id),
  addComment: (clientId: string, channel: string, body: string) =>
    invoke("db:addComment", clientId, channel, body),
  deleteComment: (id: string) => invoke("db:deleteComment", id),
  addClaim: (input: unknown) => invoke("db:addClaim", input),
  updateClaimStatus: (id: string, status: string) =>
    invoke("db:updateClaimStatus", id, status),
  uploadDocument: (clientId: string, category: string, file: unknown) =>
    invoke("db:uploadDocument", clientId, category, file),
  deleteDocument: (id: string) => invoke("db:deleteDocument", id),
  togglePaidInstallment: (id: string, paid: boolean) =>
    invoke("db:togglePaidInstallment", id, paid),
  createQuote: (input: unknown) => invoke("db:createQuote", input),
  addQuoteOption: (quoteId: string, input: unknown) =>
    invoke("db:addQuoteOption", quoteId, input),
  markBestOption: (quoteId: string, optionId: string) =>
    invoke("db:markBestOption", quoteId, optionId),
  deleteQuoteOption: (optionId: string) => invoke("db:deleteQuoteOption", optionId),
  deleteQuote: (quoteId: string) => invoke("db:deleteQuote", quoteId),
  officializeQuote: (input: unknown) => invoke("db:officializeQuote", input),
  createPolicy: (input: unknown) => invoke("db:createPolicy", input),
  setGoal: (month: string, target: number) => invoke("db:setGoal", month, target),
  importBundle: (json: string) => invoke("db:importBundle", json),

  // ---- Backup / arquivos ----
  exportBackup: () => invoke("backup:export"),
  openFile: (path: string) => invoke("files:open", path),

  // ---- Autenticação local ----
  auth: {
    has: () => invoke("auth:has"),
    verify: (pin: string) => invoke("auth:verify", pin),
    set: (pin: string) => invoke("auth:set", pin),
    change: (current: string, next: string) => invoke("auth:change", current, next),
  },

  // ---- Atualizações (auto-update via GitHub) ----
  updater: {
    check: () => invoke("updater:check"),
    download: () => invoke("updater:download"),
    install: () => invoke("updater:install"),
    onStatus: (cb: (payload: any) => void) => {
      const listener = (_e: unknown, payload: any) => cb(payload);
      ipcRenderer.on("updater:status", listener);
      return () => ipcRenderer.removeListener("updater:status", listener);
    },
  },
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
