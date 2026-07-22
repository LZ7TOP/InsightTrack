import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { GitCompare, Calendar, Activity, Zap } from 'lucide-react'
import { DomainStats, PageVisitRecord } from '../storage/types'
import { cleanDomain } from '../storage/db'
import { CustomSelect, SelectOption } from '../components/CustomSelect'
import FaviconImg from '../components/FaviconImg'
import { formatMs } from './utils'

interface CompareTabProps {
  domainStatsList: DomainStats[]
  domainSelectOptions: SelectOption[]
  initialDomain: string
  logs: PageVisitRecord[]
  domainMap?: Record<string, any>
}

export default function CompareTab({
  domainSelectOptions,
  initialDomain,
  logs,
  domainMap,
}: CompareTabProps) {
  const [compareDomain, setCompareDomain] = useState(initialDomain)

  // 对比单站点：当前选择网站在所选周期内每一天的时间对比数据计算
  const selectedDomainLogs = logs.filter(
    (l) => cleanDomain(l.domain) === cleanDomain(compareDomain),
  )

  // 提取所选周期内的所有日期（升序排列，保证包含每一天）
  const allDates = Array.from(new Set(logs.map((l) => l.date))).sort()

  const domainDailyActive = allDates.map((date) => {
    return selectedDomainLogs
      .filter((l) => l.date === date)
      .reduce((sum, cur) => sum + cur.activeTimeMs, 0)
  })

  const domainDailyOpen = allDates.map((date) => {
    return selectedDomainLogs
      .filter((l) => l.date === date)
      .reduce((sum, cur) => sum + cur.openTimeMs, 0)
  })

  // 统计指标
  const totalDomainActiveMs = domainDailyActive.reduce((a, b) => a + b, 0)
  const totalDomainOpenMs = domainDailyOpen.reduce((a, b) => a + b, 0)
  const activeDaysCount = domainDailyActive.filter((val) => val > 0).length
  const avgDailyActiveMs =
    activeDaysCount > 0 ? Math.round(totalDomainActiveMs / activeDaysCount) : 0
  const maxDailyActiveMs = domainDailyActive.length > 0 ? Math.max(...domainDailyActive) : 0
  const avgFocusRate =
    totalDomainOpenMs > 0
      ? Math.min(100, Math.round((totalDomainActiveMs / totalDomainOpenMs) * 100))
      : 0

  const currentTitle =
    domainMap && domainMap[compareDomain]?.title
      ? domainMap[compareDomain].title
      : selectedDomainLogs[0]?.title || compareDomain

  const singleDomainDailyComparisonChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let res = `<div style="font-weight: bold; margin-bottom: 4px; color: #1E293B;">日期: ${params[0].axisValue}</div>`
        params.forEach((p: any) => {
          res += `<div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: 12px; margin-top: 2px;">
            <span style="color: ${p.color}; font-weight: 600;">${p.marker} ${p.seriesName}</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(p.value)}</b>
          </div>`
        })
        return res
      },
    },
    legend: {
      data: ['每日实际活跃时间', '每日总驻留时间'],
      textStyle: { color: '#64748B', fontFamily: 'Inter' },
      top: '0%',
    },
    grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: allDates.length > 0 ? allDates : ['无数据'],
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#64748B', fontFamily: 'Inter', fontSize: 11 },
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
        name: '每日实际活跃时间',
        type: 'bar',
        barMaxWidth: 32,
        data: domainDailyActive,
        itemStyle: { color: '#2563EB', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '每日总驻留时间',
        type: 'bar',
        barMaxWidth: 32,
        data: domainDailyOpen,
        itemStyle: { color: '#94A3B8', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }

  return (
    <div className='space-y-6 animate-in fade-in duration-200'>
      {/* 顶部网站 Header 介绍卡片 (1:1 统一风格) */}
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='flex items-center space-x-4'>
          {/* 网站大图标 */}
          <FaviconImg
            domain={compareDomain}
            className='w-14 h-14 rounded-2xl object-contain shadow-sm border border-slate-100 p-1 shrink-0 bg-slate-50'
          />
          <div>
            <div className='flex flex-wrap items-center gap-2.5'>
              <h2 className='text-xl font-extrabold text-slate-900 tracking-tight'>
                {currentTitle}
              </h2>
              <span className='px-2.5 py-0.5 bg-blue-50 text-[#2563EB] border border-blue-200/80 rounded-lg text-xs font-mono font-bold shadow-xs'>
                {compareDomain}
              </span>
            </div>
            <p className='text-xs font-medium text-[#64748B] mt-1.5'>单站历史多周期跨段比对分析</p>
          </div>
        </div>

        {/* 网站切换下拉框 */}
        <div className='flex items-center space-x-2.5 shrink-0 self-end sm:self-center'>
          <span className='text-xs font-bold text-[#64748B]'>切换对比网站:</span>
          <CustomSelect
            options={domainSelectOptions}
            value={compareDomain}
            onChange={setCompareDomain}
            searchable
            icon={<GitCompare className='w-4 h-4' />}
            className='w-60'
          />
        </div>
      </div>

      {/* 选定单站点的统计数据指标卡片 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2'>
          <div className='flex items-center justify-between text-[#2563EB] text-xs font-bold uppercase'>
            <span>单站日均活跃</span>
            <Activity className='w-4 h-4 text-[#2563EB]' />
          </div>
          <div className='text-2xl font-bold text-slate-900 tracking-tight font-mono'>
            {formatMs(avgDailyActiveMs)}
          </div>
          <div className='text-[11px] font-medium text-[#64748B]'>
            在已计入的 {activeDaysCount} 个活跃天数中平均每日活跃
          </div>
        </div>

        <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2'>
          <div className='flex items-center justify-between text-[#059669] text-xs font-bold uppercase'>
            <span>最高单日活跃</span>
            <Calendar className='w-4 h-4 text-[#059669]' />
          </div>
          <div className='text-2xl font-bold text-emerald-600 tracking-tight font-mono'>
            {formatMs(maxDailyActiveMs)}
          </div>
          <div className='text-[11px] font-medium text-[#64748B]'>本周期内单日最高访问活跃纪录</div>
        </div>

        <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2'>
          <div className='flex items-center justify-between text-[#BC4800] text-xs font-bold uppercase'>
            <span>平均专注率</span>
            <Zap className='w-4 h-4 text-[#BC4800]' />
          </div>
          <div className='text-2xl font-bold text-[#BC4800] tracking-tight font-mono'>
            {avgFocusRate}%
          </div>
          <div className='text-[11px] font-medium text-[#64748B]'>
            本周期累计活跃 ({formatMs(totalDomainActiveMs)}) / 累计驻留 (
            {formatMs(totalDomainOpenMs)})
          </div>
        </div>
      </div>

      {/* 单站点每日时间对比图表 */}
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-sm font-bold text-slate-900 flex items-center space-x-2'>
            <GitCompare className='w-4 h-4 text-[#2563EB]' />
            <span>【{compareDomain}】所选周期内逐日时间对比 (横轴: 日期 / 纵轴: 使用时长)</span>
          </h3>
          <span className='text-xs text-[#64748B] font-medium'>
            直观观察该网站在每一天的时间波动与专注趋势
          </span>
        </div>
        <ReactECharts option={singleDomainDailyComparisonChartOption} style={{ height: '340px' }} />
      </div>
    </div>
  )
}
