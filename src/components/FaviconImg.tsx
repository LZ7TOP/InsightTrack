import { useState } from 'react'
import { Globe } from 'lucide-react'

interface FaviconImgProps {
  domain: string
  className?: string
}

/**
 * 带多源 fallback 的网站图标组件
 * 依次尝试以下来源获取 favicon：
 * 1. 网站自身的 /favicon.ico
 * 2. DuckDuckGo 图标服务
 * 3. Google favicon 服务
 * 全部失败时显示默认的 Globe 占位图标
 */
export default function FaviconImg({ domain, className = 'w-5 h-5' }: FaviconImgProps) {
  const sources = [
    `https://${domain}/favicon.ico`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
  ]

  const [sourceIndex, setSourceIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  function handleError() {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((prev) => prev + 1)
    } else {
      setFailed(true)
    }
  }

  if (failed) {
    return (
      <div className={`${className} rounded-md bg-slate-100 flex items-center justify-center`}>
        <Globe className='w-3 h-3 text-slate-400' />
      </div>
    )
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt=''
      onError={handleError}
      className={`${className} rounded-md object-contain bg-slate-100`}
    />
  )
}
