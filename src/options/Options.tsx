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

import DateRangePicker, { DateRangeType } from '../components/DateRangePicker'

export default function Options() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [dateRange, setDateRange] = useState<DateRangeType>('today')
  const [customStartDate, setCustomStartDate] = useState<string>(getLocalDateStr(new Date()))
  const [customEndDate, setCustomEndDate] = useState<string>(getLocalDateStr(new Date()))

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
  }, [dateRange, customStartDate, customEndDate])

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
  }, [settings.autoRefresh, settings.autoRefreshIntervalSeconds, dateRange, customStartDate, customEndDate])

  async function loadData() {
    const end = new Date()
    const start = new Date()

    let startStr = getLocalDateStr(start)
    let endStr = getLocalDateStr(end)

    if (dateRange === 'today') {
      startStr = getLocalDateStr(start)
      endStr = getLocalDateStr(end)
    } else if (dateRange === '7days') {
      start.setDate(end.getDate() - 6)
      startStr = getLocalDateStr(start)
      endStr = getLocalDateStr(end)
    } else if (dateRange === '30days') {
      start.setDate(end.getDate() - 29)
      startStr = getLocalDateStr(start)
      endStr = getLocalDateStr(end)
    } else if (dateRange === 'custom') {
      startStr = customStartDate || getLocalDateStr(start)
      endStr = customEndDate || getLocalDateStr(end)
      // 若开始日期晚于结束日期，自动调整
      if (startStr > endStr) {
        const tmp = startStr
        startStr = endStr
        endStr = tmp
      }
    }

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
    setTimeout(() => setStatusMessage(''), 3000)
  }

  // 聚合逻辑
  const domainMap = buildDomainMap(logs, cleanDomain)
  const siteList = buildSiteList(domainMap)
  const domainStatsList = buildDomainStatsList(siteList)

  // 下拉选择 Option 构造
  const domainSelectOptions: SelectOption[] = domainStatsList.map((d) => ({
    value: d.domain,
    label: d.domain,
    subLabel: formatMs(d.activeTimeMs),
  }))

  const totalActiveMs = logs.reduce((sum, item) => sum + item.activeTimeMs, 0)
  const totalOpenMs = logs.reduce((sum, item) => sum + item.openTimeMs, 0)
  const focusScore =
    totalOpenMs > 0 ? Math.round((totalActiveMs / totalOpenMs) * 100) : 0

  return (
    <div className='flex h-screen bg-[#F0F2F8] text-slate-800 font-sans overflow-hidden'>
      {/* 模块化 Sidebar 组件 */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 右侧主内容区 */}
      <main className='flex-1 overflow-y-auto relative flex flex-col'>
        {/* 固定吸顶 Header & 时间筛选工具栏 */}
        <header className='sticky top-0 z-30 bg-[#F0F2F8]/95 backdrop-blur-md px-8 py-5 border-b border-slate-200/60 flex items-center justify-between shadow-sm shrink-0 mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-slate-900 tracking-tight'>
              {activeTab === 'overview' && '概览分析'}
              {activeTab === 'site_list' && '网站明细'}
              {activeTab === 'site_detail' && '单站下钻'}
              {activeTab === 'compare' && '跨段比对'}
              {activeTab === 'settings' && '偏好设置'}
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

            {/* 自定义弹出下拉式时间范围选择器 */}
            <DateRangePicker
              dateRange={dateRange}
              startDate={customStartDate}
              endDate={customEndDate}
              onChange={(range, s, e) => {
                setDateRange(range)
                setCustomStartDate(s)
                setCustomEndDate(e)
              }}
            />
          </div>
        </header>

        {/* 动态渲染组件化的各 Tab 内容页 (补回 px-8 pb-8 外层容器间距) */}
        <div className='px-8 pb-8 flex-1'>
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
        </div>
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
