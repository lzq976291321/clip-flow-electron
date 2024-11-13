interface Window {
  electron: {
    clipboard: {
      readText: () => string;
      writeText: (text: string) => boolean;
    };
    ipcRenderer: {
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeListener: (
        channel: string,
        callback: (...args: any[]) => void
      ) => void;
    };
  };
}
