import { recordVisitTime, getSettings, isBlacklisted } from '../storage/db';

interface TrackingState {
  activeTabId: number | null;
  activeUrl: string | null;
  activeTitle: string | null;
  windowFocused: boolean;
  userActiveInContent: boolean;
  lastActiveTime: number;
}

let state: TrackingState = {
  activeTabId: null,
  activeUrl: null,
  activeTitle: null,
  windowFocused: true,
  userActiveInContent: true,
  lastActiveTime: Date.now(),
};

// 每秒更新定时器
const ALARM_NAME = 'TRACKING_TICK';

async function initTracker() {
  await chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 / 60 }); // 每秒触发一次
  await updateActiveTab();
}

async function updateActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && tab.url) {
      state.activeTabId = tab.id;
      state.activeUrl = tab.url;
      state.activeTitle = tab.title || '';
    } else {
      state.activeTabId = null;
      state.activeUrl = null;
      state.activeTitle = null;
    }
  } catch (err) {
    console.error('Failed to query active tab:', err);
  }
}

// 定时器心跳回调：累加驻留与活跃时间
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

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

  // 判断是否超出空闲阈值
  const now = Date.now();
  const idleThresholdMs = settings.idleThresholdSeconds * 1000;
  const isUserActive = state.userActiveInContent && (now - state.lastActiveTime <= idleThresholdMs);

  // 每秒记录 1000ms 驻留时间，以及（若活跃）1000ms 活跃时间
  await recordVisitTime(
    state.activeUrl,
    state.activeTitle || domain,
    1000, // 驻留时长
    isUserActive ? 1000 : 0 // 活跃时长
  );
});

// 监听标签页切换
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    state.activeTabId = tab.id || null;
    state.activeUrl = tab.url || null;
    state.activeTitle = tab.title || '';
    state.lastActiveTime = Date.now();
  } catch (err) {
    console.error('Error handling onActivated:', err);
  }
});

// 监听标签页更新（如URL变化）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === state.activeTabId && changeInfo.url) {
    state.activeUrl = changeInfo.url;
    state.activeTitle = tab.title || '';
    state.lastActiveTime = Date.now();
  }
});

// 监听窗口焦点变化
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    state.windowFocused = false;
  } else {
    state.windowFocused = true;
    updateActiveTab();
    state.lastActiveTime = Date.now();
  }
});

// 监听来自 Content Script / Popup 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'USER_ACTIVITY') {
    state.userActiveInContent = true;
    state.lastActiveTime = Date.now();
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

// 插件启动初始化
chrome.runtime.onInstalled.addListener(() => {
  initTracker();
});

chrome.runtime.onStartup.addListener(() => {
  initTracker();
});
