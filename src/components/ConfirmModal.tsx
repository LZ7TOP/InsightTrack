import { AlertTriangle, Info, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title = '提示确认',
  message,
  confirmText = '确定',
  cancelText = '取消',
  type = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const isDanger = type === 'danger'
  const isWarning = type === 'warning'

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none'>
      <div className='bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 relative'>
        <button
          onClick={onCancel}
          className='absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-xl transition-colors'
        >
          <X className='w-4 h-4' />
        </button>

        <div className='flex items-start space-x-4'>
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-50 text-red-600 border border-red-200'
                : isWarning
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-blue-50 text-[#2563EB] border border-blue-200'
            }`}
          >
            {isDanger || isWarning ? (
              <AlertTriangle className='w-5 h-5' />
            ) : (
              <Info className='w-5 h-5' />
            )}
          </div>

          <div className='flex-1 pt-0.5'>
            <h3 className='text-base font-bold text-slate-900 tracking-tight'>{title}</h3>
            <p className='text-xs font-medium text-[#64748B] mt-1.5 leading-relaxed break-all'>
              {message}
            </p>
          </div>
        </div>

        <div className='flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-slate-100'>
          {cancelText && (
            <button
              onClick={onCancel}
              className='px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all'
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl text-white shadow-md transition-all ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                : 'bg-[#2563EB] hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
