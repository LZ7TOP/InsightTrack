import { useEffect, useState } from 'react';
import { Clock, ShieldOff, ShieldCheck, ExternalLink, Activity, Eye } from 'lucide-react';
import { getVisitLogsByDateRange, getSettings, saveSettings } from '../storage/db';
import { DomainStats } from '../storage/types';

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0秒';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分`;
  }
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`;
  }
  return `${seconds}秒`;
}

export default function Popup() {
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [isBlacklisted, setIsBlacklisted] = useState<boolean>(false);
  const [todayOpenMs, setTodayOpenMs] = useState<number>(0);
  const [todayActiveMs, setTodayActiveMs] = useState<number>(0);
  const [topDomains, setTopDomains] = useState<DomainStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPopupData();
  }, []);

  async function loadPopupData() {
    setLoading(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const logs = await getVisitLogsByDateRange(todayStr, todayStr);
    const settings = await getSettings();

    // 统计今日总时间
    let totalOpen = 0;
    let totalActive = 0;
    const domainMap: Record<string, { open: number; active: number }> = {};

    logs.forEach((log) => {
      totalOpen += log.openTimeMs;
      totalActive += log.activeTimeMs;

      if (!domainMap[log.domain]) {
        domainMap[log.domain] = { open: 0, active: 0 };
      }
      domainMap[log.domain].open += log.openTimeMs;
      domainMap[log.domain].active += log.activeTimeMs;
    });

    setTodayOpenMs(totalOpen);
    setTodayActiveMs(totalActive);

    // 计算 Top 域名
    const sortedDomains: DomainStats[] = Object.entries(domainMap)
      .map(([domain, stats]) => ({
        domain,
        openTimeMs: stats.open,
        activeTimeMs: stats.active,
        lastVisited: Date.now(),
      }))
      .sort((a, b) => b.activeTimeMs - a.activeTimeMs)
      .slice(0, 4);

    setTopDomains(sortedDomains);

    // 获取当前标签页
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          const domain = url.hostname;
          setCurrentDomain(domain);
          setIsBlacklisted(settings.blacklist.includes(domain));
        } catch {
          setCurrentDomain('');
        }
      }
      setLoading(false);
    });
  }

  async function toggleBlacklist() {
    if (!currentDomain) return;
    const settings = await getSettings();
    let newBlacklist = [...settings.blacklist];

    if (isBlacklisted) {
      newBlacklist = newBlacklist.filter((d) => d !== currentDomain);
    } else {
      newBlacklist.push(currentDomain);
    }

    await saveSettings({ ...settings, blacklist: newBlacklist });
    setIsBlacklisted(!isBlacklisted);
  }

  function openDashboard() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('src/options/index.html'));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900 text-slate-100 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none text-white">InsightTrack</h1>
            <span className="text-xs text-slate-400">今日时间分析</span>
          </div>
        </div>

        <button
          onClick={openDashboard}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1 text-xs"
          title="打开完整仪表盘"
        >
          <span>完整报表</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-2 my-3">
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
          <div className="flex items-center space-x-1.5 text-blue-400 text-xs font-medium mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>实际活跃时间</span>
          </div>
          <div className="text-lg font-bold text-white tracking-tight">
            {formatDuration(todayActiveMs)}
          </div>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-medium mb-1">
            <Eye className="w-3.5 h-3.5" />
            <span>总驻留时间</span>
          </div>
          <div className="text-lg font-bold text-slate-200 tracking-tight">
            {formatDuration(todayOpenMs)}
          </div>
        </div>
      </div>

      {/* Current Site Action */}
      {currentDomain && (
        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between my-1">
          <div className="truncate max-w-[200px]">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">当前网站</span>
            <span className="text-xs font-medium text-slate-200 truncate block">{currentDomain}</span>
          </div>
          <button
            onClick={toggleBlacklist}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all ${
              isBlacklisted
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            {isBlacklisted ? (
              <>
                <ShieldOff className="w-3 h-3" />
                <span>已被忽略</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3" />
                <span>正常追踪</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Top 3 Domains */}
      <div className="mt-2">
        <h3 className="text-xs font-medium text-slate-400 mb-2">今日最常访问</h3>
        {topDomains.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-600">暂无访问记录</div>
        ) : (
          <div className="space-y-2">
            {topDomains.map((item) => {
              const percent = todayActiveMs > 0 ? Math.min(100, Math.round((item.activeTimeMs / todayActiveMs) * 100)) : 0;
              return (
                <div key={item.domain} className="bg-slate-800/50 p-2 rounded-lg text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-200 truncate max-w-[180px]">{item.domain}</span>
                    <span className="text-slate-400">{formatDuration(item.activeTimeMs)}</span>
                  </div>
                  <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Link */}
      <div className="mt-4 pt-2 border-t border-slate-800/80 text-center">
        <button
          onClick={openDashboard}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-1.5"
        >
          <span>查看完整图表与历史数据对比</span>
        </button>
      </div>
    </div>
  );
}
