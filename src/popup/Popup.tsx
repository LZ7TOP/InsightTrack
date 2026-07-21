import { useEffect, useState } from 'react';
import { Clock, ShieldOff, ShieldCheck, ExternalLink, Activity, Eye, RotateCw } from 'lucide-react';
import { getVisitLogsByDateRange, getSettings, saveSettings, getLocalDateStr, cleanDomain } from '../storage/db';
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
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    // 强制后台立即刷新未落盘的内存时间，确保数据百分之百实时
    chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, () => {
      loadPopupData();
    });
  }, []);

  async function loadPopupData() {
    setLoading(true);
    const todayStr = getLocalDateStr();
    const logs = await getVisitLogsByDateRange(todayStr, todayStr);
    const settings = await getSettings();

    let totalOpen = 0;
    let totalActive = 0;
    const domainMap: Record<string, { open: number; active: number }> = {};

    logs.forEach((log) => {
      totalOpen += log.openTimeMs;
      totalActive += log.activeTimeMs;

      const domainKey = cleanDomain(log.domain);
      if (!domainMap[domainKey]) {
        domainMap[domainKey] = { open: 0, active: 0 };
      }
      domainMap[domainKey].open += log.openTimeMs;
      domainMap[domainKey].active += log.activeTimeMs;
    });

    setTodayOpenMs(totalOpen);
    setTodayActiveMs(totalActive);

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

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          const domain = cleanDomain(url.hostname);
          setCurrentDomain(domain);
          setIsBlacklisted(settings.blacklist.includes(domain));
        } catch {
          setCurrentDomain('');
        }
      }
      setLoading(false);
    });
  }

  function handleRefresh() {
    setRefreshing(true);
    chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, () => {
      loadPopupData().then(() => {
        setTimeout(() => setRefreshing(false), 300);
      });
    });
  }

  async function toggleBlacklist() {
    if (!currentDomain) return;
    const settings = await getSettings();
    let newBlacklist = [...settings.blacklist];

    if (isBlacklisted) {
      newBlacklist = newBlacklist.filter((d) => cleanDomain(d) !== currentDomain);
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
      <div className="flex items-center justify-center h-64 bg-[#F0F2F8] text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#F0F2F8] text-slate-800 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-md shadow-blue-500/20">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-900">InsightTrack</h1>
            <span className="text-[11px] text-[#64748B]">今日浏览分析</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-white rounded-lg text-[#64748B] hover:text-[#2563EB] transition-colors flex items-center gap-1 text-xs font-medium border border-transparent hover:border-slate-200"
            title="刷新最新数据"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
          </button>
          <button
            onClick={openDashboard}
            className="p-1.5 hover:bg-white rounded-lg text-[#64748B] hover:text-[#2563EB] transition-colors flex items-center gap-1 text-xs font-medium border border-transparent hover:border-slate-200"
            title="打开完整仪表盘"
          >
            <span>大屏</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-2.5 my-3">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-[#2563EB] text-xs font-semibold mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>实际活跃时间</span>
          </div>
          <div className="text-base font-bold text-slate-900 tracking-tight">
            {formatDuration(todayActiveMs)}
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-[#64748B] text-xs font-semibold mb-1">
            <Eye className="w-3.5 h-3.5" />
            <span>总驻留时间</span>
          </div>
          <div className="text-base font-bold text-slate-700 tracking-tight">
            {formatDuration(todayOpenMs)}
          </div>
        </div>
      </div>

      {/* Current Site Status */}
      {currentDomain && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between my-1">
          <div className="truncate max-w-[190px]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block">当前域名</span>
            <span className="text-xs font-bold text-slate-800 truncate block">{currentDomain}</span>
          </div>
          <button
            onClick={toggleBlacklist}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
              isBlacklisted
                ? 'bg-[#BC4800]/10 text-[#BC4800] hover:bg-[#BC4800]/20 border border-[#BC4800]/30'
                : 'bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-[#2563EB]/30'
            }`}
          >
            {isBlacklisted ? (
              <>
                <ShieldOff className="w-3.5 h-3.5" />
                <span>已被忽略</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>正常追踪</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Top Websites */}
      <div className="mt-2">
        <h3 className="text-xs font-bold text-[#64748B] mb-2">今日最常访问</h3>
        {topDomains.length === 0 ? (
          <div className="text-center py-4 text-xs text-[#64748B]">暂无访问记录</div>
        ) : (
          <div className="space-y-2">
            {topDomains.map((item) => {
              const percent = todayActiveMs > 0 ? Math.min(100, Math.round((item.activeTimeMs / todayActiveMs) * 100)) : 0;
              return (
                <div key={item.domain} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-slate-800 truncate max-w-[170px]">{item.domain}</span>
                    <span className="text-[#64748B] font-mono">{formatDuration(item.activeTimeMs)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Button */}
      <div className="mt-3 pt-2 border-t border-slate-200">
        <button
          onClick={openDashboard}
          className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5"
        >
          <span>查看完整图表与历史数据对比</span>
        </button>
      </div>
    </div>
  );
}
