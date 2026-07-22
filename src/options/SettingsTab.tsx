import { useRef, useState } from 'react'
import {
  Download,
  Upload,
  Trash2,
  CalendarX,
  Plus,
  Shield,
  Sliders,
  Bell,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { AppSettings, PageVisitRecord } from '../storage/types'
import {
  saveSettings,
  clearAllLogs,
  clearLogsOlderThan,
  importVisitLogs,
  getLocalDateStr,
  cleanDomain,
} from '../storage/db'
import { CustomSelect, SelectOption } from '../components/CustomSelect'
import ConfirmModal from '../components/ConfirmModal'

interface SettingsTabProps {
  settings: AppSettings
  logs: PageVisitRecord[]
  onSettingsChange: (settings: AppSettings) => void
  onDataChange: () => Promise<void>
  onFlashMessage: (msg: string) => void
}

const idleOptions: SelectOption[] = [
  { value: '30', label: '30 秒无操作判断空闲' },
  { value: '60', label: '1 分钟无操作判断空闲' },
  { value: '180', label: '3 分钟无操作判断空闲' },
  { value: '300', label: '5 分钟无操作判断空闲' },
  { value: '600', label: '10 分钟无操作判断空闲' },
]

const goalOptions: SelectOption[] = [
  { value: '2', label: '每日 2 小时' },
  { value: '4', label: '每日 4 小时' },
  { value: '6', label: '每日 6 小时' },
  { value: '8', label: '每日 8 小时' },
]

const refreshIntervalOptions: SelectOption[] = [
  { value: '3', label: '每 3 秒自动刷新' },
  { value: '5', label: '每 5 秒自动刷新' },
  { value: '10', label: '每 10 秒自动刷新' },
  { value: '30', label: '每 30 秒自动刷新' },
]

export default function SettingsTab({
  settings,
  logs,
  onSettingsChange,
  onDataChange,
  onFlashMessage,
}: SettingsTabProps) {
  const [newBlacklistItem, setNewBlacklistItem] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 优美的自定义确认弹窗 State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'danger' | 'warning' | 'info'
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {},
  })

  function closeModal() {
    setModalConfig((prev) => ({ ...prev, isOpen: false }))
  }

  async function updateField<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    await saveSettings(newSettings)
    onFlashMessage('设置已自动保存')
  }

  async function handleAddBlacklist() {
    if (!newBlacklistItem.trim()) return
    const clean = cleanDomain(newBlacklistItem.trim())
    if (!settings.blacklist.includes(clean)) {
      const newB = [...settings.blacklist, clean]
      await updateField('blacklist', newB)
      setNewBlacklistItem('')
    }
  }

  async function handleAddDevPresetBlacklist() {
    const devDomains = ['localhost', '127.0.0.1', '*.local', '*.test']
    const newB = Array.from(new Set([...settings.blacklist, ...devDomains]))
    await updateField('blacklist', newB)
    onFlashMessage('已导入常用开发环境黑名单预设')
  }

  async function handleRemoveBlacklist(item: string) {
    const newB = settings.blacklist.filter((b) => cleanDomain(b) !== cleanDomain(item))
    await updateField('blacklist', newB)
  }

  function handleExportData() {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `insighttrack_backup_${getLocalDateStr()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const json = JSON.parse(content)
        if (Array.isArray(json)) {
          const count = await importVisitLogs(json)
          onFlashMessage(`成功导入 ${count} 条备份历史记录！`)
          await onDataChange()
        } else {
          setModalConfig({
            isOpen: true,
            title: '格式错误',
            message: '备份文件格式不符合要求，请导入标准的 JSON 数组备份文件。',
            type: 'warning',
            confirmText: '我知道了',
            cancelText: '',
            onConfirm: closeModal,
          })
        }
      } catch {
        setModalConfig({
          isOpen: true,
          title: '解析失败',
          message: '解析备份 JSON 文件失败，请检查文件编码与格式。',
          type: 'danger',
          confirmText: '我知道了',
          cancelText: '',
          onConfirm: closeModal,
        })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleClearOldLogs() {
    setModalConfig({
      isOpen: true,
      title: '清理旧历史记录',
      message: '确定清理 30 天前的旧历史记录吗？清理后旧记录将不可恢复。',
      type: 'warning',
      confirmText: '确定清理',
      cancelText: '取消',
      onConfirm: async () => {
        closeModal()
        const removed = await clearLogsOlderThan(30)
        onFlashMessage(`成功清理 ${removed} 条旧浏览记录`)
        await onDataChange()
      },
    })
  }

  function handleClearLogs() {
    setModalConfig({
      isOpen: true,
      title: '清空所有历史数据',
      message: '确认要清空所有历史浏览记录吗？此操作无法撤销。',
      type: 'danger',
      confirmText: '确认清空',
      cancelText: '取消',
      onConfirm: async () => {
        closeModal()
        await clearAllLogs()
        await onDataChange()
        onFlashMessage('已成功清空所有历史数据')
      },
    })
  }

  return (
    <div className='space-y-6 w-full'>
      {/* 全局优美的确认/提示弹窗 */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />

      {/* 隐藏的导入备份文件 input */}
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept='.json'
        className='hidden'
      />

      {/* 1. 追踪与注意力算法设置 */}
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5'>
        <h3 className='text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3'>
          <Sliders className='w-4 h-4 text-[#2563EB]' />
          <span>追踪算法与行为策略</span>
        </h3>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <span className='text-xs font-bold text-slate-800 block'>启用无操作判断空闲检测</span>
              <span className='text-[11px] text-[#64748B] block mt-0.5'>
                默认关闭（在前台聚焦窗口即算活跃）；开启后无键盘鼠标操作超过设定阈值将自动暂停统计
              </span>
            </div>
            <button
              onClick={() => updateField('enableIdleDetection', !settings.enableIdleDetection)}
              className='hover:opacity-80 transition-opacity'
            >
              {settings.enableIdleDetection ? (
                <ToggleRight className='w-8 h-8 text-[#2563EB]' />
              ) : (
                <ToggleLeft className='w-8 h-8 text-slate-300' />
              )}
            </button>
          </div>

          {settings.enableIdleDetection && (
            <div className='flex items-center justify-between border-t border-slate-100 pt-3'>
              <div>
                <span className='text-xs font-bold text-slate-800 block'>
                  无操作判断空闲的超时阈值
                </span>
                <span className='text-[11px] text-[#64748B] block mt-0.5'>
                  在此时间内若检测不到鼠标或键盘交互，系统将自动暂停活跃时间的累加
                </span>
              </div>
              <CustomSelect
                options={idleOptions}
                value={String(settings.idleThresholdSeconds)}
                onChange={(val) => updateField('idleThresholdSeconds', Number(val))}
                className='w-56'
              />
            </div>
          )}

          <div className='flex items-center justify-between border-t border-slate-100 pt-3'>
            <div>
              <span className='text-xs font-bold text-slate-800 block'>
                在浏览器图标上实时显示角标时间
              </span>
              <span className='text-[11px] text-[#64748B] block mt-0.5'>
                在工具栏扩展图标角标上实时展示当前网页今日活跃使用时长（如: 15s / 42m）
              </span>
            </div>
            <button
              onClick={() => updateField('showBadge', !settings.showBadge)}
              className='hover:opacity-80 transition-opacity'
            >
              {settings.showBadge ? (
                <ToggleRight className='w-8 h-8 text-[#2563EB]' />
              ) : (
                <ToggleLeft className='w-8 h-8 text-slate-300' />
              )}
            </button>
          </div>

          <div className='flex items-center justify-between border-t border-slate-100 pt-3'>
            <div>
              <span className='text-xs font-bold text-slate-800 block'>
                自动归并二级与多级子域名
              </span>
              <span className='text-[11px] text-[#64748B] block mt-0.5'>
                如将 blog.github.com 自动无缝归并到 github.com 主域名下统一统计
              </span>
            </div>
            <button
              onClick={() => updateField('mergeSubdomains', !settings.mergeSubdomains)}
              className='text-[#2563EB] hover:opacity-80 transition-opacity'
            >
              {settings.mergeSubdomains ? (
                <ToggleRight className='w-8 h-8 text-[#2563EB]' />
              ) : (
                <ToggleLeft className='w-8 h-8 text-slate-300' />
              )}
            </button>
          </div>

          <div className='flex items-center justify-between border-t border-slate-100 pt-3'>
            <div>
              <span className='text-xs font-bold text-slate-800 block'>开启界面数据自动刷新</span>
              <span className='text-[11px] text-[#64748B] block mt-0.5'>
                后台自动定时把未落盘的内存时间落盘并无缝刷新视图中的统计数据
              </span>
            </div>
            <button
              onClick={() => updateField('autoRefresh', !settings.autoRefresh)}
              className='hover:opacity-80 transition-opacity'
            >
              {settings.autoRefresh ? (
                <ToggleRight className='w-8 h-8 text-[#2563EB]' />
              ) : (
                <ToggleLeft className='w-8 h-8 text-slate-300' />
              )}
            </button>
          </div>

          {settings.autoRefresh && (
            <div className='flex items-center justify-between border-t border-slate-100 pt-3'>
              <div>
                <span className='text-xs font-bold text-slate-800 block'>自动刷新间隔频率</span>
                <span className='text-[11px] text-[#64748B] block mt-0.5'>
                  设置仪表盘与弹窗视图定时轮询刷新的时间间隔
                </span>
              </div>
              <CustomSelect
                options={refreshIntervalOptions}
                value={String(settings.autoRefreshIntervalSeconds || 5)}
                onChange={(val) => updateField('autoRefreshIntervalSeconds', Number(val))}
                className='w-44'
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. 注意力目标与防沉迷提醒 */}
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5'>
        <h3 className='text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3'>
          <Bell className='w-4 h-4 text-[#BC4800]' />
          <span>注意力目标与健康提醒</span>
        </h3>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <span className='text-xs font-bold text-slate-800 block'>
                启用注意力目标与健康提醒
              </span>
              <span className='text-[11px] text-[#64748B] block mt-0.5'>
                默认关闭；开启后可配置单日活跃时长预算目标与超出提醒
              </span>
            </div>
            <button
              onClick={() => updateField('enableDailyGoal', !settings.enableDailyGoal)}
              className='hover:opacity-80 transition-opacity'
            >
              {settings.enableDailyGoal ? (
                <ToggleRight className='w-8 h-8 text-[#2563EB]' />
              ) : (
                <ToggleLeft className='w-8 h-8 text-slate-300' />
              )}
            </button>
          </div>

          {settings.enableDailyGoal && (
            <>
              <div className='flex items-center justify-between border-t border-slate-100 pt-3'>
                <div>
                  <span className='text-xs font-bold text-slate-800 block'>
                    每日活跃时间目标上限
                  </span>
                  <span className='text-[11px] text-[#64748B] block mt-0.5'>
                    设置单日使用浏览器的健康活跃时长预算目标
                  </span>
                </div>
                <CustomSelect
                  options={goalOptions}
                  value={String(settings.dailyGoalHours)}
                  onChange={(val) => updateField('dailyGoalHours', Number(val))}
                  className='w-44'
                />
              </div>

              <div className='flex items-center justify-between border-t border-slate-100 pt-3'>
                <div>
                  <span className='text-xs font-bold text-slate-800 block'>
                    超出目标时发送桌面通知提醒
                  </span>
                  <span className='text-[11px] text-[#64748B] block mt-0.5'>
                    当今日活跃总时长突破所设定的目标上限时弹出通知提示
                  </span>
                </div>
                <button
                  onClick={() => updateField('notifyOnGoalReached', !settings.notifyOnGoalReached)}
                  className='text-[#2563EB] hover:opacity-80 transition-opacity'
                >
                  {settings.notifyOnGoalReached ? (
                    <ToggleRight className='w-8 h-8 text-[#2563EB]' />
                  ) : (
                    <ToggleLeft className='w-8 h-8 text-slate-300' />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. 不纳入统计的黑名单规则 */}
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4'>
        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
          <h3 className='text-sm font-bold text-slate-900 flex items-center space-x-2'>
            <Shield className='w-4 h-4 text-[#2563EB]' />
            <span>不纳入统计的网站黑名单</span>
          </h3>
          <button
            onClick={handleAddDevPresetBlacklist}
            className='text-xs font-bold text-[#2563EB] hover:underline'
          >
            + 导入开发环境预设 (localhost / 127.0.0.1)
          </button>
        </div>

        <p className='text-xs text-[#64748B] font-medium'>
          添加到黑名单中的域名将完全停止时间累加与行为追踪。支持通配符如 `*.local`
        </p>

        <div className='flex space-x-3'>
          <input
            type='text'
            placeholder='输入要排除的域名 (如: internal.company.com)...'
            value={newBlacklistItem}
            onChange={(e) => setNewBlacklistItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddBlacklist()}
            className='flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2563EB]'
          />
          <button
            onClick={handleAddBlacklist}
            className='px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition-all'
          >
            <Plus className='w-4 h-4' />
            <span>添加黑名单</span>
          </button>
        </div>

        <div className='flex flex-wrap gap-2 pt-2'>
          {settings.blacklist.length === 0 ? (
            <span className='text-xs text-slate-400 italic'>暂未设置任何黑名单规则</span>
          ) : (
            settings.blacklist.map((item) => (
              <span
                key={item}
                className='inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-mono font-bold border border-slate-200'
              >
                <span>{item}</span>
                <button
                  onClick={() => handleRemoveBlacklist(item)}
                  className='text-slate-400 hover:text-red-500 transition-colors'
                  title='移除此规则'
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* 4. 数据备份、恢复与清理管理 */}
      <div className='bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4'>
        <h3 className='text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3'>
          <Download className='w-4 h-4 text-[#2563EB]' />
          <span>数据备份、恢复与清理管理</span>
        </h3>

        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between'>
            <div>
              <span className='text-xs font-bold text-slate-800 block'>导出全量 JSON 备份</span>
              <span className='text-[11px] text-[#64748B] block mt-0.5'>
                将本地所有的细粒度访问日志下载为 JSON 文件
              </span>
            </div>
            <button
              onClick={handleExportData}
              className='px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all'
            >
              <Download className='w-3.5 h-3.5 text-[#2563EB]' />
              <span>导出 JSON</span>
            </button>
          </div>

          <div className='bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between'>
            <div>
              <span className='text-xs font-bold text-slate-800 block'>导入 JSON 备份历史</span>
              <span className='text-[11px] text-[#64748B] block mt-0.5'>
                从备份文件中恢复旧的历史浏览记录
              </span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className='px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all'
            >
              <Upload className='w-3.5 h-3.5 text-[#2563EB]' />
              <span>选择文件导入</span>
            </button>
          </div>

          <div className='bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between'>
            <div>
              <span className='text-xs font-bold text-slate-800 block'>定期清理旧历史数据</span>
              <span className='text-[11px] text-[#64748B] block mt-0.5'>
                一键擦除 30 天前的旧细粒度切页日志，释放存储
              </span>
            </div>
            <button
              onClick={handleClearOldLogs}
              className='px-3.5 py-2 bg-white border border-slate-200 hover:bg-amber-50 text-amber-700 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all'
            >
              <CalendarX className='w-3.5 h-3.5 text-amber-600' />
              <span>清理 30 天前记录</span>
            </button>
          </div>

          <div className='bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between'>
            <div>
              <span className='text-xs font-bold text-slate-800 block'>清空全量数据库</span>
              <span className='text-[11px] text-[#64748B] block mt-0.5'>
                彻底擦除所有本地存储的浏览记录，不可恢复
              </span>
            </div>
            <button
              onClick={handleClearLogs}
              className='px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all'
            >
              <Trash2 className='w-3.5 h-3.5 text-red-600' />
              <span>清空所有数据</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
