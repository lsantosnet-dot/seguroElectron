import { app, shell, BrowserWindow, session } from "electron";
import { join } from "path";
import { registerIpc } from "./ipc";
import { initAutoUpdate } from "./updater";

let mainWindow: BrowserWindow | null = null;
const isDev = !!process.env["ELECTRON_RENDERER_URL"];

// Em produção, aplica uma Content-Security-Policy estrita (o conteúdo é todo
// local). Em dev não aplicamos para não quebrar o HMR/scripts do Vite.
function applyProdCsp() {
  if (isDev) return;
  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'",
        ],
      },
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 640,
    show: false,
    backgroundColor: "#0a0e0d",
    autoHideMenuBar: true,
    title: "Apólice — Gestão de Seguros",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => mainWindow?.show());

  // links externos abrem no navegador padrão, não dentro do app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // electron-vite injeta ELECTRON_RENDERER_URL em desenvolvimento
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  initAutoUpdate(mainWindow);
}

app.whenReady().then(() => {
  applyProdCsp();
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
