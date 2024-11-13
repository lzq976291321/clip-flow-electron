import { useState, useEffect } from "react";

interface ClipboardItem {
  id: string;
  content: string;
}

const STORAGE_KEY = "clipboard_history";
const MAX_ITEMS = 100; // 最大保存数量

declare global {
  interface Window {
    clipboardManager: {
      onClipboardChange: (callback: (text: string) => void) => () => void;
      copyText: (text: string) => void;
    };
  }
}

export const useClipboardManager = () => {
  const [items, setItems] = useState<ClipboardItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("读取本地存储失败:", error);
      return [];
    }
  });

  const copyToClipboard = (text: string) => {
    window.clipboardManager.copyText(text);
  };

  useEffect(() => {
    // 注册剪贴板变化监听
    const cleanup = window?.clipboardManager.onClipboardChange((text) => {
      if (!text) return;

      setItems((prev) => {
        if (prev.some((item) => item.content === text)) {
          return prev;
        }

        const newItems = [
          {
            id: Date.now().toString(),
            content: text,
          },
          ...prev,
        ].slice(0, MAX_ITEMS);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        return newItems;
      });
    });

    return cleanup;
  }, []);

  return {
    items,
    copyToClipboard,
  };
};

export type { ClipboardItem };
