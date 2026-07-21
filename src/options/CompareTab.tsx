import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { LineChart, GitCompare } from 'lucide-react'
import { DomainStats } from '../storage/types'
import { CustomSelect, SelectOption } from '../components/CustomSelect'
import { formatMs, DomainAggregation } from './utils'

interface CompareTabProps {
  domainStatsList: DomainStats[]
  domainSelectOptions: SelectOption[]
  domainMap: Record<string, DomainAggregation>
  initialDomain: string
}

export default function CompareTab({
  domainStatsList,
  domainSelectOptions,
  domainMap,
  initialDomain,
}: CompareTabProps) {
  const [compareDomain, setCompareDomain] = useState(initialDomain)

  // 网站使用时间对比折线图
  const siteNames = domainStatsList.slice(0, 12).map((d) => d.domain)
  const siteActiveTimes = domainStatsList.slice(0, 12).map((d) => d.activeTimeMs)
  const siteOpenTimes = domainStatsList.slice(0, 12).map((d) => d.openTimeMs)

  const websiteComparisonChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let res = `<div style="font-weight: bold; margin-bottom: 4px; color: #1E293B;">网站: ${params[0].axisValue}</div>`
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
      data: ['实际活跃时间', '总驻留时间'],
      textStyle: { color: '#64748B', fontFamily: 'Inter' },
      top: '0%',
    },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
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
        name: '实际活跃时间',
        type: 'line',
        smooth: true,
        data: siteActiveTimes,
        itemStyle: { color: '#2563EB' },
        lineStyle: { width: 3 },
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.25)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.0)' },
            ],
          },
        },
      },
      {
        name: '总驻留时间',
        type: 'line',
        smooth: true,
        data: siteOpenTimes,
        itemStyle: { color: '#64748B' },
        lineStyle: { width: 2, type: 'dashed' },
        symbolSize: 6,
      },
    ],
  }

  return (
    <div className='space-y-6'>
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2'>
            <LineChart className='w-5 h-5 text-[#2563EB]' />
            <h3 className='text-base font-bold text-slate-900'>
              全量网站使用时长对比折线图 (横轴: 网站 / 纵轴: 时长)
            </h3>
          </div>
          <span className='text-xs text-[#64748B] font-medium'>
            直观比对各个网站使用时间的分布情况
          </span>
        </div>
        <ReactECharts option={websiteComparisonChartOption} style={{ height: '340px' }} />
      </div>

      <div className='bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <span className='text-xs font-bold text-[#64748B]'>对比单站点:</span>
          <CustomSelect
            options={domainSelectOptions}
            value={compareDomain}
            onChange={setCompareDomain}
            searchable
            icon={<GitCompare className='w-4 h-4' />}
            className='w-64'
          />
        </div>
      </div>

      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
        <h3 className='text-sm font-bold text-slate-900 mb-4'>
          【本周期 vs 历史记录】对比柱状图 ({compareDomain})
        </h3>
        <ReactECharts
          option={{
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            legend: {
              data: ['活跃时间', '驻留时间'],
              textStyle: { color: '#64748B', fontFamily: 'Inter' },
            },
            xAxis: {
              type: 'category',
              data: [compareDomain],
              axisLabel: { color: '#64748B' },
            },
            yAxis: { type: 'value', axisLabel: { color: '#64748B' } },
            series: [
              {
                name: '活跃时间',
                type: 'bar',
                data: [domainMap[compareDomain]?.active || 0],
                itemStyle: { color: '#2563EB' },
              },
              {
                name: '驻留时间',
                type: 'bar',
                data: [domainMap[compareDomain]?.open || 0],
                itemStyle: { color: '#64748B' },
              },
            ],
          }}
          style={{ height: '300px' }}
        />
      </div>
    </div>
  )
}
