import {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
} from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

import registerShortcut from "./register";
import { checkClipboardService, startClipboardWatcher } from "./clipboard";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;

// 处理复制请求
ipcMain.on("copy-text", (_, text) => {
  try {
    clipboard.writeText(text);
  } catch (error) {
    console.error("写入剪贴板错误:", error);
  }
});

// 创建窗口时的设置
function createWindow() {
  console.log("主进程: 创建窗口");

  mainWindow = new BrowserWindow({
    width: 440,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "../preload/index.mjs"),
    },
    frame: false,
    type: "toolbar",
    resizable: false,
    alwaysOnTop: true,
    show: false,
  });

  // 处理主页面路径
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexHtml = path.join(__dirname, "../../dist/index.html");
    console.log("主页面路径:", indexHtml);
    mainWindow.loadFile(indexHtml);
  }

  // 监听加载错误
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("页面加载失败:", {
        errorCode,
        errorDescription,
        currentURL: mainWindow?.webContents.getURL(),
      });
    }
  );
}

// 应用初始化
app.whenReady().then(() => {
  console.log("主进程: 应用就绪");
  checkClipboardService();

  createWindow();

  // 注册快捷键
  if (mainWindow) {
    registerShortcut(mainWindow);
    startClipboardWatcher(mainWindow);
  }
});

// 退出前清理
app.on("will-quit", () => {
  console.log("主进程: 应用退出");
  globalShortcut.unregisterAll();
});

// 点击 dock 图标时显示窗口
app.on("activate", () => {
  mainWindow?.show();
});

// 添加错误处理
process.on("uncaughtException", (error) => {
  console.error("未捕获的异常:", error);
});
