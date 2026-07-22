import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'))
const version = pkg.version || '1.0.0'
const releasesDir = path.join(rootDir, 'releases')

if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true })
}

const distDir = path.join(rootDir, 'dist')
const zipName = `InsightTrack-v${version}.zip`
const outputPath = path.join(releasesDir, zipName)

console.log(`📦 正在打包 Chrome 扩展到 releases/${zipName} ...`)

if (process.platform === 'win32') {
  execSync(`powershell Compress-Archive -Path "${distDir}\\*" -DestinationPath "${outputPath}" -Force`)
} else {
  execSync(`cd "${distDir}" && zip -r "${outputPath}" .`)
}

console.log(`✅ 打包完成！成品已生成并保存至: releases/${zipName}`)
