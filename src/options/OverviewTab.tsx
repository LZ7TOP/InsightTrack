import ReactECharts from 'echarts-for-react'
import { Activity, Clock, Zap, Globe } from 'lucide-react'
import { DomainStats } from '../storage/types'
import { formatMs, DomainAggregation } from './utils'
import FaviconImg from '../components/FaviconImg'

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
  domainMap,
  logs,
}: OverviewTabProps) {
  // 域名详细信息索引表
  const domainDetailsMap: Record<string, DomainStats> = {}
  domainStatsList.forEach((item) => {
    domainDetailsMap[item.domain] = item
  })

  // SVG 内联图标定义 (替代原表情符号)
  const globeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  const activityIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
  const clockIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
  const pauseIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>`
  const zapIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BC4800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`

  // 1. 实际活跃时间对比图数据 (横向条形图，按 activeTimeMs 降序)
  const sortedByActive = [...domainStatsList]
    .sort((a, b) => b.activeTimeMs - a.activeTimeMs)
    .slice(0, 10)
  const activeYLabels = sortedByActive.map(
    (d) => (domainMap && domainMap[d.domain] && domainMap[d.domain].title) || d.domain,
  )
  const activeValues = sortedByActive.map((d) => d.activeTimeMs)

  const activeComparisonChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0]
        const idx = p.dataIndex
        const item = sortedByActive[idx]
        const domain = item ? item.domain : p.name
        const title = (domainMap && domainMap[domain] && domainMap[domain].title) || domain
        const detail = domainDetailsMap[domain] ||
          item || {
            activeTimeMs: p.value,
            openTimeMs: p.value,
          }
        const activeMs = detail.activeTimeMs || 0
        const openMs = detail.openTimeMs || 0
        const idleMs = Math.max(0, openMs - activeMs)
        const rate = openMs > 0 ? Math.round((activeMs / openMs) * 100) : 0

        return `<div style="font-weight: bold; font-size: 13px; margin-bottom: 2px; color: #0F172A; display: flex; align-items: center; gap: 6px;">
          ${globeIcon} <span>${title}</span>
        </div>
        <div style="font-size: 11px; color: #64748B; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; font-family: monospace; padding-left: 20px;">
          ${domain}
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; min-width: 190px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #2563EB; font-weight: 600; display: flex; align-items: center; gap: 4px;">${activityIcon} 实际活跃时间</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(activeMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748B; font-weight: 600; display: flex; align-items: center; gap: 4px;">${clockIcon} 页面驻留总时长</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(openMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94A3B8; font-weight: 600; display: flex; align-items: center; gap: 4px;">${pauseIcon} 挂机/后台时长</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(idleMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px; padding-top: 4px; border-top: 1px dashed #E2E8F0;">
            <span style="color: #BC4800; font-weight: 600; display: flex; align-items: center; gap: 4px;">${zapIcon} 专注率</span>
            <b style="color: #BC4800; font-family: monospace;">${rate}%</b>
          </div>
        </div>`
      },
    },
    grid: { left: '3%', right: '28%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#64748B', formatter: (val: number) => `${Math.round(val / 60000)}分` },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    yAxis: {
      type: 'category',
      data: activeYLabels,
      inverse: true,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: {
        color: '#64748B',
        fontFamily: 'Inter',
        fontSize: 11,
        formatter: (val: string) => (val.length > 14 ? val.slice(0, 14) + '...' : val),
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
          formatter: (params: any) => {
            const item = sortedByActive[params.dataIndex]
            const domain = item ? item.domain : ''
            return `${domain} (${formatMs(params.value)})`
          },
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
  const openYLabels = sortedByOpen.map(
    (d) => (domainMap && domainMap[d.domain] && domainMap[d.domain].title) || d.domain,
  )
  const openValues = sortedByOpen.map((d) => d.openTimeMs)

  const idleComparisonChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0]
        const idx = p.dataIndex
        const item = sortedByOpen[idx]
        const domain = item ? item.domain : p.name
        const title = (domainMap && domainMap[domain] && domainMap[domain].title) || domain
        const detail = domainDetailsMap[domain] ||
          item || {
            activeTimeMs: p.value,
            openTimeMs: p.value,
          }
        const activeMs = detail.activeTimeMs || 0
        const openMs = detail.openTimeMs || 0
        const idleMs = Math.max(0, openMs - activeMs)
        const rate = openMs > 0 ? Math.round((activeMs / openMs) * 100) : 0

        return `<div style="font-weight: bold; font-size: 13px; margin-bottom: 2px; color: #0F172A; display: flex; align-items: center; gap: 6px;">
          ${globeIcon} <span>${title}</span>
        </div>
        <div style="font-size: 11px; color: #64748B; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; font-family: monospace; padding-left: 20px;">
          ${domain}
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; min-width: 190px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #2563EB; font-weight: 600; display: flex; align-items: center; gap: 4px;">${activityIcon} 实际活跃时间</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(activeMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748B; font-weight: 600; display: flex; align-items: center; gap: 4px;">${clockIcon} 页面驻留总时长</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(openMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94A3B8; font-weight: 600; display: flex; align-items: center; gap: 4px;">${pauseIcon} 挂机/后台时长</span>
            <b style="color: #0F172A; font-family: monospace;">${formatMs(idleMs)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px; padding-top: 4px; border-top: 1px dashed #E2E8F0;">
            <span style="color: #BC4800; font-weight: 600; display: flex; align-items: center; gap: 4px;">${zapIcon} 专注率</span>
            <b style="color: #BC4800; font-family: monospace;">${rate}%</b>
          </div>
        </div>`
      },
    },
    grid: { left: '3%', right: '28%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#64748B', formatter: (val: number) => `${Math.round(val / 60000)}分` },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    yAxis: {
      type: 'category',
      data: openYLabels,
      inverse: true,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: {
        color: '#64748B',
        fontFamily: 'Inter',
        fontSize: 11,
        formatter: (val: string) => (val.length > 14 ? val.slice(0, 14) + '...' : val),
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
          formatter: (params: any) => {
            const item = sortedByOpen[params.dataIndex]
            const domain = item ? item.domain : ''
            return `${domain} (${formatMs(params.value)})`
          },
        },
        itemStyle: {
          color: '#94A3B8',
          borderRadius: [0, 8, 8, 0],
        },
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

      {/* 网站使用明细列表 */}
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4'>
        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
          <div className='flex items-center space-x-2'>
            <Globe className='w-5 h-5 text-[#2563EB]' />
            <h3 className='text-sm font-bold text-slate-900'>网站使用明细列表</h3>
          </div>
          <span className='text-xs text-[#64748B] font-medium'>
            共 {domainStatsList.length} 个网站记录
          </span>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs border-collapse'>
            <thead>
              <tr className='border-b border-slate-200 text-[#64748B] font-semibold bg-slate-50/50'>
                <th className='py-3 px-4'>网站图标与名称</th>
                <th className='py-3 px-4'>网站域名</th>
                <th className='py-3 px-4'>实际活跃时间及对比占比</th>
                <th className='py-3 px-4'>总驻留时间及对比占比</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {domainStatsList.map((d) => {
                const title =
                  (domainMap && domainMap[d.domain] && domainMap[d.domain].title) || d.domain
                const activeRatio =
                  totalActiveMs > 0 ? ((d.activeTimeMs / totalActiveMs) * 100).toFixed(1) : '0.0'
                const openRatio =
                  totalOpenMs > 0 ? ((d.openTimeMs / totalOpenMs) * 100).toFixed(1) : '0.0'

                return (
                  <tr key={d.domain} className='hover:bg-slate-50/80 transition-colors'>
                    {/* 网站图标与名称 */}
                    <td className='py-3 px-4 font-medium text-slate-900'>
                      <div className='flex items-center space-x-2.5 max-w-[220px] truncate'>
                        <FaviconImg domain={d.domain} className='w-5 h-5 shrink-0' />
                        <span className='truncate font-semibold' title={title}>
                          {title}
                        </span>
                      </div>
                    </td>

                    {/* 网站域名 */}
                    <td className='py-3 px-4 font-mono text-[#64748B]'>{d.domain}</td>

                    {/* 实际活跃时间及对比占比 */}
                    <td className='py-3 px-4'>
                      <div className='flex items-center space-x-3'>
                        <span className='font-bold text-[#2563EB] font-mono min-w-[70px]'>
                          {formatMs(d.activeTimeMs)}
                        </span>
                        <div className='flex items-center space-x-1.5 flex-1 max-w-[120px]'>
                          <div className='w-full h-1.5 bg-slate-100 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-[#2563EB] rounded-full'
                              style={{ width: `${Math.min(100, Number(activeRatio))}%` }}
                            />
                          </div>
                          <span className='text-[11px] font-bold text-slate-600 font-mono w-10 text-right'>
                            {activeRatio}%
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 总驻留时间及对比占比 */}
                    <td className='py-3 px-4'>
                      <div className='flex items-center space-x-3'>
                        <span className='font-bold text-slate-700 font-mono min-w-[70px]'>
                          {formatMs(d.openTimeMs)}
                        </span>
                        <div className='flex items-center space-x-1.5 flex-1 max-w-[120px]'>
                          <div className='w-full h-1.5 bg-slate-100 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-slate-400 rounded-full'
                              style={{ width: `${Math.min(100, Number(openRatio))}%` }}
                            />
                          </div>
                          <span className='text-[11px] font-bold text-slate-500 font-mono w-10 text-right'>
                            {openRatio}%
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
