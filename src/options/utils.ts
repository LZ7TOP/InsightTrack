import { DomainStats } from '../storage/types'

// 所有 Tab 页面共用的类型定义
export type TabType = 'overview' | 'site_list' | 'site_detail' | 'compare' | 'settings'

// 网站列表项
export interface SiteListItem {
  domain: string
  title: string
  openTimeMs: number
  activeTimeMs: number
  visits: number
  urlCount: number
  focusRate: number
}

// 域名聚合原始映射
export interface DomainAggregation {
  title: string
  open: number
  active: number
  visits: number
  urls: Set<string>
}

// 格式化毫秒时间为可读文本
export function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '0秒'
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60

  if (hours > 0) return `${hours}小时 ${mins}分`
  if (mins > 0) return `${mins}分 ${secs}秒`
  return `${secs}秒`
}

// 格式化时间戳为 HH:MM:SS
export function formatTimestamp(ts: number): string {
  if (!ts) return '--:--:--'
  const d = new Date(ts)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 从日志列表构建域名聚合映射
export function buildDomainMap(
  logs: { domain: string; title: string; openTimeMs: number; activeTimeMs: number; url: string }[],
  cleanDomain: (d: string) => string,
): Record<string, DomainAggregation> {
  const domainMap: Record<string, DomainAggregation> = {}

  logs.forEach((log) => {
    const domainKey = cleanDomain(log.domain)
    if (!domainMap[domainKey]) {
      domainMap[domainKey] = {
        title: log.title || domainKey,
        open: 0,
        active: 0,
        visits: 0,
        urls: new Set(),
      }
    }
    domainMap[domainKey].open += log.openTimeMs
    domainMap[domainKey].active += log.activeTimeMs
    domainMap[domainKey].visits += 1
    domainMap[domainKey].urls.add(log.url)

    if (log.title && log.title !== domainKey) {
      domainMap[domainKey].title = log.title
    }
  })

  return domainMap
}

// 从域名聚合映射构建完整网站列表
export function buildSiteList(domainMap: Record<string, DomainAggregation>): SiteListItem[] {
  return Object.entries(domainMap).map(([domain, stats]) => {
    const focusRate =
      stats.open > 0
        ? Math.min(100, Math.round((stats.active / stats.open) * 100))
        : 0
    return {
      domain,
      title: stats.title,
      openTimeMs: stats.open,
      activeTimeMs: stats.active,
      visits: stats.visits,
      urlCount: stats.urls.size,
      focusRate,
    }
  })
}

// 从完整网站列表构建排行统计
export function buildDomainStatsList(siteList: SiteListItem[]): DomainStats[] {
  return siteList
    .map((s) => ({
      domain: s.domain,
      openTimeMs: s.openTimeMs,
      activeTimeMs: s.activeTimeMs,
      lastVisited: Date.now(),
    }))
    .sort((a, b) => b.activeTimeMs - a.activeTimeMs)
}
