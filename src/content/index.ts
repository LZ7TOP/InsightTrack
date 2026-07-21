// Content script: 检测当前页面用户交互事件（鼠标移动、点击、按键、滚动）

let lastReportTime = 0;
const REPORT_INTERVAL_MS = 3000; // 每 3 秒最多向后台上报一次活跃状态

function notifyActivity() {
  const now = Date.now();
  if (now - lastReportTime >= REPORT_INTERVAL_MS) {
    lastReportTime = now;
    try {
      chrome.runtime.sendMessage({ type: 'USER_ACTIVITY' }).catch(() => {
        // 捕获与 Service Worker 通信断开的异常，无须报错
      });
    } catch {
      // 忽略未就绪阶段的错误
    }
  }
}

// 绑定用户交互事件
const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

events.forEach((eventName) => {
  window.addEventListener(eventName, notifyActivity, { passive: true });
});

// 页面可见性改变时也发送状态通知
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    notifyActivity();
  }
});
