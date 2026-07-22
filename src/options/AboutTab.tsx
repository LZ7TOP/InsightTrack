import { Zap, BarChart3, Lock, Target, Code, Heart, ExternalLink } from 'lucide-react'

export default function AboutTab() {
  return (
    <div className='space-y-6 animate-in fade-in duration-200 select-none'>
      {/* Hero 品牌头部卡片 */}
      <div className='bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden'>
        {/* 背景饰纹 */}
        <div className='absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none' />
        <div className='relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6'>
          <div className='flex items-center space-x-5'>
            <div className='p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner'>
              <img src='/logo.svg' alt='InsightTrack Logo' className='w-14 h-14 object-contain drop-shadow-md' />
            </div>
            <div>
              <div className='flex items-center space-x-3'>
                <h1 className='text-3xl font-extrabold tracking-tight'>InsightTrack</h1>
                <span className='px-2.5 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-bold text-white'>
                  v1.0.0
                </span>
              </div>
              <p className='text-blue-100 text-sm font-medium mt-1'>
                浏览器网页时间与注意力专注度深度分析扩展
              </p>
            </div>
          </div>

          <a
            href='https://github.com/LZ7TOP'
            target='_blank'
            rel='noreferrer'
            className='px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 shrink-0'
          >
            <Heart className='w-4 h-4 text-red-500 fill-red-500' />
            <span>LZ7工作室 GitHub</span>
            <ExternalLink className='w-3.5 h-3.5' />
          </a>
        </div>
      </div>

      {/* 核心亮点网格 */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3 hover:border-blue-200 transition-all'>
          <div className='w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#2563EB] mb-2'>
            <Zap className='w-5 h-5' />
          </div>
          <h3 className='text-base font-bold text-slate-900'>智能前后台与空闲检测</h3>
          <p className='text-xs text-slate-600 leading-relaxed'>
            精准区分浏览器窗口前台焦点与后台挂机，算法毫秒级无感计算。支持可选开启无操作空闲检测，防止挂机时间误算。
          </p>
        </div>

        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3 hover:border-blue-200 transition-all'>
          <div className='w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-2'>
            <BarChart3 className='w-5 h-5' />
          </div>
          <h3 className='text-base font-bold text-slate-900'>全维度多图表可视化看板</h3>
          <p className='text-xs text-slate-600 leading-relaxed'>
            内置双色嵌套胶囊对比图、每日时间起伏趋势图、24 小时活跃时段分布图与 Top 10 域名占比饼图，洞察时间去向。
          </p>
        </div>

        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3 hover:border-blue-200 transition-all'>
          <div className='w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-2'>
            <Lock className='w-5 h-5' />
          </div>
          <h3 className='text-base font-bold text-slate-900'>100% 本地存储与隐私保护</h3>
          <p className='text-xs text-slate-600 leading-relaxed'>
            所有访问日志与统计数据均严格存储在浏览器本地 IndexedDB 数据库中，零服务端依赖，不上传任何隐私数据。
          </p>
        </div>

        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3 hover:border-blue-200 transition-all'>
          <div className='w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-2'>
            <Target className='w-5 h-5' />
          </div>
          <h3 className='text-base font-bold text-slate-900'>健康提醒与专注度掌控</h3>
          <p className='text-xs text-slate-600 leading-relaxed'>
            支持自定义每日专注时间目标，达标自动发送桌面通知提醒；支持域名黑名单过滤与子域名归并等灵活设置。
          </p>
        </div>
      </div>

      {/* 技术栈与团队卡片 */}
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6'>
        <div className='space-y-1.5'>
          <div className='flex items-center space-x-2 text-slate-900 font-bold text-sm'>
            <Code className='w-4 h-4 text-[#2563EB]' />
            <span>技术架构与构建规范</span>
          </div>
          <p className='text-xs text-slate-500'>
            基于 Chrome Extension Manifest V3 规范，采用 React 18、TypeScript、TailwindCSS 与 ECharts5 构建。
          </p>
        </div>

        <div className='flex items-center space-x-3 shrink-0'>
          <img src='/logo_black.png' alt='LZ7工作室' className='w-8 h-8 object-contain rounded-lg border border-slate-200 p-1 bg-slate-50' />
          <div className='text-left'>
            <div className='text-xs font-bold text-slate-900'>LZ7工作室</div>
            <div className='text-[11px] text-slate-400 font-medium'>Crafted with Excellence</div>
          </div>
        </div>
      </div>
    </div>
  )
}
