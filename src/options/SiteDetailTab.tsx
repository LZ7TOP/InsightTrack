import { Fragment, useState } from 'react'
import { Clock, Globe, ChevronRight, ChevronDown } from 'lucide-react'
import { PageVisitRecord } from '../storage/types'
import { cleanDomain } from '../storage/db'
import { SelectOption, CustomSelect } from '../components/CustomSelect'
import TooltipText from '../components/TooltipText'
import { formatMs, formatTimestamp, DomainAggregation } from './utils'

interface SiteDetailTabProps {
  selectedDomain: string
  onDomainChange: (domain: string) => void
  domainSelectOptions: SelectOption[]
  domainMap: Record<string, DomainAggregation>
  logs: PageVisitRecord[]
}

export default function SiteDetailTab({
  selectedDomain,
  onDomainChange,
  domainSelectOptions,
  domainMap,
  logs,
}: SiteDetailTabProps) {
  const [expandedUrls, setExpandedUrls] = useState<Record<string, boolean>>({})

  function toggleExpandUrl(url: string) {
    setExpandedUrls((prev) => ({ ...prev, [url]: !prev[url] }))
  }

  // 按 URL 归并并记录每次切换的具体流水
  const siteLogs = logs.filter((l) => cleanDomain(l.domain) === selectedDomain)
  const pageMap: Record<
    string,
    {
      title: string
      url: string
      activeMs: number
      openMs: number
      visitCount: number
      lastDate: string
      sessions: PageVisitRecord[]
    }
  > = {}

  siteLogs.forEach((log) => {
    const key = log.url
    if (!pageMap[key]) {
      pageMap[key] = {
        title: log.title || selectedDomain,
        url: log.url,
        activeMs: 0,
        openMs: 0,
        visitCount: 0,
        lastDate: log.date,
        sessions: [],
      }
    }
    pageMap[key].activeMs += log.activeTimeMs
    pageMap[key].openMs += log.openTimeMs
    pageMap[key].visitCount += 1
    pageMap[key].sessions.push(log)

    if (log.date > pageMap[key].lastDate) pageMap[key].lastDate = log.date
    if (log.title && log.title !== selectedDomain) pageMap[key].title = log.title
  })

  const aggregatedPageList = Object.values(pageMap).sort((a, b) => b.activeMs - a.activeMs)

  return (
    <div className='space-y-6'>
      <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <span className='text-xs font-bold text-[#64748B]'>选择要分析的网站:</span>
          <CustomSelect
            options={domainSelectOptions}
            value={selectedDomain}
            onChange={onDomainChange}
            searchable
            icon={<Globe className='w-4 h-4' />}
            className='w-64'
          />
        </div>
        <div className='text-right'>
          <span className='text-xs font-medium text-[#64748B] block'>该站点活跃总时长</span>
          <span className='text-lg font-bold text-[#2563EB]'>
            {formatMs(domainMap[selectedDomain]?.active || 0)}
          </span>
        </div>
      </div>

      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-sm font-bold text-slate-900'>
            最常访问页面明细 ({selectedDomain})
          </h3>
          <span className='text-xs text-[#64748B] font-medium'>
            标题与完整 URL 超出时，悬停即可弹出查看全称；点击行可展开切页流水
          </span>
        </div>

        <div className='overflow-x-auto max-h-[600px] overflow-y-auto rounded-xl border border-slate-200 relative'>
          <table className='w-full text-left text-xs border-collapse'>
            <thead className='bg-slate-50 text-[#64748B] font-bold sticky top-0 z-20 shadow-sm'>
              <tr>
                <th className='p-3 w-8 border-b border-slate-200 sticky left-0 z-30 bg-slate-50'></th>
                <th className='p-3 border-b border-r border-slate-200 sticky left-8 z-30 bg-slate-50 min-w-[220px]'>
                  页面标题 (固定列)
                </th>
                <th className='p-3 border-b border-slate-200'>完整 URL</th>
                <th className='p-3 border-b border-slate-200'>访问/切换次数</th>
                <th className='p-3 border-b border-slate-200'>累计活跃时间</th>
                <th className='p-3 border-b border-slate-200'>累计驻留时间</th>
                <th className='p-3 border-b border-slate-200'>最近访问日期</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {aggregatedPageList.slice(0, 30).map((page, idx) => {
                const isExpanded = !!expandedUrls[page.url]
                const sortedSessions = [...page.sessions].sort((a, b) => b.timestamp - a.timestamp)

                return (
                  <Fragment key={idx}>
                    <tr
                      onClick={() => toggleExpandUrl(page.url)}
                      className={`group cursor-pointer transition-colors ${
                        isExpanded ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className='p-3 text-center text-[#64748B] sticky left-0 z-10 bg-white group-hover:bg-slate-50'>
                        {isExpanded ? (
                          <ChevronDown className='w-4 h-4 text-[#2563EB]' />
                        ) : (
                          <ChevronRight className='w-4 h-4 text-slate-400' />
                        )}
                      </td>
                      <td className='p-3 font-semibold text-slate-800 sticky left-8 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 min-w-[220px] shadow-sm'>
                        <TooltipText
                          text={page.title || '无标题'}
                          maxWidthClass='max-w-[200px]'
                          className='font-bold text-slate-900'
                        />
                      </td>
                      <td className='p-3 text-[#64748B] font-mono max-w-[280px]'>
                        <TooltipText
                          text={page.url}
                          maxWidthClass='max-w-[260px]'
                          asMonospace
                        />
                      </td>
                      <td className='p-3 font-bold text-slate-700 whitespace-nowrap'>
                        <span className='px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200'>
                          {page.visitCount} 次切换
                        </span>
                      </td>
                      <td className='p-3 text-[#2563EB] font-bold whitespace-nowrap'>{formatMs(page.activeMs)}</td>
                      <td className='p-3 text-[#64748B] font-medium whitespace-nowrap'>{formatMs(page.openMs)}</td>
                      <td className='p-3 text-[#64748B] whitespace-nowrap'>{page.lastDate}</td>
                    </tr>

                    {isExpanded && (
                      <tr className='bg-slate-50/80'>
                        <td colSpan={7} className='p-4 border-t border-b border-blue-100'>
                          <div className='bg-white rounded-xl p-4 border border-slate-200 shadow-inner'>
                            <h4 className='text-xs font-bold text-slate-900 mb-3 flex items-center space-x-2'>
                              <Clock className='w-3.5 h-3.5 text-[#2563EB]' />
                              <span>【{page.title}】每次切换/访问的具体时间点与时长记录流水</span>
                            </h4>

                            <div className='max-h-60 overflow-y-auto rounded-lg border border-slate-100'>
                              <table className='w-full text-left text-[11px] font-mono'>
                                <thead className='bg-slate-100 text-[#64748B] font-bold sticky top-0 z-10'>
                                  <tr>
                                    <th className='p-2 w-12 text-center'>#</th>
                                    <th className='p-2'>具体切换时刻</th>
                                    <th className='p-2'>本次活跃时长</th>
                                    <th className='p-2'>本次驻留时长</th>
                                    <th className='p-2'>状态标识</th>
                                  </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                  {sortedSessions.map((sess, sIdx) => {
                                    const isSessionActive = sess.activeTimeMs > 0
                                    return (
                                      <tr key={sIdx} className='hover:bg-slate-50'>
                                        <td className='p-2 text-center text-slate-400 font-bold'>
                                          {sortedSessions.length - sIdx}
                                        </td>
                                        <td className='p-2 font-bold text-slate-800'>
                                          {sess.date} {formatTimestamp(sess.timestamp)}
                                        </td>
                                        <td className='p-2 font-bold text-[#2563EB]'>
                                          {formatMs(sess.activeTimeMs)}
                                        </td>
                                        <td className='p-2 text-[#64748B] font-medium'>
                                          {formatMs(sess.openTimeMs)}
                                        </td>
                                        <td className='p-2'>
                                          {isSessionActive ? (
                                            <span className='px-2 py-0.5 bg-blue-50 text-[#2563EB] border border-blue-200 rounded-md font-sans text-[10px] font-bold'>
                                              前台聚焦活跃
                                            </span>
                                          ) : (
                                            <span className='px-2 py-0.5 bg-slate-100 text-[#64748B] border border-slate-200 rounded-md font-sans text-[10px] font-medium'>
                                              后台驻留/空闲
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
