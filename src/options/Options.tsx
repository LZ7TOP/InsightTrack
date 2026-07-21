import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Clock,
  BarChart3,
  GitCompare,
  Settings,
  Download,
  Trash2,
  Plus,
  Shield,
  Activity,
  Layers,
  Zap,
  Globe,
  TrendingUp
} from 'lucide-react';
import { getVisitLogsByDateRange, getSettings, saveSettings, clearAllLogs, getLocalDateStr } from '../storage/db';
import { PageVisitRecord, AppSettings, DomainStats } from '../storage/types';

type TabType = 'overview' | 'site_detail' | 'compare' | 'settings';

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '0分';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}小时 ${mins}分`;
  return `${mins}分钟`;
}

export default function Options() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days'>('7days');
  const [logs, setLogs] = useState<PageVisitRecord[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>({
    idleThresholdSeconds: 180,
    blacklist: ['localhost', '127.0.0.1'],
    mergeSubdomains: false,
  });

  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [compareDomain, setCompareDomain] = useState<string>('');
  const [newBlacklistItem, setNewBlacklistItem] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  async function loadData() {
    const end = new Date();
    const start = new Date();

    if (dateRange === 'today') {
      // 今日
    } else if (dateRange === '7days') {
      start.setDate(end.getDate() - 6);
    } else if (dateRange === '30days') {
      start.setDate(end.getDate() - 29);
    }

    const startStr = getLocalDateStr(start);
    const endStr = getLocalDateStr(end);

    const fetchedLogs = await getVisitLogsByDateRange(startStr, endStr);
    setLogs(fetchedLogs);

    const s = await getSettings();
    setSettingsState(s);

    const domains = Array.from(new Set(fetchedLogs.map((l) => l.domain)));
    if (domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0]);
      setCompareDomain(domains[0]);
    }
  }

  // 统计指标
  const totalOpenMs = logs.reduce((acc, cur) => acc + cur.openTimeMs, 0);
  const totalActiveMs = logs.reduce((acc, cur) => acc + cur.activeTimeMs, 0);
  const focusScore = totalOpenMs > 0 ? Math.round((totalActiveMs / totalOpenMs) * 100) : 0;

  // 域名聚合
  const domainMap: Record<string, { open: number; active: number }> = {};
  logs.forEach((log) => {
    if (!domainMap[log.domain]) {
      domainMap[log.domain] = { open: 0, active: 0 };
    }
    domainMap[log.domain].open += log.openTimeMs;
    domainMap[log.domain].active += log.activeTimeMs;
  });

  const domainStatsList: DomainStats[] = Object.entries(domainMap)
    .map(([domain, stats]) => ({
      domain,
      openTimeMs: stats.open,
      activeTimeMs: stats.active,
      lastVisited: Date.now(),
    }))
    .sort((a, b) => b.activeTimeMs - a.activeTimeMs);

  // ECharts: 饼图
  const pieOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}: ${formatMs(params.value)} (${params.percent}%)`,
    },
    series: [
      {
        name: '活跃时间',
        type: 'pie',
        radius: ['50%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        label: { show: false },
        color: ['#2563EB', '#64748B', '#BC4800', '#0284C7', '#059669', '#D97706', '#7C3AED', '#DB2777'],
        data: domainStatsList.slice(0, 10).map((d) => ({
          name: d.domain,
          value: d.activeTimeMs,
        })),
      },
    ],
  };

  // ECharts: 趋势图
  const dateMap: Record<string, { open: number; active: number }> = {};
  logs.forEach((log) => {
    if (!dateMap[log.date]) {
      dateMap[log.date] = { open: 0, active: 0 };
    }
    dateMap[log.date].open += log.openTimeMs;
    dateMap[log.date].active += log.activeTimeMs;
  });

  const sortedDates = Object.keys(dateMap).sort();
  const trendOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let res = `${params[0].axisValue}<br/>`;
        params.forEach((p: any) => {
          res += `${p.marker} ${p.seriesName}: ${formatMs(p.value)}<br/>`;
        });
        return res;
      },
    },
    legend: {
      data: ['实际活跃时间', '页面驻留时间'],
      textStyle: { color: '#64748B', fontFamily: 'Inter' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: sortedDates,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#64748B' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: {
        color: '#64748B',
        formatter: (val: number) => `${Math.round(val / 60000)}分`,
      },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    series: [
      {
        name: '实际活跃时间',
        type: 'line',
        smooth: true,
        data: sortedDates.map((d) => dateMap[d].active),
        itemStyle: { color: '#2563EB' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.3)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.0)' },
            ],
          },
        },
      },
      {
        name: '页面驻留时间',
        type: 'line',
        smooth: true,
        data: sortedDates.map((d) => dateMap[d].open),
        itemStyle: { color: '#64748B' },
      },
    ],
  };

  // ECharts: 24h 热力图
  const hourMap = new Array(24).fill(0);
  logs.forEach((log) => {
    hourMap[log.hour] += log.activeTimeMs;
  });

  const hourOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => `${params[0].axisValue}:00: ${formatMs(params[0].value)}`,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}`),
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#64748B' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: {
        color: '#64748B',
        formatter: (val: number) => `${Math.round(val / 60000)}分`,
      },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    series: [
      {
        name: '活跃时间',
        type: 'bar',
        data: hourMap,
        itemStyle: {
          color: '#2563EB',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  async function handleAddBlacklist() {
    if (!newBlacklistItem.trim()) return;
    const clean = newBlacklistItem.trim().toLowerCase();
    if (!settings.blacklist.includes(clean)) {
      const newB = [...settings.blacklist, clean];
      const newS = { ...settings, blacklist: newB };
      await saveSettings(newS);
      setSettingsState(newS);
      setNewBlacklistItem('');
    }
  }

  async function handleRemoveBlacklist(item: string) {
    const newB = settings.blacklist.filter((b) => b !== item);
    const newS = { ...settings, blacklist: newB };
    await saveSettings(newS);
    setSettingsState(newS);
  }

  function handleExportData() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `insighttrack_backup_${getLocalDateStr()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  async function handleClearLogs() {
    if (window.confirm('确认要清空所有历史浏览记录吗？此操作无法撤销。')) {
      await clearAllLogs();
      await loadData();
    }
  }

  return (
    <div className="flex h-screen bg-[#F0F2F8] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between select-none shadow-sm">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-md shadow-blue-500/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-slate-900">InsightTrack</h1>
              <p className="text-[11px] font-semibold text-[#64748B]">时间与注意力分析</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                  : 'text-[#64748B] hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>概览分析</span>
            </button>

            <button
              onClick={() => setActiveTab('site_detail')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'site_detail'
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                  : 'text-[#64748B] hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>站点深度下钻</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'compare'
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                  : 'text-[#64748B] hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>历史跨段比对</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                  : 'text-[#64748B] hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>偏好与设置</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-200 text-[11px] font-semibold text-[#64748B] text-center">
          InsightTrack v1.0.0
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === 'overview' && '概览与多维度趋势'}
              {activeTab === 'site_detail' && '单站点深度分析'}
              {activeTab === 'compare' && '跨时间段比对'}
              {activeTab === 'settings' && '偏好设置与数据管理'}
            </h2>
            <p className="text-xs text-[#64748B] mt-1 font-medium">
              基于核心设计规范系统生成的全面注意力量化报告
            </p>
          </div>

          {activeTab === 'overview' && (
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setDateRange('today')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateRange === 'today' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-slate-900'
                }`}
              >
                今日
              </button>
              <button
                onClick={() => setDateRange('7days')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateRange === '7days' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-slate-900'
                }`}
              >
                近7天
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateRange === '30days' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-slate-900'
                }`}
              >
                近30天
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-[#2563EB] text-xs font-bold uppercase mb-2">
                  <span>实际活跃时间</span>
                  <Activity className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{formatMs(totalActiveMs)}</div>
                <div className="flex items-center space-x-1 text-[11px] font-semibold text-[#2563EB] mt-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>注意力前台聚焦时长</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-[#64748B] text-xs font-bold uppercase mb-2">
                  <span>总驻留时间</span>
                  <Clock className="w-4 h-4 text-[#64748B]" />
                </div>
                <div className="text-2xl font-bold text-slate-800 tracking-tight">{formatMs(totalOpenMs)}</div>
                <div className="text-[11px] font-medium text-[#64748B] mt-2">包含所有标签页后台保持时长</div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-[#BC4800] text-xs font-bold uppercase mb-2">
                  <span>专注率 (Focus Rate)</span>
                  <Zap className="w-4 h-4 text-[#BC4800]" />
                </div>
                <div className="text-2xl font-bold text-[#BC4800] tracking-tight">{focusScore}%</div>
                <div className="text-[11px] font-medium text-[#64748B] mt-2">实际活跃时长占驻留总时长比重</div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">每日时间起伏趋势</h3>
                <ReactECharts option={trendOption} style={{ height: '280px' }} />
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Top 10 网站占比</h3>
                <ReactECharts option={pieOption} style={{ height: '280px' }} />
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">24 小时活跃时段分布</h3>
                <ReactECharts option={hourOption} style={{ height: '240px' }} />
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">域名时长排行榜</h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {domainStatsList.map((d, index) => (
                    <div key={d.domain} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate max-w-[160px]">
                        <span className="font-bold text-[#64748B]">{index + 1}.</span>
                        <span className="font-medium text-slate-800 truncate">{d.domain}</span>
                      </div>
                      <span className="font-bold text-[#2563EB]">{formatMs(d.activeTimeMs)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Site Detail */}
        {activeTab === 'site_detail' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#64748B]">选择要分析的网站:</span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                >
                  {domainStatsList.map((d) => (
                    <option key={d.domain} value={d.domain}>
                      {d.domain}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right">
                <span className="text-xs font-medium text-[#64748B] block">该站点活跃总时长</span>
                <span className="text-lg font-bold text-[#2563EB]">
                  {formatMs(domainMap[selectedDomain]?.active || 0)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">最常访问页面明细 ({selectedDomain})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[#64748B] font-bold">
                    <tr>
                      <th className="p-3 rounded-l-xl">页面标题</th>
                      <th className="p-3">完整 URL</th>
                      <th className="p-3">活跃时间</th>
                      <th className="p-3 rounded-r-xl">日期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs
                      .filter((l) => l.domain === selectedDomain)
                      .slice(0, 15)
                      .map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800 max-w-[240px] truncate">
                            {log.title || '无标题'}
                          </td>
                          <td className="p-3 text-[#64748B] max-w-[300px] truncate">
                            {log.url}
                          </td>
                          <td className="p-3 text-[#2563EB] font-bold">{formatMs(log.activeTimeMs)}</td>
                          <td className="p-3 text-[#64748B]">{log.date}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Compare */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <GitCompare className="w-5 h-5 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#64748B]">对比站点:</span>
                <select
                  value={compareDomain}
                  onChange={(e) => setCompareDomain(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                >
                  {domainStatsList.map((d) => (
                    <option key={d.domain} value={d.domain}>
                      {d.domain}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">【本周期 vs 历史记录】对比柱状图</h3>
              <ReactECharts
                option={{
                  backgroundColor: 'transparent',
                  tooltip: { trigger: 'axis' },
                  legend: { data: ['活跃时间', '驻留时间'], textStyle: { color: '#64748B', fontFamily: 'Inter' } },
                  xAxis: {
                    type: 'category',
                    data: [compareDomain],
                    axisLabel: { color: '#64748B' },
                  },
                  yAxis: { type: 'value', axisLabel: { color: '#64748B' } },
                  series: [
                    {
                      name: '活跃时间',
                      type: 'bar',
                      data: [domainMap[compareDomain]?.active || 0],
                      itemStyle: { color: '#2563EB' },
                    },
                    {
                      name: '驻留时间',
                      type: 'bar',
                      data: [domainMap[compareDomain]?.open || 0],
                      itemStyle: { color: '#64748B' },
                    },
                  ],
                }}
                style={{ height: '300px' }}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#2563EB]" />
                <span>不纳入统计的网站黑名单</span>
              </h3>
              <p className="text-xs text-[#64748B] mb-4 font-medium">
                黑名单内的域名或匹配通配符的网站将完全暂停时间记录与统计。
              </p>

              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="如: github.com 或 *.local"
                  value={newBlacklistItem}
                  onChange={(e) => setNewBlacklistItem(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2563EB]"
                />
                <button
                  onClick={handleAddBlacklist}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {settings.blacklist.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleRemoveBlacklist(item)}
                      className="text-[#64748B] hover:text-rose-600 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-2">数据管理与隐私控制</h3>
              <p className="text-xs text-[#64748B] mb-4 font-medium">所有浏览时间数据均安全存储在您的本地浏览器中。</p>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExportData}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center space-x-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>导出本地日志 JSON 备份</span>
                </button>

                <button
                  onClick={handleClearLogs}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl flex items-center space-x-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>清空全部历史记录</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
