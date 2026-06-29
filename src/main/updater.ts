// Atualização automática via GitHub (repositório público).
// O electron-updater lê o repositório do app-update.yml gerado pelo
// electron-builder a partir do bloco `publish` do electron-builder.yml.
//
// Comportamento: ao iniciar, se houver rede, verifica se há versão nova no
// GitHub. Se houver, avisa o usuário; ele decide baixar e instalar.
import { autoUpdater } from "electron-updater";
import { BrowserWindow, ipcMain, net } from "electron";

let mainWindow: BrowserWindow | null = null;

function send(channel: string, payload?: unknown) {
  mainWindow?.webContents.send(channel, payload);
}

export function initAutoUpdate(win: BrowserWindow) {
  mainWindow = win;

  // Não baixa sozinho — só avisa. O download é disparado pelo usuário.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    send("updater:status", { state: "available", version: info.version });
  });
  autoUpdater.on("update-not-available", () => {
    send("updater:status", { state: "none" });
  });
  autoUpdater.on("error", (err) => {
    send("updater:status", { state: "error", message: String(err?.message ?? err) });
  });
  autoUpdater.on("download-progress", (p) => {
    send("updater:status", { state: "downloading", percent: Math.round(p.percent) });
  });
  autoUpdater.on("update-downloaded", (info) => {
    send("updater:status", { state: "downloaded", version: info.version });
  });

  // Verifica ao iniciar, somente se houver rede.
  if (net.isOnline()) {
    // pequeno atraso para não competir com a inicialização da janela
    setTimeout(() => checkForUpdates(), 3000);
  }

  // IPC para o renderer disparar ações
  ipcMain.handle("updater:check", () => checkForUpdates());
  ipcMain.handle("updater:download", () => autoUpdater.downloadUpdate());
  ipcMain.handle("updater:install", () => autoUpdater.quitAndInstall());
}

export async function checkForUpdates() {
  if (!net.isOnline()) {
    send("updater:status", { state: "offline" });
    return { ok: false, reason: "offline" };
  }
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (e: any) {
    send("updater:status", { state: "error", message: String(e?.message ?? e) });
    return { ok: false, reason: "error" };
  }
}
