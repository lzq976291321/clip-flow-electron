import { contextBridge, ipcRenderer } from "electron";

// 定义类型
type Callback = (text: string) => void;
const callbacks = new Set<Callback>();

// 创建一个本地的事件处理器
ipcRenderer.on("clipboard-update", (_, text: string) => {
  callbacks.forEach((callback) => callback(text));
});

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld("clipboardManager", {
  onClipboardChange(callback: Callback) {
    callbacks.add(callback);
    return () => callbacks.delete(callback);
  },
  copyText(text: string) {
    ipcRenderer.send("copy-text", text);
  },
});

// 添加错误处理
window.addEventListener("error", (event) => {
  console.error("渲染进程错误:", event.error);
});

// 确保在使用 IPC 时检查窗口状态
const safeIpc = {
  send: (channel: string, ...args: any[]) => {
    if (!window.electron) return;
    ipcRenderer.send(channel, ...args);
  },
};

// 导出安全的 IPC 调用
contextBridge.exposeInMainWorld("safeIpc", safeIpc);
