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
    { key: 'site_list', label: '网站列表明细', icon: List },
    { key: 'site_detail', label: '单站点深度下钻', icon: Layers },
    { key: 'compare', label: '历史跨段比对', icon: GitCompare },
    { key: 'settings', label: '偏好与设置', icon: Settings },
  ]

  return (
    <aside className='w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between select-none shadow-sm'>
      <div>
        <div className='flex items-center space-x-3 mb-8'>
          <div className='w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-md shadow-blue-500/20'>
            <Clock className='w-5 h-5 text-white' />
          </div>
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

      <div className='pt-4 border-t border-slate-200 text-[11px] font-semibold text-[#64748B] text-center space-y-1'>
        <div>InsightTrack v1.0.0</div>
        <div>
          Made by{' '}
          <a
            href='https://github.com/LZ7TOP'
            target='_blank'
            rel='noreferrer'
            className='text-slate-500 hover:text-[#2563EB] transition-colors font-bold underline decoration-slate-300 underline-offset-2'
          >
            LZ7 Studio
          </a>
        </div>
      </div>
    </aside>
  )
}
