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
  enableIdleDetection: boolean; // 是否开启无操作判断空闲检测（默认 false 不开启）
  idleThresholdSeconds: number; // 空闲判断超时时长（秒）
  blacklist: string[];          // 黑名单域名列表
  mergeSubdomains: boolean;    // 是否自动归并二级域名
  showBadge: boolean;          // 是否在插件图标显示角标时间
  enableDailyGoal: boolean;    // 是否开启注意力目标与健康提醒功能（默认 false 不开启）
  dailyGoalHours: number;      // 每日活跃时间上限目标（小时）
  notifyOnGoalReached: boolean;// 超出目标是否发送桌面通知
  autoRefresh: boolean;        // 是否自动刷新仪表盘/Popup数据
  autoRefreshIntervalSeconds: number; // 自动刷新间隔时间（秒，如5秒、10秒、30秒）
}

export interface DailySummary {
  date: string;
  totalOpenTimeMs: number;
  totalActiveTimeMs: number;
  topDomains: DomainStats[];
}
