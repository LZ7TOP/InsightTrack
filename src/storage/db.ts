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

// 获取本地时区 YYYY-MM-DD 字符串，避免 UTC 时间带来的日期偏差
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

  let domain = '';
  try {
    const parsed = new URL(url);
    domain = parsed.hostname;
  } catch {
    return;
  }

  if (!domain) return;

  // 检查黑名单
  const settings = await getSettings();
  if (isBlacklisted(domain, settings.blacklist)) {
    return;
  }

  const now = new Date();
  const dateStr = getLocalDateStr(now);
  const hour = now.getHours();

  const db = await getDB();
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

// 获取某个时间范围内的所有记录
export async function getVisitLogsByDateRange(startDate: string, endDate: string): Promise<PageVisitRecord[]> {
  const db = await getDB();
  const allLogs = await db.getAll('visit_logs');
  return allLogs.filter((log) => log.date >= startDate && log.date <= endDate);
}

// 获取特定域名的所有历史记录
export async function getLogsByDomain(domain: string): Promise<PageVisitRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('visit_logs', 'by-domain', domain);
}

// 清空所有记录
export async function clearAllLogs(): Promise<void> {
  const db = await getDB();
  await db.clear('visit_logs');
}

// 设置与配置管理
const DEFAULT_SETTINGS: AppSettings = {
  idleThresholdSeconds: 180,
  blacklist: ['localhost', '127.0.0.1'],
  mergeSubdomains: false,
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
  return blacklist.some((item) => {
    if (item.startsWith('*.')) {
      const mainDomain = item.slice(2);
      return domain === mainDomain || domain.endsWith('.' + mainDomain);
    }
    return domain === item || domain.endsWith('.' + item);
  });
}
