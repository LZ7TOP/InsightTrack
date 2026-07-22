import ReactECharts from 'echarts-for-react'
import { Activity, Clock, Zap } from 'lucide-react'
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

  // 域名详细信息索引表
  const domainDetailsMap: Record<string, DomainStats> = {}
  domainStatsList.forEach((item) => {
    domainDetailsMap[item.domain] = item
  })

  // 1. 实际活跃时间对比图数据 (横向条形图，按 activeTimeMs 降序)
  const sortedByActive = [...domainStatsList]
    .sort((a, b) => b.activeTimeMs - a.activeTimeMs)
    .slice(0, 10)
  const activeDomains = sortedByActive.map((d) => d.domain)
  const activeValues = sortedByActive.map((d) => d.activeTimeMs)

  const activeComparisonChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0]
        const domain = p.name
        const detail = domainDetailsMap[domain] || {
          activeTimeMs: p.value,
          openTimeMs: p.value,
        }
        const activeMs = detail.activeTimeMs || 0
        const openMs = detail.openTimeMs || 0
        const idleMs = Math.max(0, openMs - activeMs)
        const rate = openMs > 0 ? Math.round((activeMs / openMs) * 100) : 0

        return `<div style="font-weight: bold; font-size: 13px; margin-bottom: 8px; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🌐</span> <span>${domain}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; min-width: 190px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #2563EB; font-weight: 600;">⚡ 实际活跃时间</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(activeMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748B; font-weight: 600;">🕒 页面驻留总时长</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(openMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94A3B8; font-weight: 600;">💤 挂机/后台时长</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(idleMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px; padding-top: 4px; border-top: 1px dashed #E2E8F0;">
            <span style="color: #BC4800; font-weight: 600;">🎯 专注率</span>
            <b style="color: #BC4800; font-family: monospace;">${rate}%</b>
          </div>
        </div>`
      },
    },
    grid: { left: '3%', right: '22%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#64748B', formatter: (val: number) => `${Math.round(val / 60000)}分` },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    yAxis: {
      type: 'category',
      data: activeDomains,
      inverse: true,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: {
        color: '#64748B',
        fontFamily: 'Inter',
        fontSize: 11,
        formatter: (val: string) => (val.length > 16 ? val.slice(0, 16) + '...' : val),
      },
    },
    series: [
      {
        name: '实际活跃时间',
        type: 'bar',
        barWidth: '14px',
        data: activeValues,
        label: {
          show: true,
          position: 'right',
          color: '#475569',
          fontSize: 11,
          fontFamily: 'Inter',
          formatter: (params: any) => `${formatMs(params.value)}`,
        },
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#3B82F6' },
              { offset: 1, color: '#1D4ED8' },
            ],
          },
          borderRadius: [0, 8, 8, 0],
        },
      },
    ],
  }

  // 2. 挂机/后台驻留时间对比图数据 (横向条形图，按 openTimeMs 降序)
  const sortedByOpen = [...domainStatsList].sort((a, b) => b.openTimeMs - a.openTimeMs).slice(0, 10)
  const openDomains = sortedByOpen.map((d) => d.domain)
  const openValues = sortedByOpen.map((d) => d.openTimeMs)

  const idleComparisonChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0]
        const domain = p.name
        const detail = domainDetailsMap[domain] || {
          activeTimeMs: p.value,
          openTimeMs: p.value,
        }
        const activeMs = detail.activeTimeMs || 0
        const openMs = detail.openTimeMs || 0
        const idleMs = Math.max(0, openMs - activeMs)
        const rate = openMs > 0 ? Math.round((activeMs / openMs) * 100) : 0

        return `<div style="font-weight: bold; font-size: 13px; margin-bottom: 8px; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🌐</span> <span>${domain}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; min-width: 190px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #2563EB; font-weight: 600;">⚡ 实际活跃时间</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(activeMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748B; font-weight: 600;">🕒 页面驻留总时长</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(openMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94A3B8; font-weight: 600;">💤 挂机/后台时长</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(idleMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px; padding-top: 4px; border-top: 1px dashed #E2E8F0;">
            <span style="color: #BC4800; font-weight: 600;">🎯 专注率</span>
            <b style="color: #BC4800; font-family: monospace;">${rate}%</b>
          </div>
        </div>`
      },
    },
    grid: { left: '3%', right: '22%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#64748B', formatter: (val: number) => `${Math.round(val / 60000)}分` },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    yAxis: {
      type: 'category',
      data: openDomains,
      inverse: true,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: {
        color: '#64748B',
        fontFamily: 'Inter',
        fontSize: 11,
        formatter: (val: string) => (val.length > 16 ? val.slice(0, 16) + '...' : val),
      },
    },
    series: [
      {
        name: '挂机/后台驻留时间',
        type: 'bar',
        barWidth: '14px',
        data: openValues,
        label: {
          show: true,
          position: 'right',
          color: '#475569',
          fontSize: 11,
          fontFamily: 'Inter',
          formatter: (params: any) => `${formatMs(params.value)}`,
        },
        itemStyle: {
          color: '#94A3B8',
          borderRadius: [0, 8, 8, 0],
        },
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

      {/* 全量网站使用时长对比拆分为两个横向展示柱状图 */}
      <div className='grid grid-cols-2 gap-6'>
        {/* 实际活跃时间对比 */}
        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
          <div className='flex items-center space-x-2 mb-4'>
            <Activity className='w-5 h-5 text-[#2563EB]' />
            <h3 className='text-sm font-bold text-slate-900'>实际活跃时间对比 (Top 10 网站)</h3>
          </div>
          <ReactECharts option={activeComparisonChartOption} style={{ height: '300px' }} />
        </div>

        {/* 挂机/后台驻留时间对比 */}
        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
          <div className='flex items-center space-x-2 mb-4'>
            <Clock className='w-5 h-5 text-[#64748B]' />
            <h3 className='text-sm font-bold text-slate-900'>
              挂机/后台驻留时间对比 (Top 10 网站)
            </h3>
          </div>
          <ReactECharts option={idleComparisonChartOption} style={{ height: '300px' }} />
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
