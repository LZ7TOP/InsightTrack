import { useState, useRef } from 'react'

interface TooltipTextProps {
  text: string
  className?: string
  maxWidthClass?: string
  asMonospace?: boolean
}

export default function TooltipText({
  text,
  className = '',
  maxWidthClass = 'max-w-[200px]',
  asMonospace = false,
}: TooltipTextProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const textRef = useRef<HTMLSpanElement>(null)

  function handleMouseEnter() {
    if (textRef.current) {
      // 仅当文本实际被截断溢出 (scrollWidth > clientWidth) 时触发浮动 Tooltip
      const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth
      if (isOverflow) {
        const rect = textRef.current.getBoundingClientRect()
        setCoords({
          left: Math.max(12, rect.left),
          top: rect.top,
        })
        setShowTooltip(true)
      }
    }
  }

  function handleMouseLeave() {
    setShowTooltip(false)
  }

  return (
    <div className='relative inline-block max-w-full align-middle'>
      <span
        ref={textRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`block truncate ${maxWidthClass} ${asMonospace ? 'font-mono' : ''} ${className}`}
      >
        {text}
      </span>

      {showTooltip && text && (
        <div
          style={{
            position: 'fixed',
            left: `${coords.left}px`,
            top: `${coords.top - 8}px`,
            transform: 'translateY(-100%)',
            zIndex: 9999,
          }}
          className='pointer-events-none animate-in fade-in zoom-in-95 duration-150'
        >
          <div className='bg-[#0F172A] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-2xl border border-slate-700/80 max-w-md whitespace-nowrap overflow-hidden text-ellipsis leading-snug tracking-wide flex items-center space-x-1.5'>
            <span className='select-text break-all whitespace-pre-wrap'>{text}</span>
          </div>
          {/* 小三角指引箭角 */}
          <div className='w-2.5 h-2.5 bg-[#0F172A] border-r border-b border-slate-700/80 rotate-45 ml-4 -mt-1 shadow-sm'></div>
        </div>
      )}
    </div>
  )
}
