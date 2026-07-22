import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { GitCompare, Calendar, Activity, Clock } from 'lucide-react'
import { DomainStats, PageVisitRecord } from '../storage/types'
import { cleanDomain } from '../storage/db'
import { CustomSelect, SelectOption } from '../components/CustomSelect'
import { formatMs } from './utils'

interface CompareTabProps {
  domainStatsList: DomainStats[]
  domainSelectOptions: SelectOption[]
  initialDomain: string
  logs: PageVisitRecord[]
}

export default function CompareTab({
  domainSelectOptions,
  initialDomain,
  logs,
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
  const avgDailyActiveMs = activeDaysCount > 0 ? Math.round(totalDomainActiveMs / activeDaysCount) : 0

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
    <div className='space-y-6'>
      {/* 单站点选择栏 */}
      <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <span className='text-xs font-bold text-[#64748B]'>选择要对比的网站:</span>
          <CustomSelect
            options={domainSelectOptions}
            value={compareDomain}
            onChange={setCompareDomain}
            searchable
            icon={<GitCompare className='w-4 h-4' />}
            className='w-64'
          />
        </div>
        <div className='text-xs text-[#64748B] font-medium'>
          正在查看 <span className='font-bold text-slate-900'>{compareDomain || '暂无选定网站'}</span> 在选择周期内每一天的时间对比
        </div>
      </div>

      {/* 选定单站点的统计数据指标卡片 */}
      <div className='grid grid-cols-3 gap-6'>
        <div className='bg-white border border-slate-200 p-4 rounded-2xl shadow-sm'>
          <div className='flex items-center justify-between text-[#2563EB] text-xs font-bold uppercase mb-1'>
            <span>本周期累计活跃时间</span>
            <Activity className='w-4 h-4' />
          </div>
          <div className='text-xl font-bold text-slate-900 tracking-tight'>
            {formatMs(totalDomainActiveMs)}
          </div>
        </div>

        <div className='bg-white border border-slate-200 p-4 rounded-2xl shadow-sm'>
          <div className='flex items-center justify-between text-[#64748B] text-xs font-bold uppercase mb-1'>
            <span>本周期累计驻留时间</span>
            <Clock className='w-4 h-4' />
          </div>
          <div className='text-xl font-bold text-slate-800 tracking-tight'>
            {formatMs(totalDomainOpenMs)}
          </div>
        </div>

        <div className='bg-white border border-slate-200 p-4 rounded-2xl shadow-sm'>
          <div className='flex items-center justify-between text-[#059669] text-xs font-bold uppercase mb-1'>
            <span>活跃天数与日均活跃</span>
            <Calendar className='w-4 h-4' />
          </div>
          <div className='text-xl font-bold text-emerald-600 tracking-tight'>
            {activeDaysCount} 天 (日均 {formatMs(avgDailyActiveMs)})
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
        <ReactECharts
          option={singleDomainDailyComparisonChartOption}
          style={{ height: '340px' }}
        />
      </div>
    </div>
  )
}
