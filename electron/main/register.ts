import { globalShortcut, BrowserWindow } from "electron";
import calculateWindowPosition from "./position";

let isWindowCreated = false;

function registerShortcut(mainWindow: BrowserWindow) {
  // 确保只有一个窗口实例
  if (isWindowCreated) return;
  isWindowCreated = true;

  // 处理窗口显示/隐藏的统一函数
  const toggleWindow = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      const { x, y } = calculateWindowPosition(440, 1200);
      mainWindow.setPosition(x, y);
      mainWindow.show();
      mainWindow.focus();
    }
  };

  // 注册 CMD+SHIFT+V 快捷键
  globalShortcut.register("CommandOrControl+Shift+V", toggleWindow);

  // 注册窗口级别的 ESC 事件
  mainWindow.webContents.on("before-input-event", (event, input) => {
    // 只在窗口激活且按下 ESC 键时处理
    if (input.key === "Escape" && mainWindow.isFocused()) {
      mainWindow.hide();
    }
  });

  // 注册开发者工具快捷键
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isFocused()) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // 监听窗口失去焦点事件
  mainWindow.on("blur", () => {
    if (!mainWindow.isDestroyed() && mainWindow.isVisible()) {
      mainWindow.hide();
    }
  });
}

export default registerShortcut;
