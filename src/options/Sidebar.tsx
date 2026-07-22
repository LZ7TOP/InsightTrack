import {
  Clock,
  BarChart3,
  GitCompare,
  Settings,
  Layers,
  List,
} from 'lucide-react'
import { TabType } from './utils'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems: { key: TabType; label: string; icon: typeof Clock }[] = [
    { key: 'overview', label: '概览分析', icon: BarChart3 },
    { key: 'site_list', label: '网站明细', icon: List },
    { key: 'site_detail', label: '单站下钻', icon: Layers },
    { key: 'compare', label: '跨段比对', icon: GitCompare },
    { key: 'settings', label: '偏好设置', icon: Settings },
  ]

  return (
    <aside className='w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between select-none shadow-sm'>
      <div>
        <div className='flex items-center space-x-3 mb-8'>
          <img src='/logo.svg' alt='InsightTrack Logo' className='w-9 h-9 object-contain drop-shadow-sm' />
          <div>
            <h1 className='font-bold text-base tracking-tight text-slate-900'>
              InsightTrack
            </h1>
            <p className='text-[11px] font-semibold text-[#64748B]'>
              时间与注意力分析
            </p>
          </div>
        </div>

        <nav className='space-y-1.5'>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === item.key
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                    : 'text-[#64748B] hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className='w-4 h-4' />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className='pt-4 border-t border-slate-200 text-[11px] font-semibold text-[#64748B] text-center flex flex-col items-center space-y-2'>
        <div className='text-slate-400'>InsightTrack v1.0.0</div>
        <a
          href='https://github.com/LZ7TOP'
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-700 font-bold transition-all border border-slate-200 group'
          title='访问 LZ7工作室 GitHub (https://github.com/LZ7TOP)'
        >
          <img src='/logo_black.png' alt='LZ7工作室' className='w-4 h-4 object-contain rounded-sm' />
          <span className='group-hover:text-[#2563EB] transition-colors'>LZ7工作室</span>
          <svg className='w-3.5 h-3.5 fill-slate-700 group-hover:fill-[#2563EB] transition-colors' viewBox='0 0 24 24'>
            <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' />
          </svg>
        </a>
      </div>
    </aside>
  )
}
