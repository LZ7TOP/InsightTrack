import {
  recordVisitTime,
  getSettings,
  isBlacklisted,
  cleanDomain,
  getLocalDateStr,
  getVisitLogsByDateRange,
} from '../storage/db'

interface TrackingState {
  windowFocused: boolean
  userActiveInContent: boolean
  lastFlushTime: number
  lastUserActivityTime: number
}

let state: TrackingState = {
  windowFocused: true,
  userActiveInContent: true,
  lastFlushTime: Date.now(),
  lastUserActivityTime: Date.now(),
}

// 刷新并保存从 lastFlushTime 到当前时间点所有打开标签页的驻留与活跃时长
async function flushCurrentTime() {
  const now = Date.now()
  const elapsedMs = now - state.lastFlushTime
  state.lastFlushTime = now

  if (elapsedMs <= 0) return

  try {
    // 1. 查询浏览器中所有打开的标签页
    const allTabs = await chrome.tabs.query({})
    if (!allTabs || allTabs.length === 0) return

    // 2. 查询当前正在聚焦窗口中的活跃标签页
    const [focusedActiveTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const focusedTabId = state.windowFocused && focusedActiveTab ? focusedActiveTab.id : null

    const settings = await getSettings()
    const idleThresholdMs = settings.idleThresholdSeconds * 1000
    const isUserActive = settings.enableIdleDetection
      ? state.windowFocused &&
        state.userActiveInContent &&
        now - state.lastUserActivityTime <= idleThresholdMs
      : state.windowFocused

    // 3. 遍历所有打开的标签页分别累加时间
    for (const tab of allTabs) {
      if (!tab.url) continue

      let domain = ''
      try {
        domain = cleanDomain(new URL(tab.url).hostname)
      } catch {
        continue
      }

      if (!domain || isBlacklisted(domain, settings.blacklist)) {
        continue
      }

      const isThisActiveTab = tab.id === focusedTabId

      // 所有打开的标签页均累加“驻留时间”
      // 只有当前正在前台前置聚焦且有交互的标签页累加“活跃时间”
      const openMs = elapsedMs
      const activeMs = isThisActiveTab && isUserActive ? elapsedMs : 0

      await recordVisitTime(tab.url, tab.title || domain, openMs, activeMs)
    }
  } catch (err) {
    console.error('Error in flushCurrentTime:', err)
  }
}

// 实时更新扩展图标在 Chrome 工具栏右上的 Badge 角标文本
async function updateBadge() {
  try {
    const settings = await getSettings()
    if (!settings.showBadge) {
      await chrome.action.setBadgeText({ text: '' })
      return
    }

    // 优先获取主浏览器窗口中的活跃标签页
    let tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    let tab = tabs && tabs[0]

    // 如果所在标签页是插件自身的页面或浏览器内置不可追踪页面，则查找常规浏览器窗口的激活标签页
    if (
      !tab ||
      !tab.url ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('about:') ||
      tab.url.startsWith('chrome-search://')
    ) {
      const normalTabs = await chrome.tabs.query({ active: true, windowType: 'normal' })
      if (normalTabs && normalTabs.length > 0) {
        tab = normalTabs[0]
      }
    }

    if (!tab || !tab.url) {
      await chrome.action.setBadgeText({ text: '' })
      return
    }

    let domain = ''
    try {
      domain = cleanDomain(new URL(tab.url).hostname)
    } catch {
      await chrome.action.setBadgeText({ text: '' })
      return
    }

    if (!domain || isBlacklisted(domain, settings.blacklist)) {
      await chrome.action.setBadgeText({ text: '' })
      return
    }

    const todayStr = getLocalDateStr()
    const logs = await getVisitLogsByDateRange(todayStr, todayStr)
    const domainLogs = logs.filter((l) => cleanDomain(l.domain) === domain)

    let activeMs = domainLogs.reduce((acc, cur) => acc + cur.activeTimeMs, 0)

    const totalSec = Math.floor(activeMs / 1000)

    let text = ''
    if (totalSec <= 0) {
      // 0 秒或未产生活跃时长时，无需展示角标
      text = ''
    } else if (totalSec < 60) {
      // 1-59 秒
      text = `${totalSec}s`
    } else {
      const mins = Math.floor(totalSec / 60)
      if (mins < 60) {
        // 60秒之后显示 X分 (e.g. 1m, 2m...)
        text = `${mins}m`
      } else {
        // 60分后显示不变，一直60分
        text = '60m'
      }
    }

    await chrome.action.setBadgeBackgroundColor({ color: '#2563EB' })
    if (chrome.action.setBadgeTextColor) {
      await chrome.action.setBadgeTextColor({ color: '#FFFFFF' })
    }
    await chrome.action.setBadgeText({ text })
  } catch (err) {
    console.error('Error updating badge:', err)
  }
}

// 每秒刷新时间并实时更新右上角 Badge 图标文字
setInterval(async () => {
  await flushCurrentTime()
  await updateBadge()
}, 1000)

// 保底 Alarm（防休眠唤醒）
chrome.alarms.create('FLUSH_ALARM', { periodInMinutes: 1 })
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'FLUSH_ALARM') {
    await flushCurrentTime()
    await updateBadge()
  }
})

// 监听标签页激活、更新与焦点变化
chrome.tabs.onActivated.addListener(async () => {
  await flushCurrentTime()
  await updateBadge()
})

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    await flushCurrentTime()
    await updateBadge()
  }
})

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await flushCurrentTime()
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    state.windowFocused = false
  } else {
    state.windowFocused = true
    state.lastUserActivityTime = Date.now()
  }
  await updateBadge()
})

// 监听来自 Content Script / Popup 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'USER_ACTIVITY') {
    state.userActiveInContent = true
    state.lastUserActivityTime = Date.now()
    sendResponse({ status: 'ok' })
  } else if (message.type === 'FLUSH_NOW') {
    // 强制立即刷新内存中的未落盘时间，确保 Popup / Dashboard 获取 100% 实时数据
    flushCurrentTime().then(() => {
      updateBadge()
      sendResponse({ status: 'flushed' })
    })
    return true
  } else if (message.type === 'GET_CURRENT_STATUS') {
    sendResponse({
      windowFocused: state.windowFocused,
      userActive: state.userActiveInContent,
    })
  }
  return true
})

// 结合 chrome.idle API 监听系统空闲状态
if (chrome.idle) {
  chrome.idle.onStateChanged.addListener(async (newState) => {
    await flushCurrentTime()
    if (newState === 'active') {
      state.userActiveInContent = true
      state.lastUserActivityTime = Date.now()
    } else {
      state.userActiveInContent = false
    }
    await updateBadge()
  })
}

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.idle) chrome.idle.setDetectionInterval(180)
  updateBadge()
})

chrome.runtime.onStartup.addListener(() => {
  if (chrome.idle) chrome.idle.setDetectionInterval(180)
  updateBadge()
})
