import { useState } from 'react'
import {
  Clock,
  BarChart3,
  GitCompare,
  Settings,
  Layers,
  List,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react'
import { TabType } from './utils'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 常规核心功能菜单（置顶）
  const mainNavItems: { key: TabType; label: string; icon: typeof Clock }[] = [
    { key: 'overview', label: '概览分析', icon: BarChart3 },
    { key: 'site_list', label: '网站明细', icon: List },
    { key: 'site_detail', label: '单站下钻', icon: Layers },
    { key: 'compare', label: '跨段比对', icon: GitCompare },
    { key: 'settings', label: '偏好设置', icon: Settings },
  ]

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20 p-4' : 'w-64 p-6'
      } bg-white border-r border-slate-200 flex flex-col justify-between select-none shadow-sm transition-all duration-300 relative shrink-0`}
    >
      <div>
        {/* 顶部 Header & 收起/展开折叠按钮 */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col space-y-3' : 'justify-between'} mb-8`}>
          <div className='flex items-center space-x-3 truncate'>
            <img src='/logo.svg' alt='InsightTrack Logo' className='w-9 h-9 object-contain drop-shadow-sm shrink-0' />
            {!isCollapsed && (
              <div className='truncate animate-in fade-in duration-200'>
                <h1 className='font-bold text-base tracking-tight text-slate-900 truncate'>
                  InsightTrack
                </h1>
                <p className='text-[11px] font-semibold text-[#64748B] truncate'>
                  时间与注意力分析
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors'
            title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {isCollapsed ? <ChevronRight className='w-4 h-4' /> : <ChevronLeft className='w-4 h-4' />}
          </button>
        </div>

        {/* 顶部常规功能导航菜单 */}
        <nav className='space-y-1.5'>
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                title={isCollapsed ? item.label : ''}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3.5'
                } py-2.5 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                    : 'text-[#64748B] hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className='w-4 h-4 shrink-0' />
                {!isCollapsed && <span className='truncate animate-in fade-in duration-150'>{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 底部独立区域：项目介绍菜单与工作室信息 */}
      <div className='pt-4 border-t border-slate-200 space-y-3 shrink-0'>
        {/* 独立底部的 项目介绍 菜单项 */}
        <button
          onClick={() => onTabChange('about')}
          title={isCollapsed ? '项目介绍' : ''}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3.5'
          } py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'about'
              ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
              : 'text-[#64748B] hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Info className='w-4 h-4 shrink-0' />
          {!isCollapsed && <span className='truncate animate-in fade-in duration-150'>项目介绍</span>}
        </button>

        {/* LZ7工作室 版权信息 */}
        <div className='text-[11px] font-semibold text-[#64748B] text-center flex flex-col items-center space-y-2 pt-1'>
          {!isCollapsed ? (
            <>
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
              </a>
            </>
          ) : (
            <a
              href='https://github.com/LZ7TOP'
              target='_blank'
              rel='noreferrer'
              className='p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200'
              title='LZ7工作室 (https://github.com/LZ7TOP)'
            >
              <img src='/logo_black.png' alt='LZ7工作室' className='w-4 h-4 object-contain rounded-sm' />
            </a>
          )}
        </div>
      </div>
    </aside>
  )
}
