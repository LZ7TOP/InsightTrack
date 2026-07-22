import { useEffect, useState } from 'react'
import { ShieldOff, ShieldCheck, ExternalLink, Activity, Eye, RotateCw } from 'lucide-react'
import {
  getVisitLogsByDateRange,
  getSettings,
  saveSettings,
  getLocalDateStr,
  cleanDomain,
} from '../storage/db'
import { DomainStats } from '../storage/types'

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0秒'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}小时${minutes}分`
  }
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`
  }
  return `${seconds}秒`
}

export default function Popup() {
  const [currentDomain, setCurrentDomain] = useState<string>('')
  const [isBlacklisted, setIsBlacklisted] = useState<boolean>(false)
  const [todayOpenMs, setTodayOpenMs] = useState<number>(0)
  const [todayActiveMs, setTodayActiveMs] = useState<number>(0)
  const [currentDomainOpenMs, setCurrentDomainOpenMs] = useState<number>(0)
  const [currentDomainActiveMs, setCurrentDomainActiveMs] = useState<number>(0)
  const [topDomains, setTopDomains] = useState<DomainStats[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  async function loadPopupData(showLoading = true) {
    if (showLoading) setLoading(true)
    const todayStr = getLocalDateStr()
    const logs = await getVisitLogsByDateRange(todayStr, todayStr)
    const settings = await getSettings()

    let totalOpen = 0
    let totalActive = 0
    const domainMap: Record<string, { open: number; active: number }> = {}

    logs.forEach((log) => {
      totalOpen += log.openTimeMs
      totalActive += log.activeTimeMs

      const domainKey = cleanDomain(log.domain)
      if (!domainMap[domainKey]) {
        domainMap[domainKey] = { open: 0, active: 0 }
      }
      domainMap[domainKey].open += log.openTimeMs
      domainMap[domainKey].active += log.activeTimeMs
    })

    setTodayOpenMs(totalOpen)
    setTodayActiveMs(totalActive)

    const sortedDomains: DomainStats[] = Object.entries(domainMap)
      .map(([domain, stats]) => ({
        domain,
        openTimeMs: stats.open,
        activeTimeMs: stats.active,
        lastVisited: Date.now(),
      }))
      .sort((a, b) => b.activeTimeMs - a.activeTimeMs)
      .slice(0, 4)

    setTopDomains(sortedDomains)

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url)
          const domain = cleanDomain(url.hostname)
          setCurrentDomain(domain)
          setIsBlacklisted(settings.blacklist.includes(domain))
          if (domain && domainMap[domain]) {
            setCurrentDomainActiveMs(domainMap[domain].active)
            setCurrentDomainOpenMs(domainMap[domain].open)
          } else {
            setCurrentDomainActiveMs(0)
            setCurrentDomainOpenMs(0)
          }
        } catch {
          setCurrentDomain('')
          setCurrentDomainActiveMs(0)
          setCurrentDomainOpenMs(0)
        }
      }
      setLoading(false)
    })
  }

  useEffect(() => {
    // 强制后台立即刷新未落盘的内存时间，确保数据百分之百实时
    chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, () => {
      loadPopupData(true)
    })

    let timer: NodeJS.Timeout | null = null
    getSettings().then((s) => {
      if (s.autoRefresh) {
        const intervalMs = (s.autoRefreshIntervalSeconds || 5) * 1000
        timer = setInterval(() => {
          chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, () => {
            loadPopupData(false)
          })
        }, intervalMs)
      }
    })

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [])

  function handleRefresh() {
    setRefreshing(true)
    chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, () => {
      loadPopupData().then(() => {
        setTimeout(() => setRefreshing(false), 300)
      })
    })
  }

  async function toggleBlacklist() {
    if (!currentDomain) return
    const settings = await getSettings()
    let newBlacklist = [...settings.blacklist]

    if (isBlacklisted) {
      newBlacklist = newBlacklist.filter((d) => cleanDomain(d) !== currentDomain)
    } else {
      newBlacklist.push(currentDomain)
    }

    await saveSettings({ ...settings, blacklist: newBlacklist })
    setIsBlacklisted(!isBlacklisted)
  }

  function openDashboard() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open(chrome.runtime.getURL('src/options/index.html'))
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64 bg-[#F0F2F8] text-slate-500'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]'></div>
      </div>
    )
  }

  const isCurrentValid = Boolean(currentDomain)
  const displayActiveMs = isCurrentValid ? currentDomainActiveMs : todayActiveMs
  const displayOpenMs = isCurrentValid ? currentDomainOpenMs : todayOpenMs

  return (
    <div className='p-4 bg-[#F0F2F8] text-slate-800 flex flex-col justify-between h-full'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-slate-200/80 pb-3'>
        <div className='flex items-center space-x-2.5'>
          <img
            src='/logo.svg'
            alt='InsightTrack Logo'
            className='w-8 h-8 object-contain drop-shadow-sm'
          />
          <div>
            <h1 className='font-bold text-sm tracking-tight text-slate-900'>InsightTrack</h1>
            <span className='text-[11px] text-[#64748B]'>今日浏览分析</span>
          </div>
        </div>

        <div className='flex items-center space-x-1'>
          <button
            onClick={handleRefresh}
            className='p-1.5 hover:bg-white rounded-lg text-[#64748B] hover:text-[#2563EB] transition-colors flex items-center gap-1 text-xs font-medium border border-transparent hover:border-slate-200'
            title='刷新最新数据'
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#2563EB]' : ''}`}
            />
          </button>
          <button
            onClick={openDashboard}
            className='p-1.5 hover:bg-white rounded-lg text-[#64748B] hover:text-[#2563EB] transition-colors flex items-center gap-1 text-xs font-medium border border-transparent hover:border-slate-200'
            title='打开完整仪表盘'
          >
            <span>大屏</span>
            <ExternalLink className='w-3.5 h-3.5' />
          </button>
        </div>
      </div>

      {/* Overview Cards (默认展示当前网页/本站的活跃时间与驻留时间) */}
      <div className='grid grid-cols-2 gap-2.5 my-3'>
        <div className='bg-white p-3 rounded-2xl border border-slate-200 shadow-sm'>
          <div className='flex items-center space-x-1.5 text-[#2563EB] text-xs font-semibold mb-1'>
            <Activity className='w-3.5 h-3.5' />
            <span>{isCurrentValid ? '本站活跃时间' : '全局活跃时间'}</span>
          </div>
          <div className='text-base font-bold text-slate-900 tracking-tight'>
            {formatDuration(displayActiveMs)}
          </div>
        </div>

        <div className='bg-white p-3 rounded-2xl border border-slate-200 shadow-sm'>
          <div className='flex items-center space-x-1.5 text-[#64748B] text-xs font-semibold mb-1'>
            <Eye className='w-3.5 h-3.5' />
            <span>{isCurrentValid ? '本站驻留时间' : '全局驻留时间'}</span>
          </div>
          <div className='text-base font-bold text-slate-700 tracking-tight'>
            {formatDuration(displayOpenMs)}
          </div>
        </div>
      </div>

      {/* Current Site Status */}
      {currentDomain && (
        <div className='bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between my-1'>
          <div className='truncate max-w-[190px]'>
            <span className='text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block'>
              当前域名
            </span>
            <span className='text-xs font-bold text-slate-800 truncate block'>{currentDomain}</span>
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
                <ShieldOff className='w-3.5 h-3.5' />
                <span>已被忽略</span>
              </>
            ) : (
              <>
                <ShieldCheck className='w-3.5 h-3.5' />
                <span>正常追踪</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Top Websites */}
      <div className='mt-2'>
        <h3 className='text-xs font-bold text-[#64748B] mb-2'>今日最常访问</h3>
        {topDomains.length === 0 ? (
          <div className='text-center py-4 text-xs text-[#64748B]'>暂无访问记录</div>
        ) : (
          <div className='space-y-2'>
            {topDomains.map((item) => {
              const percent =
                todayActiveMs > 0
                  ? Math.min(100, Math.round((item.activeTimeMs / todayActiveMs) * 100))
                  : 0
              return (
                <div
                  key={item.domain}
                  className='bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs'
                >
                  <div className='flex justify-between items-center mb-1.5'>
                    <span className='font-semibold text-slate-800 truncate max-w-[170px]'>
                      {item.domain}
                    </span>
                    <span className='text-[#64748B] font-mono'>
                      {formatDuration(item.activeTimeMs)}
                    </span>
                  </div>
                  <div className='w-full bg-slate-100 h-2 rounded-full overflow-hidden'>
                    <div
                      className='bg-[#2563EB] h-full rounded-full transition-all duration-300'
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer Button & Brand Link */}
      <div className='mt-3 pt-2.5 border-t border-slate-200 flex flex-col items-center space-y-2'>
        <button
          onClick={openDashboard}
          className='w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5'
        >
          <span>查看完整图表与历史数据对比</span>
        </button>

        <a
          href='https://github.com/LZ7TOP'
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 hover:text-[#2563EB] transition-colors'
          title='访问 LZ7工作室 GitHub 主页 (https://github.com/LZ7TOP)'
        >
          <img src='/logo_black.png' alt='LZ7工作室' className='w-3.5 h-3.5 object-contain' />
          <span>LZ7工作室</span>
          <svg className='w-3 h-3 fill-current ml-0.5' viewBox='0 0 24 24'>
            <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' />
          </svg>
        </a>
      </div>
    </div>
  )
}
