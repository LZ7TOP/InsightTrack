import ReactECharts from 'echarts-for-react'
import { Activity, Clock, Zap, BarChart3 } from 'lucide-react'
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
      formatter: (params: any) => `${params.name}: ${formatMs(params.value)} (${params.percent}%)`,
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

  // 网站使用时间对比柱状图 (高颜值双色嵌套胶囊柱状图：外层底柱表示总驻留时间，内层蓝色渐变柱表示实际活跃时间)
  const siteList = domainStatsList.slice(0, 12)
  const siteNames = siteList.map((d) => d.domain)
  const siteActiveTimes = siteList.map((d) => d.activeTimeMs)
  const siteOpenTimes = siteList.map((d) => d.openTimeMs)

  const websiteComparisonChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let res = `<div style="font-weight: bold; margin-bottom: 6px; color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">网站: ${params[0].axisValue}</div>`
        params.forEach((p: any) => {
          const colorHex = typeof p.color === 'string' ? p.color : '#2563EB'
          res += `<div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: 12px; margin-top: 4px;">
            <span style="color: ${colorHex}; font-weight: 600;">${p.marker} ${p.seriesName}</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(p.value)}</b>
          </div>`
        })
        return res
      },
    },
    legend: {
      data: ['总驻留时间', '实际活跃时间'],
      textStyle: { color: '#64748B', fontFamily: 'Inter', fontSize: 12 },
      top: '0%',
    },
    grid: { left: '3%', right: '4%', bottom: '14%', containLabel: true },
    xAxis: {
      type: 'category',
      data: siteNames,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: {
        color: '#64748B',
        rotate: siteNames.length > 5 ? 25 : 0,
        fontFamily: 'Inter',
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#64748B', formatter: (val: number) => `${Math.round(val / 60000)}分` },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    series: [
      {
        name: '总驻留时间',
        type: 'bar',
        barWidth: '24px',
        data: siteOpenTimes,
        itemStyle: {
          color: '#E2E8F0',
          borderRadius: [10, 10, 0, 0],
        },
        z: 1,
      },
      {
        name: '实际活跃时间',
        type: 'bar',
        barWidth: '14px',
        barGap: '-79%',
        data: siteActiveTimes,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3B82F6' },
              { offset: 1, color: '#1D4ED8' },
            ],
          },
          borderRadius: [8, 8, 0, 0],
        },
        z: 2,
      },
    ],
  }

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
        lineStyle: { width: 3 },
      },
      {
        name: '页面驻留时间',
        type: 'line',
        smooth: true,
        data: sortedDates.map((d) => dateMap[d].open),
        itemStyle: { color: '#94A3B8' },
        lineStyle: { width: 2, type: 'dashed' },
      },
    ],
  }

  // 24小时分布
  const hourMap: number[] = new Array(24).fill(0)
  logs.forEach((log) => {
    if (log.hour >= 0 && log.hour < 24) {
      hourMap[log.hour] += log.activeTimeMs
    }
  })

  const hourOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => `${params[0].axisValue}点: ${formatMs(params[0].value)}`,
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
        name: '活跃时长',
        type: 'bar',
        data: hourMap,
        itemStyle: { color: '#2563EB', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }

  return (
    <div className='space-y-6'>
      {/* 顶部指标卡片 */}
      <div className='grid grid-cols-3 gap-6'>
        <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm'>
          <div className='flex items-center justify-between text-[#2563EB] text-xs font-bold uppercase mb-2'>
            <span>实际活跃时间 (Active Time)</span>
            <Activity className='w-4 h-4 text-[#2563EB]' />
          </div>
          <div className='text-2xl font-bold text-slate-900 tracking-tight'>
            {formatMs(totalActiveMs)}
          </div>
          <div className='text-[11px] font-medium text-[#64748B] mt-2'>
            键盘鼠标存在实际交互的专注时间
          </div>
        </div>

        <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm'>
          <div className='flex items-center justify-between text-[#64748B] text-xs font-bold uppercase mb-2'>
            <span>总驻留时间 (Open Time)</span>
            <Clock className='w-4 h-4 text-[#64748B]' />
          </div>
          <div className='text-2xl font-bold text-slate-800 tracking-tight'>
            {formatMs(totalOpenMs)}
          </div>
          <div className='text-[11px] font-medium text-[#64748B] mt-2'>
            标签页打开在浏览器中的挂机与后台总时长
          </div>
        </div>

        <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm'>
          <div className='flex items-center justify-between text-[#BC4800] text-xs font-bold uppercase mb-2'>
            <span>专注率 (Focus Rate)</span>
            <Zap className='w-4 h-4 text-[#BC4800]' />
          </div>
          <div className='text-2xl font-bold text-[#BC4800] tracking-tight'>{focusScore}%</div>
          <div className='text-[11px] font-medium text-[#64748B] mt-2'>
            实际活跃时长占驻留总时长比重
          </div>
        </div>
      </div>

      {/* 全量网站使用时间对比柱状图 */}
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2'>
            <BarChart3 className='w-5 h-5 text-[#2563EB]' />
            <h3 className='text-base font-bold text-slate-900'>
              全量网站使用时长对比柱状图 (横轴: 网站域名 / 纵轴: 使用时长)
            </h3>
          </div>
          <span className='text-xs text-[#64748B] font-medium'>
            单柱对比：深蓝色表示实际活跃时间，灰色表示挂机/后台驻留时间
          </span>
        </div>
        <ReactECharts option={websiteComparisonChartOption} style={{ height: '320px' }} />
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
