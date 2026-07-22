import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

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
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: true,
  })
  const textRef = useRef<HTMLSpanElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  function updatePosition() {
    if (!textRef.current) return
    const rect = textRef.current.getBoundingClientRect()
    const placeAbove = rect.top > 80
    setCoords({
      left: Math.max(12, Math.min(window.innerWidth - 340, rect.left)),
      top: placeAbove ? rect.top - 8 : rect.bottom + 8,
      placeAbove,
    })
  }

  function handleMouseEnter() {
    if (textRef.current) {
      // 仅当文本在表格单元格中实际被截断溢出 (scrollWidth > clientWidth) 时才触发提示
      const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth
      if (isOverflow) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        updatePosition()
        setShowTooltip(true)
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      }
    }
  }

  function handleMouseLeave() {
    setIsVisible(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false)
    }, 180)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

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

      {showTooltip &&
        text &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              top: `${coords.top}px`,
              transform: coords.placeAbove ? 'translateY(-100%)' : 'translateY(0)',
              zIndex: 99999,
            }}
            className={`pointer-events-none transition-all duration-200 ease-out origin-bottom ${
              isVisible
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95'
            }`}
          >
            <div className='bg-[#0F172A]/95 backdrop-blur-md text-slate-100 text-xs font-semibold px-3 py-2 rounded-xl shadow-2xl shadow-slate-950/40 border border-slate-700/80 max-w-md whitespace-pre-wrap break-all leading-relaxed tracking-wide select-none'>
              {text}
            </div>

            {/* 精致柔和的 SVG 引导箭头 */}
            <div
              className={`absolute left-5 w-3 h-1.5 overflow-hidden ${
                coords.placeAbove ? 'top-full' : '-top-1.5 rotate-180'
              }`}
            >
              <svg
                viewBox='0 0 12 6'
                className='w-3 h-1.5 fill-[#0F172A]'
              >
                <polygon points='0,0 6,6 12,0' />
              </svg>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
