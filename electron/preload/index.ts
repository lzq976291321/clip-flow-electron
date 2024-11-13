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
