import { useState } from 'react'
import { Search, ArrowUpDown, ExternalLink } from 'lucide-react'
import { CustomSelect, SelectOption } from '../components/CustomSelect'
import FaviconImg from '../components/FaviconImg'
import TooltipText from '../components/TooltipText'
import { SiteListItem, formatMs } from './utils'

interface SiteListTabProps {
  siteList: SiteListItem[]
  onJumpToDetail: (domain: string) => void
}

const sortOptions: SelectOption[] = [
  { value: 'active', label: '按实际活跃时间' },
  { value: 'open', label: '按总驻留时间' },
  { value: 'visits', label: '按访问/切换次数' },
  { value: 'focus', label: '按专注率' },
]

export default function SiteListTab({ siteList, onJumpToDetail }: SiteListTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'active' | 'open' | 'visits' | 'focus'>('active')

  const filteredSiteList = siteList
    .filter(
      (item) =>
        item.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === 'active') return b.activeTimeMs - a.activeTimeMs
      if (sortBy === 'open') return b.openTimeMs - a.openTimeMs
      if (sortBy === 'visits') return b.visits - a.visits
      if (sortBy === 'focus') return b.focusRate - a.focusRate
      return 0
    })

  return (
    <div className='space-y-6'>
      {/* 搜索与排序工具栏 */}
      <div className='bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4'>
        <div className='flex-1 relative'>
          <Search className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
          <input
            type='text'
            placeholder='搜索网站名称或域名 (如: douyin.com)...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2563EB]'
          />
        </div>
        <div className='flex items-center space-x-2'>
          <span className='text-xs font-bold text-[#64748B]'>排序规则:</span>
          <CustomSelect
            options={sortOptions}
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            icon={<ArrowUpDown className='w-3.5 h-3.5' />}
            className='w-44'
          />
        </div>
      </div>

      {/* 网站列表表格 */}
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-sm font-bold text-slate-900'>
            完整网站访问明细 (共 {filteredSiteList.length} 个网站)
          </h3>
          <span className='text-xs text-[#64748B] font-medium'>
            标题与域名超出时，悬停即可弹出查看完整文本
          </span>
        </div>

        {filteredSiteList.length === 0 ? (
          <div className='text-center py-12 text-slate-400 text-xs font-medium'>
            暂无匹配的网站数据
          </div>
        ) : (
          <div className='overflow-x-auto max-h-[600px] overflow-y-auto rounded-xl border border-slate-200 relative'>
            <table className='w-full text-left text-xs border-collapse'>
              <thead className='bg-slate-50 text-[#64748B] font-bold sticky top-0 z-20 shadow-sm'>
                <tr>
                  <th className='p-3.5 sticky left-0 z-30 bg-slate-50 min-w-[220px] border-b border-r border-slate-200'>
                    网站图标与名称 (固定列)
                  </th>
                  <th className='p-3.5 border-b border-slate-200'>网站域名</th>
                  <th className='p-3.5 border-b border-slate-200'>访问/切换次数</th>
                  <th className='p-3.5 border-b border-slate-200'>实际活跃时间</th>
                  <th className='p-3.5 border-b border-slate-200'>总驻留时间</th>
                  <th className='p-3.5 border-b border-slate-200'>专注率</th>
                  <th className='p-3.5 border-b border-slate-200 text-center'>快捷操作</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {filteredSiteList.map((site) => (
                  <tr key={site.domain} className='group hover:bg-slate-50 transition-colors'>
                    {/* 标题列固定在最左侧 */}
                    <td className='p-3.5 font-semibold text-slate-800 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 min-w-[220px] shadow-sm'>
                      <div className='flex items-center space-x-3'>
                        <FaviconImg domain={site.domain} />
                        <TooltipText
                          text={site.title}
                          maxWidthClass='max-w-[170px]'
                          className='font-bold text-slate-900'
                        />
                      </div>
                    </td>
                    <td className='p-3.5 text-[#64748B]'>
                      <span className='px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-mono text-[11px] inline-block max-w-[200px]'>
                        <TooltipText text={site.domain} maxWidthClass='max-w-[180px]' asMonospace />
                      </span>
                    </td>
                    <td className='p-3.5 font-bold text-slate-700 whitespace-nowrap'>
                      {site.visits} 次 ({site.urlCount} 个页面)
                    </td>
                    <td className='p-3.5 font-bold text-[#2563EB] whitespace-nowrap'>
                      {formatMs(site.activeTimeMs)}
                    </td>
                    <td className='p-3.5 text-[#64748B] font-medium whitespace-nowrap'>
                      {formatMs(site.openTimeMs)}
                    </td>
                    <td className='p-3.5 whitespace-nowrap'>
                      <div className='flex items-center space-x-2'>
                        <div className='w-16 bg-slate-100 h-2 rounded-full overflow-hidden'>
                          <div
                            className='bg-[#2563EB] h-full rounded-full'
                            style={{ width: `${site.focusRate}%` }}
                          ></div>
                        </div>
                        <span className='font-bold text-xs text-slate-700'>{site.focusRate}%</span>
                      </div>
                    </td>
                    <td className='p-3.5 text-center whitespace-nowrap'>
                      <button
                        onClick={() => onJumpToDetail(site.domain)}
                        className='px-3 py-1.5 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-[#2563EB]/30 rounded-xl font-bold text-[11px] inline-flex items-center space-x-1 transition-all'
                      >
                        <span>深度下钻</span>
                        <ExternalLink className='w-3 h-3' />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
