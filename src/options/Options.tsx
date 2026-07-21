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
import { getVisitLogsByDateRange, getSettings, saveSettings, clearAllLogs } from '../storage/db';
import { PageVisitRecord, AppSettings, DomainStats } from '../storage/types';

type TabType = 'overview' | 'site_detail' | 'compare' | 'settings';

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '0分';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
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

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

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

  // ECharts: 饼图 / 环形图 (Top 10 域名) - Stitch Teal Style
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
        radius: ['55%', '80%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0e1513',
          borderWidth: 2,
        },
        label: { show: false },
        color: ['#2dd4bf', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#6366f1', '#64748b'],
        data: domainStatsList.slice(0, 10).map((d) => ({
          name: d.domain,
          value: d.activeTimeMs,
        })),
      },
    ],
  };

  // ECharts: 趋势图 (Stitch Teal Gradient)
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
      textStyle: { color: '#859490', fontFamily: 'Inter' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: sortedDates,
      axisLine: { lineStyle: { color: '#2f3634' } },
      axisLabel: { color: '#859490', fontFamily: 'JetBrains Mono' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#2f3634' } },
      axisLabel: {
        color: '#859490',
        fontFamily: 'JetBrains Mono',
        formatter: (val: number) => `${Math.round(val / 60000)}m`,
      },
      splitLine: { lineStyle: { color: '#1a211f' } },
    },
    series: [
      {
        name: '实际活跃时间',
        type: 'line',
        smooth: true,
        data: sortedDates.map((d) => dateMap[d].active),
        itemStyle: { color: '#2dd4bf' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(45, 212, 191, 0.35)' },
              { offset: 1, color: 'rgba(45, 212, 191, 0.0)' },
            ],
          },
        },
      },
      {
        name: '页面驻留时间',
        type: 'line',
        smooth: true,
        data: sortedDates.map((d) => dateMap[d].open),
        itemStyle: { color: '#64748b' },
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
      axisLine: { lineStyle: { color: '#2f3634' } },
      axisLabel: { color: '#859490', fontFamily: 'JetBrains Mono' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#2f3634' } },
      axisLabel: {
        color: '#859490',
        fontFamily: 'JetBrains Mono',
        formatter: (val: number) => `${Math.round(val / 60000)}m`,
      },
      splitLine: { lineStyle: { color: '#1a211f' } },
    },
    series: [
      {
        name: '活跃时间',
        type: 'bar',
        data: hourMap,
        itemStyle: {
          color: '#2dd4bf',
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
    downloadAnchor.setAttribute('download', `insighttrack_backup_${new Date().toISOString().split('T')[0]}.json`);
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
    <div className="flex h-screen bg-[#0e1513] text-[#dde4e1] font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#141c19] border-r border-[#2f3634] p-6 flex flex-col justify-between select-none">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-[#2dd4bf] flex items-center justify-center shadow-lg shadow-[#2dd4bf]/20">
              <Clock className="w-5 h-5 text-[#003731]" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-[#dde4e1]">InsightTrack</h1>
              <p className="text-[11px] font-mono text-[#859490]">Analytics & Focus</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#2dd4bf]/15 text-[#57f1db] border-l-4 border-[#2dd4bf]'
                  : 'text-[#859490] hover:bg-[#1a211f] hover:text-[#dde4e1]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>概览分析 (Overview)</span>
            </button>

            <button
              onClick={() => setActiveTab('site_detail')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'site_detail'
                  ? 'bg-[#2dd4bf]/15 text-[#57f1db] border-l-4 border-[#2dd4bf]'
                  : 'text-[#859490] hover:bg-[#1a211f] hover:text-[#dde4e1]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>站点下钻 (Site Analytics)</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'compare'
                  ? 'bg-[#2dd4bf]/15 text-[#57f1db] border-l-4 border-[#2dd4bf]'
                  : 'text-[#859490] hover:bg-[#1a211f] hover:text-[#dde4e1]'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>历史比对 (Historic Comparison)</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#2dd4bf]/15 text-[#57f1db] border-l-4 border-[#2dd4bf]'
                  : 'text-[#859490] hover:bg-[#1a211f] hover:text-[#dde4e1]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>管理与设置 (Settings)</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-[#2f3634] text-[11px] font-mono text-[#859490] text-center">
          InsightTrack v1.0.0
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2f3634]">
          <div>
            <h2 className="text-xl font-bold text-[#dde4e1]">
              {activeTab === 'overview' && '概览与注意力数据分析'}
              {activeTab === 'site_detail' && '单站点深度分析'}
              {activeTab === 'compare' && '跨时间段比对'}
              {activeTab === 'settings' && '偏好设置与数据管理'}
            </h2>
            <p className="text-xs text-[#859490] mt-1">
              基于 Stitch 工业设计规范构建的高密度注意力量化仪表盘
            </p>
          </div>

          {activeTab === 'overview' && (
            <div className="flex items-center bg-[#141c19] border border-[#2f3634] rounded-lg p-1">
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                  dateRange === 'today' ? 'bg-[#2dd4bf] text-[#003731] font-bold' : 'text-[#859490] hover:text-[#dde4e1]'
                }`}
              >
                今日
              </button>
              <button
                onClick={() => setDateRange('7days')}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                  dateRange === '7days' ? 'bg-[#2dd4bf] text-[#003731] font-bold' : 'text-[#859490] hover:text-[#dde4e1]'
                }`}
              >
                7天
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                  dateRange === '30days' ? 'bg-[#2dd4bf] text-[#003731] font-bold' : 'text-[#859490] hover:text-[#dde4e1]'
                }`}
              >
                30天
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric Cards Row */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
                <div className="flex items-center justify-between text-[#859490] text-xs font-mono uppercase mb-2">
                  <span>Total Active Time</span>
                  <Activity className="w-4 h-4 text-[#2dd4bf]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#57f1db] tracking-tight">{formatMs(totalActiveMs)}</div>
                <div className="flex items-center space-x-1 text-[11px] text-[#2dd4bf] mt-2">
                  <TrendingUp className="w-3 h-3" />
                  <span>注意力持续在前台聚焦</span>
                </div>
              </div>

              <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
                <div className="flex items-center justify-between text-[#859490] text-xs font-mono uppercase mb-2">
                  <span>Total Open Time</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#dde4e1] tracking-tight">{formatMs(totalOpenMs)}</div>
                <div className="text-[11px] text-[#859490] mt-2">包含后台驻留时间</div>
              </div>

              <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
                <div className="flex items-center justify-between text-[#859490] text-xs font-mono uppercase mb-2">
                  <span>Focus Score</span>
                  <Zap className="w-4 h-4 text-[#2dd4bf]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#2dd4bf] tracking-tight">{focusScore}%</div>
                <div className="text-[11px] text-[#859490] mt-2">实际活跃时长占驻留总比重</div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
                <h3 className="text-sm font-bold text-[#dde4e1] mb-4">每日浏览时间起伏趋势</h3>
                <ReactECharts option={trendOption} style={{ height: '280px' }} />
              </div>

              <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
                <h3 className="text-sm font-bold text-[#dde4e1] mb-4">Top 10 网站活跃占比</h3>
                <ReactECharts option={pieOption} style={{ height: '280px' }} />
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
                <h3 className="text-sm font-bold text-[#dde4e1] mb-4">24 小时活跃时段分布</h3>
                <ReactECharts option={hourOption} style={{ height: '240px' }} />
              </div>

              <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
                <h3 className="text-sm font-bold text-[#dde4e1] mb-4">域名时长排行榜</h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {domainStatsList.map((d, index) => (
                    <div key={d.domain} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2 truncate max-w-[160px]">
                        <span className="text-[#859490]">{index + 1}.</span>
                        <span className="text-[#dde4e1] truncate">{d.domain}</span>
                      </div>
                      <span className="text-[#2dd4bf]">{formatMs(d.activeTimeMs)}</span>
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
            <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-[#2dd4bf]" />
                <span className="text-xs font-mono text-[#859490]">SELECT DOMAIN:</span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-[#141c19] border border-[#2f3634] text-[#dde4e1] rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#2dd4bf]"
                >
                  {domainStatsList.map((d) => (
                    <option key={d.domain} value={d.domain}>
                      {d.domain}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-[#859490] block">Active Time</span>
                <span className="text-lg font-bold font-mono text-[#57f1db]">
                  {formatMs(domainMap[selectedDomain]?.active || 0)}
                </span>
              </div>
            </div>

            <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
              <h3 className="text-sm font-bold text-[#dde4e1] mb-4">最常访问页面明细 ({selectedDomain})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#141c19] text-[#859490]">
                    <tr>
                      <th className="p-3 rounded-l-lg">Title</th>
                      <th className="p-3">URL Path</th>
                      <th className="p-3">Active Time</th>
                      <th className="p-3 rounded-r-lg">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f3634]">
                    {logs
                      .filter((l) => l.domain === selectedDomain)
                      .slice(0, 15)
                      .map((log, idx) => (
                        <tr key={idx} className="hover:bg-[#242b2a]">
                          <td className="p-3 font-medium text-[#dde4e1] max-w-[240px] truncate">
                            {log.title || 'Untitled'}
                          </td>
                          <td className="p-3 text-[#859490] max-w-[300px] truncate">
                            {log.url}
                          </td>
                          <td className="p-3 text-[#2dd4bf]">{formatMs(log.activeTimeMs)}</td>
                          <td className="p-3 text-[#859490]">{log.date}</td>
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
            <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <GitCompare className="w-5 h-5 text-[#2dd4bf]" />
                <span className="text-xs font-mono text-[#859490]">COMPARE DOMAIN:</span>
                <select
                  value={compareDomain}
                  onChange={(e) => setCompareDomain(e.target.value)}
                  className="bg-[#141c19] border border-[#2f3634] text-[#dde4e1] rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#2dd4bf]"
                >
                  {domainStatsList.map((d) => (
                    <option key={d.domain} value={d.domain}>
                      {d.domain}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
              <h3 className="text-sm font-bold text-[#dde4e1] mb-4">【本周期 vs 历史记录】对比柱状图</h3>
              <ReactECharts
                option={{
                  backgroundColor: 'transparent',
                  tooltip: { trigger: 'axis' },
                  legend: { data: ['活跃时间', '驻留时间'], textStyle: { color: '#859490', fontFamily: 'Inter' } },
                  xAxis: {
                    type: 'category',
                    data: [compareDomain],
                    axisLabel: { color: '#859490', fontFamily: 'JetBrains Mono' },
                  },
                  yAxis: { type: 'value', axisLabel: { color: '#859490', fontFamily: 'JetBrains Mono' } },
                  series: [
                    {
                      name: '活跃时间',
                      type: 'bar',
                      data: [domainMap[compareDomain]?.active || 0],
                      itemStyle: { color: '#2dd4bf' },
                    },
                    {
                      name: '驻留时间',
                      type: 'bar',
                      data: [domainMap[compareDomain]?.open || 0],
                      itemStyle: { color: '#64748b' },
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
            <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
              <h3 className="text-sm font-bold text-[#dde4e1] mb-2 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#2dd4bf]" />
                <span>不纳入统计的网站黑名单</span>
              </h3>
              <p className="text-xs text-[#859490] mb-4">
                黑名单内的域名或匹配通配符的网站将完全暂停时间记录与统计。
              </p>

              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="如: github.com 或 *.local"
                  value={newBlacklistItem}
                  onChange={(e) => setNewBlacklistItem(e.target.value)}
                  className="flex-1 bg-[#141c19] border border-[#2f3634] rounded-lg px-3 py-2 text-xs font-mono text-[#dde4e1] focus:outline-none focus:border-[#2dd4bf]"
                />
                <button
                  onClick={handleAddBlacklist}
                  className="px-4 py-2 bg-[#2dd4bf] hover:bg-[#3cddc7] text-[#003731] font-bold text-xs rounded-lg flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {settings.blacklist.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#141c19] border border-[#2f3634] rounded-lg text-xs font-mono text-[#dde4e1]"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleRemoveBlacklist(item)}
                      className="text-[#859490] hover:text-rose-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#1a211f] border border-[#2f3634] p-5 rounded-xl">
              <h3 className="text-sm font-bold text-[#dde4e1] mb-2">数据管理与隐私控制</h3>
              <p className="text-xs text-[#859490] mb-4">所有浏览时间数据均安全存储在您的本地浏览器中。</p>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-[#141c19] hover:bg-[#242b2a] border border-[#2f3634] text-[#dde4e1] font-medium text-xs rounded-lg flex items-center space-x-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>导出本地日志 JSON 备份</span>
                </button>

                <button
                  onClick={handleClearLogs}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-medium text-xs rounded-lg flex items-center space-x-2 transition-all"
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
