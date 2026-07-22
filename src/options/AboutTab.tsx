import {
  Sparkles,
  ShieldCheck,
  Zap,
  BarChart3,
  Target,
  Code2,
  ExternalLink,
  Layers,
  CheckCircle2,
} from 'lucide-react'

export default function AboutTab() {
  return (
    <div className='space-y-6 animate-in fade-in duration-200 select-none text-slate-800 pb-4'>
      {/* 顶部 Header 品牌卡片 (参照 README 简约纯净设计) */}
      <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6'>
        <div className='flex items-center space-x-5'>
          <img
            src='/logo.svg'
            alt='InsightTrack Logo'
            className='w-16 h-16 object-contain drop-shadow-sm shrink-0'
          />
          <div>
            <div className='flex items-center space-x-3'>
              <h1 className='text-2xl font-extrabold text-slate-900 tracking-tight'>
                InsightTrack
              </h1>
              <span className='px-2.5 py-0.5 bg-blue-50 text-[#2563EB] border border-blue-200 rounded-full text-xs font-bold'>
                v1.0.0
              </span>
              <span className='px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold'>
                Manifest V3
              </span>
            </div>
            <p className='text-xs font-semibold text-slate-500 mt-1.5'>
              精准网页注意力与时间分析浏览器扩展 · 区分页面驻留与实际活跃时间
            </p>
          </div>
        </div>

        <a
          href='https://github.com/LZ7TOP'
          target='_blank'
          rel='noreferrer'
          className='px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2 shrink-0'
        >
          <img
            src='/logo_black.png'
            alt='LZ7工作室'
            className='w-4 h-4 object-contain rounded-sm invert'
          />
          <span>LZ7工作室 GitHub</span>
          <ExternalLink className='w-3.5 h-3.5 text-slate-400' />
        </a>
      </div>

      {/* ✨ 项目简介与隐私承诺 */}
      <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3'>
        <div className='flex items-center space-x-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3'>
          <Sparkles className='w-4 h-4 text-[#2563EB]' />
          <span>项目简介</span>
        </div>
        <p className='text-xs text-slate-600 leading-relaxed'>
          <strong>InsightTrack</strong> 是一款由 <strong>LZ7工作室</strong> 开发并开源的现代
          Chromium 浏览器扩展，致力于帮助用户量化、分析和提升自己的网页浏览与时间利用效率。
          不同于传统浏览器历史记录只记录「访问了什么」，InsightTrack 能精准区分
          <strong>实际活跃时间</strong>（鼠标移动、键盘输入、滚动页面等真实交互）与
          <strong>页面驻留时间</strong>（标签页挂机与后台总时长）。
        </p>

        <div className='mt-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-emerald-900'>
          <ShieldCheck className='w-4 h-4 text-emerald-600 shrink-0 mt-0.5' />
          <div className='leading-relaxed font-medium'>
            <strong>隐私承诺</strong>：所有切页流水日志与访问数据完全存储在浏览器本地 IndexedDB
            数据库中，<strong>绝对不会上传任何第三方服务器</strong>，无需注册登录，隐私安全无忧。
          </div>
        </div>
      </div>

      {/* 🚀 核心特性板块 (卡片阵列) */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* 智能双维度时间追踪 */}
        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3'>
          <div className='flex items-center space-x-2 text-slate-900 font-bold text-sm'>
            <Zap className='w-4 h-4 text-[#2563EB]' />
            <span>智能双维度时间追踪</span>
          </div>
          <ul className='text-xs text-slate-600 space-y-2 leading-relaxed'>
            <li className='flex items-start space-x-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5' />
              <span>
                <strong>前后台智能识别</strong>：毫秒级区分前台焦点交互与后台挂机。
              </span>
            </li>
            <li className='flex items-start space-x-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5' />
              <span>
                <strong>无操作空闲检测</strong>：开启后超时（30s~10min）自动暂停活跃计时。
              </span>
            </li>
            <li className='flex items-start space-x-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5' />
              <span>
                <strong>子域名规范归并</strong>：智能清洗前缀并支持同域收纳。
              </span>
            </li>
          </ul>
        </div>

        {/* 全维度数据可视化 */}
        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3'>
          <div className='flex items-center space-x-2 text-slate-900 font-bold text-sm'>
            <BarChart3 className='w-4 h-4 text-indigo-600' />
            <span>全维度可视化仪表盘</span>
          </div>
          <ul className='text-xs text-slate-600 space-y-2 leading-relaxed'>
            <li className='flex items-start space-x-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5' />
              <span>
                <strong>双色嵌套胶囊柱状图</strong>：单柱直观呈现活跃与驻留时间。
              </span>
            </li>
            <li className='flex items-start space-x-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5' />
              <span>
                <strong>起伏趋势与24h分布</strong>：按日起伏折线与时段热力分布。
              </span>
            </li>
            <li className='flex items-start space-x-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5' />
              <span>
                <strong>明细表与下钻流水</strong>：多维排序与切页时间戳全量溯源。
              </span>
            </li>
          </ul>
        </div>

        {/* 偏好设置与数据安全 */}
        <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3'>
          <div className='flex items-center space-x-2 text-slate-900 font-bold text-sm'>
            <Target className='w-4 h-4 text-emerald-600' />
            <span>偏好设置与数据安全</span>
          </div>
          <ul className='text-xs text-slate-600 space-y-2 leading-relaxed'>
            <li className='flex items-start space-x-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5' />
              <span>
                <strong>注意力目标与提醒</strong>：每日活跃目标达标弹窗提醒。
              </span>
            </li>
            <li className='flex items-start space-x-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5' />
              <span>
                <strong>隐私黑名单管理</strong>：排除本地开发与敏感站点。
              </span>
            </li>
            <li className='flex items-start space-x-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5' />
              <span>
                <strong>备份导出与清理</strong>：JSON 导入导出与历史按需清除。
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 🎨 极致 UI 与组件封装 */}
      <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4'>
        <div className='flex items-center space-x-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3'>
          <Layers className='w-4 h-4 text-[#2563EB]' />
          <span>极致 UI 与封装组件</span>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-xs'>
          <div className='p-3 bg-slate-50 rounded-xl border border-slate-200/80'>
            <div className='font-bold text-slate-900 mb-1'>TooltipText 智能文本提示框</div>
            <div className='text-slate-500 leading-relaxed'>
              使用 React Portal 挂载至 document.body，配合 scrollWidth
              自动判定文本截断状态，无缝解决表格 overflow 裁剪问题。
            </div>
          </div>
          <div className='p-3 bg-slate-50 rounded-xl border border-slate-200/80'>
            <div className='font-bold text-slate-900 mb-1'>ConfirmModal 现代毛玻璃弹窗</div>
            <div className='text-slate-500 leading-relaxed'>
              全面替代浏览器原生 window.confirm 与 alert 弹窗，提供语义化操作指示与防误触二次校验。
            </div>
          </div>
          <div className='p-3 bg-slate-50 rounded-xl border border-slate-200/80'>
            <div className='font-bold text-slate-900 mb-1'>FaviconImg 多源 Fallback 图标</div>
            <div className='text-slate-500 leading-relaxed'>
              依次尝试网站自带 favicon -&gt; DuckDuckGo API -&gt; Google API -&gt;
              默认兜底图标，保障国内网络加载通畅。
            </div>
          </div>
          <div className='p-3 bg-slate-50 rounded-xl border border-slate-200/80'>
            <div className='font-bold text-slate-900 mb-1'>DateRangePicker 时间下拉选择器</div>
            <div className='text-slate-500 leading-relaxed'>
              集成预设快捷选择与自定义日期区间弹窗，自动识别同一天（00:00:00 -
              23:59:59）全天流水匹配。
            </div>
          </div>
        </div>
      </div>

      {/* 🛠️ 技术栈与版本表格 */}
      <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4'>
        <div className='flex items-center space-x-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3'>
          <Code2 className='w-4 h-4 text-[#2563EB]' />
          <span>技术栈与架构规范</span>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-xs'>
          <div className='p-3 bg-slate-50 rounded-xl text-center border border-slate-200/60'>
            <div className='text-slate-400 font-semibold mb-1'>扩展规范</div>
            <div className='font-bold text-slate-800'>Chrome Manifest V3</div>
          </div>
          <div className='p-3 bg-slate-50 rounded-xl text-center border border-slate-200/60'>
            <div className='text-slate-400 font-semibold mb-1'>前端框架</div>
            <div className='font-bold text-slate-800'>React 18 + TypeScript</div>
          </div>
          <div className='p-3 bg-slate-50 rounded-xl text-center border border-slate-200/60'>
            <div className='text-slate-400 font-semibold mb-1'>样式系统</div>
            <div className='font-bold text-slate-800'>TailwindCSS</div>
          </div>
          <div className='p-3 bg-slate-50 rounded-xl text-center border border-slate-200/60'>
            <div className='text-slate-400 font-semibold mb-1'>图表引擎</div>
            <div className='font-bold text-slate-800'>Apache ECharts 5</div>
          </div>
        </div>
      </div>
    </div>
  )
}
