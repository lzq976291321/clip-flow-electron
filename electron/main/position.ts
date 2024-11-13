import { screen } from "electron";

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

export default calculateWindowPosition;
