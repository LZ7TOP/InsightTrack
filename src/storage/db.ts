import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PageVisitRecord, AppSettings } from './types';

interface InsightTrackDB extends DBSchema {
  visit_logs: {
    key: number;
    value: PageVisitRecord;
    indexes: {
      'by-date': string;
      'by-domain': string;
      'by-date-domain': [string, string];
    };
  };
}

const DB_NAME = 'InsightTrackDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<InsightTrackDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<InsightTrackDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('visit_logs', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-date', 'date');
        store.createIndex('by-domain', 'domain');
        store.createIndex('by-date-domain', ['date', 'domain']);
      },
    });
  }
  return dbPromise;
}

// 域名规范化清洗：移除前缀 www.
export function cleanDomain(hostname: string): string {
  if (!hostname) return '';
  let d = hostname.toLowerCase();
  if (d.startsWith('www.')) {
    d = d.slice(4);
  }
  return d;
}

// 获取本地时区 YYYY-MM-DD 字符串
export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 记录或累加一次停留与活跃时长
export async function recordVisitTime(
  url: string,
  title: string,
  openDurationMs: number,
  activeDurationMs: number
) {
  if (
    !url ||
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:') ||
    url.startsWith('chrome-search://')
  ) {
    return;
  }

  let rawDomain = '';
  try {
    const parsed = new URL(url);
    rawDomain = parsed.hostname;
  } catch {
    return;
  }

  if (!rawDomain) return;
  const domain = cleanDomain(rawDomain);

  // 检查黑名单
  const settings = await getSettings();
  if (isBlacklisted(domain, settings.blacklist) || isBlacklisted(rawDomain, settings.blacklist)) {
    return;
  }

  const now = new Date();
  const dateStr = getLocalDateStr(now);
  const hour = now.getHours();

  const db = await getDB();
  const logsOnDate = await db.getAllFromIndex('visit_logs', 'by-date', dateStr);
  const existingRecord = logsOnDate.find((item) => item.url === url && item.hour === hour);

  if (existingRecord) {
    existingRecord.openTimeMs += openDurationMs;
    existingRecord.activeTimeMs += activeDurationMs;
    if (title && title !== domain) {
      existingRecord.title = title;
    }
    existingRecord.timestamp = now.getTime();
    await db.put('visit_logs', existingRecord);
  } else {
    const record: PageVisitRecord = {
      domain,
      url,
      title: title || domain,
      date: dateStr,
      hour,
      openTimeMs: openDurationMs,
      activeTimeMs: activeDurationMs,
      timestamp: now.getTime(),
    };
    await db.add('visit_logs', record);
  }
}

// 获取某个时间范围内的所有记录
export async function getVisitLogsByDateRange(startDate: string, endDate: string): Promise<PageVisitRecord[]> {
  const db = await getDB();
  const allLogs = await db.getAll('visit_logs');
  return allLogs.filter((log) => log.date >= startDate && log.date <= endDate);
}

// 获取特定域名的所有历史记录
export async function getLogsByDomain(domain: string): Promise<PageVisitRecord[]> {
  const db = await getDB();
  const cleaned = cleanDomain(domain);
  const allLogs = await db.getAll('visit_logs');
  return allLogs.filter((log) => cleanDomain(log.domain) === cleaned);
}

// 清空所有记录
export async function clearAllLogs(): Promise<void> {
  const db = await getDB();
  await db.clear('visit_logs');
}

// 清除指定天数以前的历史记录
export async function clearLogsOlderThan(days: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = getLocalDateStr(cutoff);

  const db = await getDB();
  const allLogs = await db.getAll('visit_logs');
  const oldLogs = allLogs.filter((log) => log.date < cutoffStr);

  const tx = db.transaction('visit_logs', 'readwrite');
  for (const log of oldLogs) {
    if (log.id !== undefined) {
      await tx.store.delete(log.id);
    }
  }
  await tx.done;
  return oldLogs.length;
}

// 导入外部 JSON 备份记录
export async function importVisitLogs(importedLogs: PageVisitRecord[]): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('visit_logs', 'readwrite');
  let count = 0;
  for (const log of importedLogs) {
    if (log.domain && log.date && log.url) {
      delete log.id; // 让 DB 自动生成递增主键
      await tx.store.add(log);
      count++;
    }
  }
  await tx.done;
  return count;
}

// 设置与配置管理
const DEFAULT_SETTINGS: AppSettings = {
  idleThresholdSeconds: 180,
  blacklist: ['localhost', '127.0.0.1'],
  mergeSubdomains: false,
  showBadge: true,
  dailyGoalHours: 4,
  notifyOnGoalReached: true,
};

export async function getSettings(): Promise<AppSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...(result.settings || {}) });
    });
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, () => {
      resolve();
    });
  });
}

export function isBlacklisted(domain: string, blacklist: string[]): boolean {
  const clean = cleanDomain(domain);
  return blacklist.some((item) => {
    const cleanItem = cleanDomain(item);
    if (cleanItem.startsWith('*.')) {
      const mainDomain = cleanItem.slice(2);
      return clean === mainDomain || clean.endsWith('.' + mainDomain);
    }
    return clean === cleanItem || clean.endsWith('.' + cleanItem);
  });
}
