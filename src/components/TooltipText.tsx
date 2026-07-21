import { useState } from 'react'

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

  return (
    <div
      className='relative inline-block max-w-full'
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        title={text}
        className={`block truncate ${maxWidthClass} ${asMonospace ? 'font-mono' : ''} ${className}`}
      >
        {text}
      </span>

      {showTooltip && text && (
        <div className='absolute left-0 bottom-full mb-1.5 z-50 pointer-events-none'>
          <div className='bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl max-w-sm break-all whitespace-normal animate-in fade-in zoom-in-95 duration-150 border border-slate-700/80 leading-relaxed'>
            {text}
          </div>
        </div>
      )}
    </div>
  )
}
