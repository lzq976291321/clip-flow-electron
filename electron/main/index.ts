import {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
} from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

import { exec } from "child_process";

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
let lastText = "";

// 获取鼠标位置并计算窗口位置
function calculateWindowPosition(width: number, height: number) {
  // 获取鼠标位置
  const mousePosition = screen.getCursorScreenPoint();
  // 获取主显示器边界
  const displayBounds = screen.getDisplayNearestPoint(mousePosition).workArea;

  // 初始位置：鼠标位置
  let x = mousePosition.x;
  let y = mousePosition.y;

  // 确保窗口不会超出右边界
  if (x + width > displayBounds.x + displayBounds.width) {
    x = displayBounds.x + displayBounds.width - width;
  }

  // 确保窗口不会超出左边界
  if (x < displayBounds.x) {
    x = displayBounds.x;
  }

  // 确保窗口不会超出底部边界
  if (y + height > displayBounds.y + displayBounds.height) {
    y = displayBounds.y + displayBounds.height - height;
  }

  // 确保窗口不会超出顶部边界
  if (y < displayBounds.y) {
    y = displayBounds.y;
  }

  return { x, y };
}

function startClipboardWatcher() {
  console.log("开始监听剪贴板");
  // 定期检查剪贴板
  const timer = setInterval(() => {
    try {
      const currentText = clipboard.readText().trim();

      // 检查是否有新内容
      if (currentText && currentText !== lastText) {
        console.log("检测到新内容:", currentText);
        lastText = currentText;
        mainWindow?.webContents.send("clipboard-update", currentText);
      }
    } catch (error) {
      console.error("读取剪贴板错误:", error);
    }
  }, 1000); // 每秒检查一次

  // 清理函数
  app.on("will-quit", () => {
    clearInterval(timer);
  });
}

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
    alwaysOnTop: true,
    show: false,
  });

  // 打开开发者工具
  // mainWindow.webContents.openDevTools({ mode: "detach" });

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

// 检查系统剪贴板服务
function checkClipboardService() {
  exec("pgrep pboard", (error, stdout) => {
    if (error) {
      console.error("剪贴板服务检查失败:", error);
    } else {
      console.log("剪贴板服务 PID:", stdout.trim());
    }
  });
}

// 注册全局快捷键
function registerShortcut() {
  globalShortcut.register("CommandOrControl+Shift+V", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        // 计算新位置
        const { x, y } = calculateWindowPosition(440, 1200);

        // 设置窗口位置
        mainWindow.setPosition(x, y);

        // 显示窗口
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// 应用初始化
app.whenReady().then(() => {
  console.log("主进程: 应用就绪");
  checkClipboardService();

  createWindow();
  registerShortcut();
  startClipboardWatcher();

  // macOS 专用的激活处理
  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

// 退出前清理
app.on("will-quit", () => {
  console.log("主进程: 应用退出");
  globalShortcut.unregisterAll();
});

// 当所有窗口关闭时不退出应用
app.on("window-all-closed", (e: any) => {
  e.preventDefault();
});

// 点击 dock 图标时显示窗口
app.on("activate", () => {
  mainWindow?.show();
});
