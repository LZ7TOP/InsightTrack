import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { getLocalDateStr } from '../storage/db'

export type DateRangeType = 'today' | '7days' | '30days' | 'custom'

interface DateRangePickerProps {
  dateRange: DateRangeType
  startDate: string
  endDate: string
  onChange: (range: DateRangeType, start: string, end: string) => void
}

export default function DateRangePicker({
  dateRange,
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempStart, setTempStart] = useState(startDate)
  const [tempEnd, setTempEnd] = useState(endDate)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部自动关闭下拉框
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setTempStart(startDate)
    setTempEnd(endDate)
  }, [startDate, endDate])

  function handleSelectPreset(range: DateRangeType) {
    const today = new Date()
    let s = getLocalDateStr(today)
    let e = getLocalDateStr(today)

    if (range === '7days') {
      const start = new Date()
      start.setDate(today.getDate() - 6)
      s = getLocalDateStr(start)
    } else if (range === '30days') {
      const start = new Date()
      start.setDate(today.getDate() - 29)
      s = getLocalDateStr(start)
    }

    setTempStart(s)
    setTempEnd(e)
    onChange(range, s, e)
    setIsOpen(false)
  }

  function handleApplyCustom() {
    let s = tempStart || getLocalDateStr(new Date())
    let e = tempEnd || getLocalDateStr(new Date())
    if (s > e) {
      const tmp = s
      s = e
      e = tmp
    }
    onChange('custom', s, e)
    setIsOpen(false)
  }

  // 格式化按钮展示文本
  function getButtonLabel() {
    if (dateRange === 'today') return '今日'
    if (dateRange === '7days') return '近7天'
    if (dateRange === '30days') return '近30天'
    if (startDate === endDate) return `${startDate} (全天)`
    return `${startDate} ~ ${endDate}`
  }

  return (
    <div className='relative inline-block select-none' ref={dropdownRef}>
      {/* 触发下拉按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
          isOpen || dateRange === 'custom'
            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-blue-500/20'
            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
        }`}
      >
        <Calendar className={`w-3.5 h-3.5 ${dateRange === 'custom' || isOpen ? 'text-white' : 'text-[#2563EB]'}`} />
        <span>{getButtonLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className='absolute right-0 top-full mt-2 z-50 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 space-y-4'>
          {/* 快捷预设区 */}
          <div>
            <span className='text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2'>
              快捷时间选择
            </span>
            <div className='grid grid-cols-3 gap-1.5'>
              <button
                onClick={() => handleSelectPreset('today')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateRange === 'today'
                    ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                今日
              </button>
              <button
                onClick={() => handleSelectPreset('7days')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateRange === '7days'
                    ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                近7天
              </button>
              <button
                onClick={() => handleSelectPreset('30days')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateRange === '30days'
                    ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                近30天
              </button>
            </div>
          </div>

          <div className='border-t border-slate-100 pt-3 space-y-3'>
            <span className='text-[11px] font-bold text-slate-400 uppercase tracking-wider block'>
              自定义日期区间
            </span>

            <div className='space-y-2'>
              <div>
                <label className='text-[11px] font-semibold text-slate-600 block mb-1'>开始日期</label>
                <input
                  type='date'
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className='w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2563EB] cursor-pointer'
                />
              </div>

              <div>
                <label className='text-[11px] font-semibold text-slate-600 block mb-1'>结束日期</label>
                <input
                  type='date'
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className='w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2563EB] cursor-pointer'
                />
              </div>
            </div>

            <button
              onClick={handleApplyCustom}
              className='w-full py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1 mt-2'
            >
              <Check className='w-3.5 h-3.5' />
              <span>确认区间筛选</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
