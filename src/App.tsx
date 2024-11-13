import { useClipboardManager } from "./hooks/useClipboardManager";
import { useTheme } from "./hooks/useTheme";
import "./App.css";

function App() {
  const { items, copyToClipboard } = useClipboardManager();
  const { isDark } = useTheme();

  return (
    <div className={`app ${isDark ? "dark" : "light"}`}>
      <div className="clipboard-list">
        {items.map((item) => (
          <div
            key={item.id}
            className="clipboard-item"
            onClick={() => copyToClipboard(item.content)}
          >
            <div className="content">{item.content}</div>
            <div className="hover-tip">点击复制</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
