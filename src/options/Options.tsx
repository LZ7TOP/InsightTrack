import { useEffect, useState } from 'react'
import { RotateCw, CheckCircle2 } from 'lucide-react'
import {
  getVisitLogsByDateRange,
  getSettings,
  getLocalDateStr,
  cleanDomain,
} from '../storage/db'
import { PageVisitRecord, AppSettings } from '../storage/types'
import { SelectOption } from '../components/CustomSelect'

import Sidebar from './Sidebar'
import OverviewTab from './OverviewTab'
import SiteListTab from './SiteListTab'
import SiteDetailTab from './SiteDetailTab'
import CompareTab from './CompareTab'
import SettingsTab from './SettingsTab'
import {
  TabType,
  buildDomainMap,
  buildSiteList,
  buildDomainStatsList,
  formatMs,
} from './utils'

export default function Options() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days'>(
    'today',
  )
  const [logs, setLogs] = useState<PageVisitRecord[]>([])
  const [settings, setSettingsState] = useState<AppSettings>({
    enableIdleDetection: false,
    idleThresholdSeconds: 180,
    blacklist: ['localhost', '127.0.0.1'],
    mergeSubdomains: false,
    showBadge: true,
    enableDailyGoal: false,
    dailyGoalHours: 4,
    notifyOnGoalReached: true,
    autoRefresh: true,
    autoRefreshIntervalSeconds: 5,
  })

  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>('')

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, () => {
      loadData()
    })
  }, [dateRange])

  // 定时自动刷新仪表盘数据
  useEffect(() => {
    if (!settings.autoRefresh) return
    const intervalMs = (settings.autoRefreshIntervalSeconds || 5) * 1000
    const timer = setInterval(() => {
      chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, () => {
        loadData()
      })
    }, intervalMs)

    return () => clearInterval(timer)
  }, [settings.autoRefresh, settings.autoRefreshIntervalSeconds, dateRange])

  async function loadData() {
    const end = new Date()
    const start = new Date()

    if (dateRange === 'today') {
      // 今日
    } else if (dateRange === '7days') {
      start.setDate(end.getDate() - 6)
    } else if (dateRange === '30days') {
      start.setDate(end.getDate() - 29)
    }

    const startStr = getLocalDateStr(start)
    const endStr = getLocalDateStr(end)

    const fetchedLogs = await getVisitLogsByDateRange(startStr, endStr)
    setLogs(fetchedLogs)

    const s = await getSettings()
    setSettingsState(s)

    const domains = Array.from(
      new Set(fetchedLogs.map((l) => cleanDomain(l.domain))),
    )
    setSelectedDomain((prev) => (prev ? prev : domains.length > 0 ? domains[0] : ''))
  }

  function handleRefresh() {
    setRefreshing(true)
    chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, () => {
      loadData().then(() => {
        setTimeout(() => setRefreshing(false), 300)
      })
    })
  }

  function handleJumpToDetail(domain: string) {
    setSelectedDomain(domain)
    setActiveTab('site_detail')
  }

  function showFlashMessage(msg: string) {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(''), 2500)
  }

  // 计算全局指标
  const totalOpenMs = logs.reduce((acc, cur) => acc + cur.openTimeMs, 0)
  const totalActiveMs = logs.reduce((acc, cur) => acc + cur.activeTimeMs, 0)
  const focusScore =
    totalOpenMs > 0
      ? Math.min(100, Math.round((totalActiveMs / totalOpenMs) * 100))
      : 0

  // 聚合域名映射
  const domainMap = buildDomainMap(logs, cleanDomain)
  const siteList = buildSiteList(domainMap)
  const domainStatsList = buildDomainStatsList(siteList)

  // 下拉选择 Option 构造
  const domainSelectOptions: SelectOption[] = domainStatsList.map((d) => ({
    value: d.domain,
    label: d.domain,
    subLabel: formatMs(d.activeTimeMs),
  }))

  return (
    <div className='flex h-screen bg-[#F0F2F8] text-slate-800 font-sans overflow-hidden'>
      {/* 模块化 Sidebar 组件 */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 右侧主内容区 */}
      <main className='flex-1 overflow-y-auto p-8'>
        {/* 顶部 Header & 时间筛选工具栏 */}
        <header className='flex items-center justify-between mb-8'>
          <div>
            <h2 className='text-2xl font-bold text-slate-900 tracking-tight'>
              {activeTab === 'overview' && '概览与多维度趋势分析'}
              {activeTab === 'site_list' && '全量网站访问明细表'}
              {activeTab === 'site_detail' && '单站点下钻与切页流水'}
              {activeTab === 'compare' && '全量网站时间对比与比对'}
              {activeTab === 'settings' && '偏好设置与数据管理控制台'}
            </h2>
            <p className='text-xs font-semibold text-[#64748B] mt-1'>
              InsightTrack · 洞察真实注意力分配
            </p>
          </div>

          <div className='flex items-center space-x-3'>
            {statusMessage && (
              <div className='flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in duration-200'>
                <CheckCircle2 className='w-4 h-4' />
                <span>{statusMessage}</span>
              </div>
            )}

            <button
              onClick={handleRefresh}
              className='px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all'
              title='强制将后台未落盘的内存时间写盘并刷新'
            >
              <RotateCw
                className={`w-3.5 h-3.5 text-[#2563EB] ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />
              <span>刷新数据</span>
            </button>

            <div className='flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm'>
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  dateRange === 'today'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-slate-900'
                }`}
              >
                今日
              </button>
              <button
                onClick={() => setDateRange('7days')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  dateRange === '7days'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-slate-900'
                }`}
              >
                近7天
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  dateRange === '30days'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-slate-900'
                }`}
              >
                近30天
              </button>
            </div>
          </div>
        </header>

        {/* 动态渲染组件化的各 Tab 内容页 */}
        {activeTab === 'overview' && (
          <OverviewTab
            totalActiveMs={totalActiveMs}
            totalOpenMs={totalOpenMs}
            focusScore={focusScore}
            domainStatsList={domainStatsList}
            domainMap={domainMap}
            logs={logs}
          />
        )}

        {activeTab === 'site_list' && (
          <SiteListTab
            siteList={siteList}
            onJumpToDetail={handleJumpToDetail}
          />
        )}

        {activeTab === 'site_detail' && (
          <SiteDetailTab
            selectedDomain={selectedDomain}
            onDomainChange={setSelectedDomain}
            domainSelectOptions={domainSelectOptions}
            domainMap={domainMap}
            logs={logs}
          />
        )}

        {activeTab === 'compare' && (
          <CompareTab
            domainStatsList={domainStatsList}
            domainSelectOptions={domainSelectOptions}
            initialDomain={selectedDomain}
            logs={logs}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            logs={logs}
            onSettingsChange={setSettingsState}
            onDataChange={loadData}
            onFlashMessage={showFlashMessage}
          />
        )}
      </main>

      {/* 右下角固定 GitHub 图标与 LZ7工作室 LOGO 品牌卡片 */}
      <a
        href='https://github.com/LZ7TOP'
        target='_blank'
        rel='noreferrer'
        className='fixed bottom-6 right-6 z-40 bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-slate-900/5 px-3.5 py-2 rounded-2xl flex items-center space-x-2.5 hover:shadow-xl hover:scale-105 hover:border-blue-300 transition-all duration-200 group text-slate-800'
        title='访问 LZ7工作室 GitHub 主页 (https://github.com/LZ7TOP)'
      >
        <img
          src='/logo_black.png'
          alt='LZ7工作室'
          className='w-5 h-5 object-contain rounded-md group-hover:rotate-6 transition-transform'
        />
        <span className='text-xs font-bold text-slate-800 group-hover:text-[#2563EB] transition-colors'>
          LZ7工作室
        </span>
        <span className='w-px h-3.5 bg-slate-200'></span>
        <svg className='w-4 h-4 fill-slate-700 group-hover:fill-[#2563EB] transition-colors' viewBox='0 0 24 24'>
          <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' />
        </svg>
      </a>
    </div>
  )
}
