import ReactECharts from 'echarts-for-react'
import { Activity, Clock, Zap, TrendingUp } from 'lucide-react'
import { DomainStats } from '../storage/types'
import { formatMs, DomainAggregation } from './utils'

interface OverviewTabProps {
  totalActiveMs: number
  totalOpenMs: number
  focusScore: number
  domainStatsList: DomainStats[]
  domainMap: Record<string, DomainAggregation>
  logs: { date: string; openTimeMs: number; activeTimeMs: number; hour: number }[]
}

export default function OverviewTab({
  totalActiveMs,
  totalOpenMs,
  focusScore,
  domainStatsList,
  logs,
}: OverviewTabProps) {
  // ECharts: 饼图
  const pieOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) =>
        `${params.name}: ${formatMs(params.value)} (${params.percent}%)`,
    },
    series: [
      {
        name: '活跃时间',
        type: 'pie',
        radius: ['50%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#ffffff', borderWidth: 2 },
        label: { show: false },
        color: ['#2563EB', '#BC4800', '#059669', '#7C3AED', '#0284C7', '#D97706', '#DB2777'],
        data: domainStatsList.slice(0, 10).map((d) => ({
          name: d.domain,
          value: d.activeTimeMs,
        })),
      },
    ],
  }

  // 日期趋势数据
  const dateMap: Record<string, { open: number; active: number }> = {}
  logs.forEach((log) => {
    if (!dateMap[log.date]) {
      dateMap[log.date] = { open: 0, active: 0 }
    }
    dateMap[log.date].open += log.openTimeMs
    dateMap[log.date].active += log.activeTimeMs
  })
  const sortedDates = Object.keys(dateMap).sort()

  const trendOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let res = `${params[0].axisValue}<br/>`
        params.forEach((p: any) => {
          res += `${p.marker} ${p.seriesName}: ${formatMs(p.value)}<br/>`
        })
        return res
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
      axisLabel: { color: '#64748B', formatter: (val: number) => `${Math.round(val / 60000)}分` },
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
  }

  // 24h 热力图
  const hourMap = new Array(24).fill(0)
  logs.forEach((log) => {
    hourMap[log.hour] += log.activeTimeMs
  })

  const hourOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) =>
        `${params[0].axisValue}:00: ${formatMs(params[0].value)}`,
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
      axisLabel: { color: '#64748B', formatter: (val: number) => `${Math.round(val / 60000)}分` },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    series: [
      {
        name: '活跃时间',
        type: 'bar',
        data: hourMap,
        itemStyle: { color: '#2563EB', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }

  return (
    <div className='space-y-6'>
      {/* 指标卡片 */}
      <div className='grid grid-cols-3 gap-6'>
        <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm'>
          <div className='flex items-center justify-between text-[#2563EB] text-xs font-bold uppercase mb-2'>
            <span>实际活跃时间</span>
            <Activity className='w-4 h-4 text-[#2563EB]' />
          </div>
          <div className='text-2xl font-bold text-slate-900 tracking-tight'>
            {formatMs(totalActiveMs)}
          </div>
          <div className='flex items-center space-x-1 text-[11px] font-semibold text-[#2563EB] mt-2'>
            <TrendingUp className='w-3.5 h-3.5' />
            <span>注意力前台聚焦时长</span>
          </div>
        </div>

        <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm'>
          <div className='flex items-center justify-between text-[#64748B] text-xs font-bold uppercase mb-2'>
            <span>总驻留时间 (全标签页累加)</span>
            <Clock className='w-4 h-4 text-[#64748B]' />
          </div>
          <div className='text-2xl font-bold text-slate-800 tracking-tight'>
            {formatMs(totalOpenMs)}
          </div>
          <div className='text-[11px] font-medium text-[#64748B] mt-2'>
            后台所有打开标签页的累计存在时长
          </div>
        </div>

        <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm'>
          <div className='flex items-center justify-between text-[#BC4800] text-xs font-bold uppercase mb-2'>
            <span>专注率 (Focus Rate)</span>
            <Zap className='w-4 h-4 text-[#BC4800]' />
          </div>
          <div className='text-2xl font-bold text-[#BC4800] tracking-tight'>
            {focusScore}%
          </div>
          <div className='text-[11px] font-medium text-[#64748B] mt-2'>
            实际活跃时长占驻留总时长比重
          </div>
        </div>
      </div>

      {/* 趋势 + 饼图 */}
      <div className='grid grid-cols-3 gap-6'>
        <div className='col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
          <h3 className='text-sm font-bold text-slate-900 mb-4'>每日整体时间起伏趋势</h3>
          <ReactECharts option={trendOption} style={{ height: '280px' }} />
        </div>
        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
          <h3 className='text-sm font-bold text-slate-900 mb-4'>Top 10 网站占比</h3>
          <ReactECharts option={pieOption} style={{ height: '280px' }} />
        </div>
      </div>

      {/* 24h 分布 + 排行榜 */}
      <div className='grid grid-cols-3 gap-6'>
        <div className='col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
          <h3 className='text-sm font-bold text-slate-900 mb-4'>24 小时活跃时段分布</h3>
          <ReactECharts option={hourOption} style={{ height: '240px' }} />
        </div>
        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
          <h3 className='text-sm font-bold text-slate-900 mb-4'>域名时长排行榜</h3>
          <div className='space-y-3 max-h-[220px] overflow-y-auto pr-1'>
            {domainStatsList.map((d, index) => (
              <div key={d.domain} className='flex items-center justify-between text-xs'>
                <div className='flex items-center space-x-2 truncate max-w-[160px]'>
                  <span className='font-bold text-[#64748B]'>{index + 1}.</span>
                  <span className='font-medium text-slate-800 truncate'>{d.domain}</span>
                </div>
                <span className='font-bold text-[#2563EB]'>{formatMs(d.activeTimeMs)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
