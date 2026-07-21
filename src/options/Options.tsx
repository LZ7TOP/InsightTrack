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
  Layers
} from 'lucide-react';
import { getVisitLogsByDateRange, getSettings, saveSettings, clearAllLogs } from '../storage/db';
import { PageVisitRecord, AppSettings, DomainStats } from '../storage/types';

type TabType = 'overview' | 'site_detail' | 'compare' | 'settings';

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '0分钟';
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

  // 站点下钻与比对选择
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

    // 提取出现过的域名列表
    const domains = Array.from(new Set(fetchedLogs.map((l) => l.domain)));
    if (domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0]);
      setCompareDomain(domains[0]);
    }
  }

  // 计算整体统计指标
  const totalOpenMs = logs.reduce((acc, cur) => acc + cur.openTimeMs, 0);
  const totalActiveMs = logs.reduce((acc, cur) => acc + cur.activeTimeMs, 0);

  // 域名聚合数据
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

  // ECharts: 饼图（Top 10 域名占比）
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
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#090d16',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        data: domainStatsList.slice(0, 10).map((d) => ({
          name: d.domain,
          value: d.activeTimeMs,
        })),
      },
    ],
  };

  // ECharts: 每日趋势图 (按日期分组)
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
      textStyle: { color: '#94a3b8' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: sortedDates,
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: {
        color: '#94a3b8',
        formatter: (val: number) => `${Math.round(val / 60000)}分`,
      },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        name: '实际活跃时间',
        type: 'line',
        smooth: true,
        data: sortedDates.map((d) => dateMap[d].active),
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.0)' },
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

  // ECharts: 24小时分布图
  const hourMap = new Array(24).fill(0);
  logs.forEach((log) => {
    hourMap[log.hour] += log.activeTimeMs;
  });

  const hourOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => `${params[0].axisValue}时: ${formatMs(params[0].value)}`,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}`),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: {
        color: '#94a3b8',
        formatter: (val: number) => `${Math.round(val / 60000)}分`,
      },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        name: '活跃时间',
        type: 'bar',
        data: hourMap,
        itemStyle: {
          color: '#8b5cf6',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  // 黑名单添加与删除
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

  // 导入/导出 JSON
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
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* 左侧侧边栏 */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">InsightTrack</h1>
              <p className="text-xs text-slate-400">网页注意力统计仪表盘</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>概览分析</span>
            </button>

            <button
              onClick={() => setActiveTab('site_detail')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'site_detail'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>站点下钻</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'compare'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>历史比对</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>管理与设置</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          InsightTrack v1.0.0 (Manifest V3)
        </div>
      </aside>

      {/* 主工作区 */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* 顶部标题与筛选栏 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {activeTab === 'overview' && '概览与多维度趋势'}
              {activeTab === 'site_detail' && '单站点深度分析'}
              {activeTab === 'compare' && '跨时间段比对'}
              {activeTab === 'settings' && '偏好设置与数据管理'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              查看和量化您在浏览网页时的真实注意力分配
            </p>
          </div>

          {activeTab === 'overview' && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === 'today' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                今日
              </button>
              <button
                onClick={() => setDateRange('7days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === '7days' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                近 7 天
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === '30days' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                近 30 天
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 核心数据 Card 组 */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center justify-between text-blue-400 mb-2">
                  <span className="text-sm font-medium">总实际活跃时间</span>
                  <Activity className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-white">{formatMs(totalActiveMs)}</div>
                <p className="text-xs text-slate-500 mt-2">前台聚焦且保持操作的总时间</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-sm font-medium">总页面驻留时间</span>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-slate-200">{formatMs(totalOpenMs)}</div>
                <p className="text-xs text-slate-500 mt-2">包含后台静置在标签页上的总时长</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-sm font-medium">专注专注度比例</span>
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-emerald-400">
                  {totalOpenMs > 0 ? `${Math.round((totalActiveMs / totalOpenMs) * 100)}%` : '0%'}
                </div>
                <p className="text-xs text-slate-500 mt-2">实际活跃时长占驻留总长比例</p>
              </div>
            </div>

            {/* 图表第 1 排 */}
            <div className="grid grid-cols-3 gap-6">
              {/* 每日趋势 */}
              <div className="col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h3 className="text-base font-bold text-white mb-4">每日时间起伏趋势</h3>
                <ReactECharts option={trendOption} style={{ height: '300px' }} />
              </div>

              {/* 访问 Top 10 饼图 */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h3 className="text-base font-bold text-white mb-4">Top 10 网站时间占比</h3>
                <ReactECharts option={pieOption} style={{ height: '300px' }} />
              </div>
            </div>

            {/* 图表第 2 排 */}
            <div className="grid grid-cols-3 gap-6">
              {/* 24 小时分布热力 */}
              <div className="col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h3 className="text-base font-bold text-white mb-4">24 小时活跃时段分布热力</h3>
                <ReactECharts option={hourOption} style={{ height: '260px' }} />
              </div>

              {/* Top 排行榜列表 */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl overflow-hidden">
                <h3 className="text-base font-bold text-white mb-4">域名时长排行榜</h3>
                <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                  {domainStatsList.map((d, index) => (
                    <div key={d.domain} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 truncate max-w-[180px]">
                        <span className="w-5 text-xs text-slate-500 font-mono">{index + 1}.</span>
                        <span className="text-slate-300 truncate">{d.domain}</span>
                      </div>
                      <span className="font-medium text-slate-400 text-xs">{formatMs(d.activeTimeMs)}</span>
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
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-400">选择要分析的网站:</span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {domainStatsList.map((d) => (
                    <option key={d.domain} value={d.domain}>
                      {d.domain}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">该站点总活跃时间</span>
                <span className="text-xl font-bold text-blue-400">
                  {formatMs(domainMap[selectedDomain]?.active || 0)}
                </span>
              </div>
            </div>

            {/* 单站点记录明细 */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-4">最常访问页面明细 ({selectedDomain})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 text-xs">
                    <tr>
                      <th className="p-3 rounded-l-xl">页面标题</th>
                      <th className="p-3">完整 URL</th>
                      <th className="p-3">活跃时间</th>
                      <th className="p-3 rounded-r-xl">访问日期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs
                      .filter((l) => l.domain === selectedDomain)
                      .slice(0, 15)
                      .map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3 font-medium text-slate-200 max-w-[240px] truncate">
                            {log.title || '无标题'}
                          </td>
                          <td className="p-3 text-slate-400 max-w-[300px] truncate font-mono text-xs">
                            {log.url}
                          </td>
                          <td className="p-3 text-blue-400 font-medium">{formatMs(log.activeTimeMs)}</td>
                          <td className="p-3 text-slate-500 text-xs">{log.date}</td>
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
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-400">对比站点:</span>
                <select
                  value={compareDomain}
                  onChange={(e) => setCompareDomain(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {domainStatsList.map((d) => (
                    <option key={d.domain} value={d.domain}>
                      {d.domain}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-400">
                对比不同周期的上网习惯，发现时间分配变化
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-4">【本周期 vs 历史记录】对比柱状图</h3>
              <ReactECharts
                option={{
                  backgroundColor: 'transparent',
                  tooltip: { trigger: 'axis' },
                  legend: { data: ['本周期活跃时间', '驻留时间'], textStyle: { color: '#94a3b8' } },
                  xAxis: {
                    type: 'category',
                    data: [compareDomain],
                    axisLabel: { color: '#94a3b8' },
                  },
                  yAxis: { type: 'value', axisLabel: { color: '#94a3b8' } },
                  series: [
                    {
                      name: '本周期活跃时间',
                      type: 'bar',
                      data: [domainMap[compareDomain]?.active || 0],
                      itemStyle: { color: '#3b82f6' },
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
            {/* 黑名单设置 */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span>不纳入统计的网站黑名单</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                黑名单内的域名或匹配通配符的网站将完全暂停时间记录与统计。
              </p>

              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="如: github.com 或 *.local"
                  value={newBlacklistItem}
                  onChange={(e) => setNewBlacklistItem(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddBlacklist}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {settings.blacklist.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleRemoveBlacklist(item)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 数据备份与清除 */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-2">数据管理与隐私控制</h3>
              <p className="text-xs text-slate-400 mb-4">所有浏览时间数据均安全存储在您的本地浏览器中。</p>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExportData}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm rounded-xl flex items-center space-x-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>导出本地日志 JSON 备份</span>
                </button>

                <button
                  onClick={handleClearLogs}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-medium text-sm rounded-xl flex items-center space-x-2 transition-all"
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
