import { recordVisitTime, getSettings, isBlacklisted } from '../storage/db';

interface TrackingState {
  activeTabId: number | null;
  activeUrl: string | null;
  activeTitle: string | null;
  windowFocused: boolean;
  userActiveInContent: boolean;
  lastFlushTime: number;
  lastUserActivityTime: number;
}

let state: TrackingState = {
  activeTabId: null,
  activeUrl: null,
  activeTitle: null,
  windowFocused: true,
  userActiveInContent: true,
  lastFlushTime: Date.now(),
  lastUserActivityTime: Date.now(),
};

// 刷新并保存从 lastFlushTime 到当前时间点的真实毫秒数
async function flushCurrentTime() {
  const now = Date.now();
  const elapsedMs = now - state.lastFlushTime;
  state.lastFlushTime = now;

  if (elapsedMs <= 0) return;
  if (!state.windowFocused || !state.activeUrl) return;

  const settings = await getSettings();

  let domain = '';
  try {
    domain = new URL(state.activeUrl).hostname;
  } catch {
    return;
  }

  if (isBlacklisted(domain, settings.blacklist)) {
    return;
  }

  const idleThresholdMs = settings.idleThresholdSeconds * 1000;
  const isUserActive = state.userActiveInContent && (now - state.lastUserActivityTime <= idleThresholdMs);

  await recordVisitTime(
    state.activeUrl,
    state.activeTitle || domain,
    elapsedMs, // 准确累加真实经过的时间毫秒数 (openTimeMs)
    isUserActive ? elapsedMs : 0 // 活跃时间毫秒数 (activeTimeMs)
  );
}

// 切换标签页、焦点或路由时，先刷新旧页面累计时间，再重置时间戳起点
async function switchActiveTab(newTabId: number | null, newUrl: string | null, newTitle: string | null) {
  await flushCurrentTime();
  state.activeTabId = newTabId;
  state.activeUrl = newUrl;
  state.activeTitle = newTitle || '';
  state.lastFlushTime = Date.now();
}

async function updateActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && tab.url) {
      await switchActiveTab(tab.id, tab.url, tab.title || '');
    } else {
      await switchActiveTab(null, null, null);
    }
  } catch (err) {
    console.error('Failed to query active tab:', err);
  }
}

// Service Worker 存活期间每 3 秒刷新写入一次
setInterval(async () => {
  await flushCurrentTime();
}, 3000);

// 保底 Alarm（防休眠唤醒）
chrome.alarms.create('FLUSH_ALARM', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'FLUSH_ALARM') {
    await flushCurrentTime();
  }
});

// 监听标签页激活
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await switchActiveTab(tab.id || null, tab.url || null, tab.title || '');
  } catch (err) {
    console.error('Error handling onActivated:', err);
  }
});

// 监听标签页更新（如导航至新 URL）
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === state.activeTabId && changeInfo.url) {
    await switchActiveTab(tabId, changeInfo.url, tab.title || '');
  }
});

// 监听窗口焦点变化
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await flushCurrentTime();
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    state.windowFocused = false;
  } else {
    state.windowFocused = true;
    await updateActiveTab();
  }
});

// 监听来自 Content Script 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'USER_ACTIVITY') {
    state.userActiveInContent = true;
    state.lastUserActivityTime = Date.now();
    sendResponse({ status: 'ok' });
  } else if (message.type === 'GET_CURRENT_STATUS') {
    sendResponse({
      activeUrl: state.activeUrl,
      activeTitle: state.activeTitle,
      windowFocused: state.windowFocused,
      userActive: state.userActiveInContent,
    });
  }
  return true;
});

// 结合 chrome.idle API 监听系统空闲状态
if (chrome.idle) {
  chrome.idle.onStateChanged.addListener(async (newState) => {
    await flushCurrentTime();
    if (newState === 'active') {
      state.userActiveInContent = true;
      state.lastUserActivityTime = Date.now();
    } else {
      state.userActiveInContent = false;
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.idle) chrome.idle.setDetectionInterval(180);
  updateActiveTab();
});

chrome.runtime.onStartup.addListener(() => {
  if (chrome.idle) chrome.idle.setDetectionInterval(180);
  updateActiveTab();
});
