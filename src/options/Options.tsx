import { Fragment, useEffect, useState } from 'react';
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
  TrendingUp,
  ChevronRight,
  ChevronDown,
  List,
  Search,
  ArrowUpDown,
  ExternalLink,
  LineChart
} from 'lucide-react';
import { getVisitLogsByDateRange, getSettings, saveSettings, clearAllLogs, getLocalDateStr, cleanDomain } from '../storage/db';
import { PageVisitRecord, AppSettings, DomainStats } from '../storage/types';
import { CustomSelect, SelectOption } from '../components/CustomSelect';

type TabType = 'overview' | 'site_list' | 'site_detail' | 'compare' | 'settings';

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '0秒';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) return `${hours}小时 ${mins}分`;
  if (mins > 0) return `${mins}分 ${secs}秒`;
  return `${secs}秒`;
}

function formatTimestamp(ts: number): string {
  if (!ts) return '--:--:--';
  const d = new Date(ts);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function Options() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  // 默认展示近7天（方便展示对比折线图趋势），也可以切换今日或近30天
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

  // 控制单站点表格行展开状态
  const [expandedUrls, setExpandedUrls] = useState<Record<string, boolean>>({});

  // 完整网站列表页面的搜索与排序状态
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'active' | 'open' | 'visits' | 'focus'>('active');

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, () => {
      loadData();
    });
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

    const domains = Array.from(new Set(fetchedLogs.map((l) => cleanDomain(l.domain))));
    if (domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0]);
      setCompareDomain(domains[0]);
    }
  }

  function toggleExpandUrl(url: string) {
    setExpandedUrls((prev) => ({
      ...prev,
      [url]: !prev[url],
    }));
  }

  function handleJumpToDetail(domain: string) {
    setSelectedDomain(domain);
    setActiveTab('site_detail');
  }

  // 统计指标
  const totalOpenMs = logs.reduce((acc, cur) => acc + cur.openTimeMs, 0);
  const totalActiveMs = logs.reduce((acc, cur) => acc + cur.activeTimeMs, 0);
  const focusScore = totalOpenMs > 0 ? Math.min(100, Math.round((totalActiveMs / totalOpenMs) * 100)) : 0;

  // 域名全局聚合 (统一清洗 www. 前缀)
  const domainMap: Record<
    string,
    {
      title: string;
      open: number;
      active: number;
      visits: number;
      urls: Set<string>;
    }
  > = {};

  logs.forEach((log) => {
    const domainKey = cleanDomain(log.domain);
    if (!domainMap[domainKey]) {
      domainMap[domainKey] = {
        title: log.title || domainKey,
        open: 0,
        active: 0,
        visits: 0,
        urls: new Set(),
      };
    }
    domainMap[domainKey].open += log.openTimeMs;
    domainMap[domainKey].active += log.activeTimeMs;
    domainMap[domainKey].visits += 1;
    domainMap[domainKey].urls.add(log.url);

    if (log.title && log.title !== domainKey) {
      domainMap[domainKey].title = log.title;
    }
  });

  // 转换成完整的网站列表项目
  interface SiteListItem {
    domain: string;
    title: string;
    openTimeMs: number;
    activeTimeMs: number;
    visits: number;
    urlCount: number;
    focusRate: number;
    faviconUrl: string;
  }

  const fullSiteList: SiteListItem[] = Object.entries(domainMap).map(([domain, stats]) => {
    const focusRate = stats.open > 0 ? Math.min(100, Math.round((stats.active / stats.open) * 100)) : 0;
    return {
      domain,
      title: stats.title,
      openTimeMs: stats.open,
      activeTimeMs: stats.active,
      visits: stats.visits,
      urlCount: stats.urls.size,
      focusRate,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    };
  });

  // 列表过滤与排序
  const filteredSiteList = fullSiteList
    .filter(
      (item) =>
        item.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'active') return b.activeTimeMs - a.activeTimeMs;
      if (sortBy === 'open') return b.openTimeMs - a.openTimeMs;
      if (sortBy === 'visits') return b.visits - a.visits;
      if (sortBy === 'focus') return b.focusRate - a.focusRate;
      return 0;
    });

  const domainStatsList: DomainStats[] = fullSiteList
    .map((s) => ({
      domain: s.domain,
      openTimeMs: s.openTimeMs,
      activeTimeMs: s.activeTimeMs,
      lastVisited: Date.now(),
    }))
    .sort((a, b) => b.activeTimeMs - a.activeTimeMs);

  // 下拉选择组件的 Options 数据结构转换
  const domainSelectOptions: SelectOption[] = domainStatsList.map((d) => ({
    value: d.domain,
    label: d.domain,
    subLabel: formatMs(d.activeTimeMs),
  }));

  const sortOptions: SelectOption[] = [
    { value: 'active', label: '按实际活跃时间' },
    { value: 'open', label: '按总驻留时间' },
    { value: 'visits', label: '按访问/切换次数' },
    { value: 'focus', label: '按专注率' },
  ];

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
        color: ['#2563EB', '#BC4800', '#059669', '#7C3AED', '#0284C7', '#D97706', '#DB2777'],
        data: domainStatsList.slice(0, 10).map((d) => ({
          name: d.domain,
          value: d.activeTimeMs,
        })),
      },
    ],
  };

  // ECharts: 整体趋势图
  const dateMap: Record<string, { open: number; active: number }> = {};
  logs.forEach((log) => {
    if (!dateMap[log.date]) {
      dateMap[log.date] = { open: 0, active: 0 };
    }
    dateMap[log.date].open += log.openTimeMs;
    dateMap[log.date].active += log.activeTimeMs;
  });

  const sortedDates = Object.keys(dateMap).sort();

  // ★核心功能：Top 热门网站使用时间对比折线图 (Multi-Site Active Time Comparison Line Chart)
  const topComparingDomains = domainStatsList.slice(0, 5).map((d) => d.domain);
  const domainDateMap: Record<string, Record<string, number>> = {};

  topComparingDomains.forEach((d) => {
    domainDateMap[d] = {};
    sortedDates.forEach((date) => {
      domainDateMap[d][date] = 0;
    });
  });

  logs.forEach((log) => {
    const cleanD = cleanDomain(log.domain);
    if (domainDateMap[cleanD] && domainDateMap[cleanD][log.date] !== undefined) {
      domainDateMap[cleanD][log.date] += log.activeTimeMs;
    }
  });

  const palette = ['#2563EB', '#BC4800', '#059669', '#7C3AED', '#0284C7', '#D97706'];

  const multiSiteTrendOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let res = `<div style="font-weight: bold; margin-bottom: 4px; color: #1E293B;">${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          res += `<div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: 12px; margin-top: 2px;">
            <span style="color: ${p.color}; font-weight: 600;">${p.marker} ${p.seriesName}</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(p.value)}</b>
          </div>`;
        });
        return res;
      },
    },
    legend: {
      data: topComparingDomains,
      textStyle: { color: '#64748B', fontFamily: 'Inter' },
      top: '0%',
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
    series: topComparingDomains.map((domainName, idx) => ({
      name: domainName,
      type: 'line',
      smooth: true,
      data: sortedDates.map((date) => domainDateMap[domainName][date] || 0),
      itemStyle: { color: palette[idx % palette.length] },
      lineStyle: { width: 3 },
      symbolSize: 6,
    })),
  };

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

  // 单站点深度分析：按 URL 进行归并，并记录每次切换的具体流水（Sessions）
  const siteLogs = logs.filter((l) => cleanDomain(l.domain) === selectedDomain);
  const pageMap: Record<
    string,
    {
      title: string;
      url: string;
      activeMs: number;
      openMs: number;
      visitCount: number;
      lastDate: string;
      sessions: PageVisitRecord[];
    }
  > = {};

  siteLogs.forEach((log) => {
    const key = log.url;
    if (!pageMap[key]) {
      pageMap[key] = {
        title: log.title || selectedDomain,
        url: log.url,
        activeMs: 0,
        openMs: 0,
        visitCount: 0,
        lastDate: log.date,
        sessions: [],
      };
    }
    pageMap[key].activeMs += log.activeTimeMs;
    pageMap[key].openMs += log.openTimeMs;
    pageMap[key].visitCount += 1;
    pageMap[key].sessions.push(log);

    if (log.date > pageMap[key].lastDate) {
      pageMap[key].lastDate = log.date;
    }
    if (log.title && log.title !== selectedDomain) {
      pageMap[key].title = log.title;
    }
  });

  const aggregatedPageList = Object.values(pageMap).sort((a, b) => b.activeMs - a.activeMs);

  async function handleAddBlacklist() {
    if (!newBlacklistItem.trim()) return;
    const clean = cleanDomain(newBlacklistItem.trim());
    if (!settings.blacklist.includes(clean)) {
      const newB = [...settings.blacklist, clean];
      const newS = { ...settings, blacklist: newB };
      await saveSettings(newS);
      setSettingsState(newS);
      setNewBlacklistItem('');
    }
  }

  async function handleRemoveBlacklist(item: string) {
    const newB = settings.blacklist.filter((b) => cleanDomain(b) !== cleanDomain(item));
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
              onClick={() => setActiveTab('site_list')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'site_list'
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                  : 'text-[#64748B] hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>网站列表明细</span>
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
              <span>单站点深度下钻</span>
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
              {activeTab === 'site_list' && '全量网站信息与访问列表'}
              {activeTab === 'site_detail' && '单站点深度分析与切页流水'}
              {activeTab === 'compare' && '跨时间段比对'}
              {activeTab === 'settings' && '偏好设置与数据管理'}
            </h2>
            <p className="text-xs text-[#64748B] mt-1 font-medium">
              基于核心设计规范系统生成的全面注意力量化报告
            </p>
          </div>

          {(activeTab === 'overview' || activeTab === 'site_list' || activeTab === 'compare') && (
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
                  <span>总驻留时间 (全标签页累加)</span>
                  <Clock className="w-4 h-4 text-[#64748B]" />
                </div>
                <div className="text-2xl font-bold text-slate-800 tracking-tight">{formatMs(totalOpenMs)}</div>
                <div className="text-[11px] font-medium text-[#64748B] mt-2">后台所有打开标签页的累计存在时长</div>
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

            {/* ★核心重点图表：Top 热门网站使用时间对比折线图 */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <LineChart className="w-5 h-5 text-[#2563EB]" />
                  <h3 className="text-base font-bold text-slate-900">
                    Top 热门网站使用时间对比折线图
                  </h3>
                </div>
                <span className="text-xs text-[#64748B] font-medium">
                  对比前 Top 5 头部网站的每日活跃注意力起伏走势
                </span>
              </div>
              <ReactECharts option={multiSiteTrendOption} style={{ height: '320px' }} />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">每日整体时间起伏趋势</h3>
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

        {/* Tab 2: Site List (全量网站列表页面) */}
        {activeTab === 'site_list' && (
          <div className="space-y-6">
            {/* Search and Sort Toolbar */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索网站名称或域名 (如: douyin.com)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#64748B]">排序规则:</span>
                <CustomSelect
                  options={sortOptions}
                  value={sortBy}
                  onChange={(val) => setSortBy(val as any)}
                  icon={<ArrowUpDown className="w-3.5 h-3.5" />}
                  className="w-44"
                />
              </div>
            </div>

            {/* Site Directory Table */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  完整网站访问明细 (共 {filteredSiteList.length} 个网站)
                </h3>
              </div>

              {filteredSiteList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  暂无匹配的网站数据
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[#64748B] font-bold">
                      <tr>
                        <th className="p-3.5 rounded-l-xl">网站图标与名称</th>
                        <th className="p-3.5">网站域名 / 网址</th>
                        <th className="p-3.5">访问/切换次数</th>
                        <th className="p-3.5">实际活跃时间</th>
                        <th className="p-3.5">总驻留时间</th>
                        <th className="p-3.5">专注率</th>
                        <th className="p-3.5 rounded-r-xl text-center">快捷操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSiteList.map((site) => (
                        <tr key={site.domain} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-semibold text-slate-800">
                            <div className="flex items-center space-x-3">
                              <img
                                src={site.faviconUrl}
                                alt=""
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                                className="w-5 h-5 rounded-md object-contain bg-slate-100"
                              />
                              <span className="font-bold text-slate-900 truncate max-w-[180px]">
                                {site.title}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-[#64748B]">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-mono text-[11px]">
                              {site.domain}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-700">
                            {site.visits} 次 ({site.urlCount} 个页面)
                          </td>
                          <td className="p-3.5 font-bold text-[#2563EB]">
                            {formatMs(site.activeTimeMs)}
                          </td>
                          <td className="p-3.5 text-[#64748B] font-medium">
                            {formatMs(site.openTimeMs)}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#2563EB] h-full rounded-full"
                                  style={{ width: `${site.focusRate}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-xs text-slate-700">
                                {site.focusRate}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleJumpToDetail(site.domain)}
                              className="px-3 py-1.5 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-[#2563EB]/30 rounded-xl font-bold text-[11px] inline-flex items-center space-x-1 transition-all"
                            >
                              <span>深度下钻</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Site Detail */}
        {activeTab === 'site_detail' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-[#64748B]">选择要分析的网站:</span>
                <CustomSelect
                  options={domainSelectOptions}
                  value={selectedDomain}
                  onChange={setSelectedDomain}
                  searchable
                  icon={<Globe className="w-4 h-4" />}
                  className="w-64"
                />
              </div>

              <div className="text-right">
                <span className="text-xs font-medium text-[#64748B] block">该站点活跃总时长</span>
                <span className="text-lg font-bold text-[#2563EB]">
                  {formatMs(domainMap[selectedDomain]?.active || 0)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  最常访问页面明细 ({selectedDomain})
                </h3>
                <span className="text-xs text-[#64748B] font-medium">
                  点击任意行可展开查看每次切页的具体时间戳流水
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[#64748B] font-bold">
                    <tr>
                      <th className="p-3 w-8"></th>
                      <th className="p-3 rounded-l-xl">页面标题</th>
                      <th className="p-3">完整 URL</th>
                      <th className="p-3">访问/切换次数</th>
                      <th className="p-3">累计活跃时间</th>
                      <th className="p-3">累计驻留时间</th>
                      <th className="p-3 rounded-r-xl">最近访问日期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aggregatedPageList.slice(0, 20).map((page, idx) => {
                      const isExpanded = !!expandedUrls[page.url];
                      const sortedSessions = [...page.sessions].sort((a, b) => b.timestamp - a.timestamp);

                      return (
                        <Fragment key={idx}>
                          <tr
                            onClick={() => toggleExpandUrl(page.url)}
                            className={`cursor-pointer transition-colors ${
                              isExpanded ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-3 text-center text-[#64748B]">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-[#2563EB]" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </td>
                            <td className="p-3 font-semibold text-slate-800 max-w-[200px] truncate">
                              {page.title || '无标题'}
                            </td>
                            <td className="p-3 text-[#64748B] max-w-[240px] truncate font-mono">
                              {page.url}
                            </td>
                            <td className="p-3 font-bold text-slate-700">
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                                {page.visitCount} 次切换
                              </span>
                            </td>
                            <td className="p-3 text-[#2563EB] font-bold">{formatMs(page.activeMs)}</td>
                            <td className="p-3 text-[#64748B] font-medium">{formatMs(page.openMs)}</td>
                            <td className="p-3 text-[#64748B]">{page.lastDate}</td>
                          </tr>

                          {/* 展开显示的切页时间具体流水子表格 */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={7} className="p-4 border-t border-b border-blue-100">
                                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-inner">
                                  <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center space-x-2">
                                    <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                                    <span>【{page.title}】每次切换/访问的具体时间点与时长记录流水</span>
                                  </h4>

                                  <div className="max-h-60 overflow-y-auto">
                                    <table className="w-full text-left text-[11px] font-mono">
                                      <thead className="bg-slate-100 text-[#64748B] font-bold">
                                        <tr>
                                          <th className="p-2 w-12 text-center">#</th>
                                          <th className="p-2">具体切换时刻</th>
                                          <th className="p-2">本次活跃时长</th>
                                          <th className="p-2">本次驻留时长</th>
                                          <th className="p-2">状态标识</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {sortedSessions.map((sess, sIdx) => {
                                          const isSessionActive = sess.activeTimeMs > 0;
                                          return (
                                            <tr key={sIdx} className="hover:bg-slate-50">
                                              <td className="p-2 text-center text-slate-400 font-bold">
                                                {sortedSessions.length - sIdx}
                                              </td>
                                              <td className="p-2 font-bold text-slate-800">
                                                {sess.date} {formatTimestamp(sess.timestamp)}
                                              </td>
                                              <td className="p-2 font-bold text-[#2563EB]">
                                                {formatMs(sess.activeTimeMs)}
                                              </td>
                                              <td className="p-2 text-[#64748B] font-medium">
                                                {formatMs(sess.openTimeMs)}
                                              </td>
                                              <td className="p-2">
                                                {isSessionActive ? (
                                                  <span className="px-2 py-0.5 bg-blue-50 text-[#2563EB] border border-blue-200 rounded-md font-sans text-[10px] font-bold">
                                                    前台聚焦活跃
                                                  </span>
                                                ) : (
                                                  <span className="px-2 py-0.5 bg-slate-100 text-[#64748B] border border-slate-200 rounded-md font-sans text-[10px] font-medium">
                                                    后台驻留/空闲
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Compare */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <LineChart className="w-5 h-5 text-[#2563EB]" />
                  <h3 className="text-base font-bold text-slate-900">
                    多网站使用时间对比折线图
                  </h3>
                </div>
                <span className="text-xs text-[#64748B] font-medium">
                  聚合 Top 5 核心网站的每日活跃时间趋势多线比对
                </span>
              </div>
              <ReactECharts option={multiSiteTrendOption} style={{ height: '340px' }} />
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-[#64748B]">对比单站点:</span>
                <CustomSelect
                  options={domainSelectOptions}
                  value={compareDomain}
                  onChange={setCompareDomain}
                  searchable
                  icon={<GitCompare className="w-4 h-4" />}
                  className="w-64"
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">【本周期 vs 历史记录】对比柱状图 ({compareDomain})</h3>
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

        {/* Tab 5: Settings */}
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
