export interface PageVisitRecord {
  id?: number;
  domain: string;
  url: string;
  title: string;
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  openTimeMs: number;
  activeTimeMs: number;
  timestamp: number;
}

export interface DomainStats {
  domain: string;
  openTimeMs: number;
  activeTimeMs: number;
  favIconUrl?: string;
  lastVisited: number;
}

export interface AppSettings {
  idleThresholdSeconds: number; // 默认空闲判断时长（秒）
  blacklist: string[];          // 黑名单域名列表
  mergeSubdomains: boolean;    // 是否自动归并二级域名
  showBadge: boolean;          // 是否在插件图标显示角标时间
  dailyGoalHours: number;      // 每日活跃时间上限目标（小时）
  notifyOnGoalReached: boolean;// 超出目标是否发送桌面通知
}

export interface DailySummary {
  date: string;
  totalOpenTimeMs: number;
  totalActiveTimeMs: number;
  topDomains: DomainStats[];
}
