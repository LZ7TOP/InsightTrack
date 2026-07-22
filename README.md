<div align="center">

<img src="public/logo.svg" alt="InsightTrack Logo" width="112" height="112" />

# InsightTrack

**精准网页注意力与时间分析浏览器扩展**

区分「页面驻留时间」与「实际活跃时间」，通过多维可视化图表洞察真实浏览习惯

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?logo=google&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Author: LZ7工作室](https://img.shields.io/badge/Author-LZ7工作室-2563EB.svg)](https://github.com/LZ7TOP)

</div>

---

## ✨ 项目简介

**InsightTrack** 是一款由 **LZ7工作室** 开发并开源的现代 Chromium 浏览器扩展，致力于帮助用户量化、分析和提升自己的网页浏览与时间利用效率。

不同于传统浏览器历史记录只盲目记录「访问了什么」，InsightTrack 能精确追踪区分：

- 💡 **实际活跃时间**：鼠标移动、键盘输入、滚动页面等真实交互的时段
- ⏱️ **页面驻留时间**：标签页打开在浏览器中的挂机与后台总时长

通过丰富且富有现代审美的高颜值可视化图表，让您对自己的数字精力分配一目了然。

> 📦 **隐私承诺**：所有切页日志与访问数据完全存储在浏览器本地 IndexedDB 中，**绝对不会上传任何第三方服务器**，无需注册登录，隐私安全无忧。

---

## 🚀 核心特性

### 📊 智能双维度时间追踪

- **前后台智能识别**：精准区分前台焦点交互与后台挂机，算法毫秒级无感计算。
- **无操作空闲检测开关**：支持选择开启或关闭（默认关闭）。开启后无交互超时（30秒 ~ 10分钟）自动暂停活跃计时；关闭时只要在前台聚焦窗口即算活跃。
- **域名自动规范归并**：智能清洗 `www.` 前缀，支持选择是否将 `blog.github.com` 等多级子域名统一归并到主域名分析。
- **实时工具栏角标**：扩展图标上实时高亮动态展示当前网页今日活跃时长（如 `15s` / `42m`），0秒或黑名单网页智能隐藏角标。

### 📈 全维度数据可视化仪表盘

- **概览分析大屏**：
  - 核心指标卡片（活跃时长、驻留时长、专注率 %）
  - **全量网站使用时长对比柱状图**（单柱双色分段直观比对每个网站的实际活跃时间与挂机驻留时间）
  - **每日整体起伏趋势折线图**
  - **Top 10 网站占比饼图**
  - **24 小时活跃时段分布热力柱状图**
  - **域名时长排行榜**
- **网站列表明细表**：
  - 吸顶表头（Sticky Header）与首列固定（Sticky Domain Column）
  - 支持多维度快速排序与实时搜索
  - 集成多源 Fallback 网站图标（`FaviconImg`）与智能超长文本浮窗提示（`TooltipText`）
- **单站点深度下钻**：
  - 域名下属各 URL 页面级访问汇总
  - **切换流水日志溯源**：展开可追踪每次切页的精确时间戳、活跃时间与驻留时间
  - 修复自动刷新闭包保护，下钻视图滚动时所选域名永不重置
- **历史跨段比对**：
  - 针对选定单站点，按选择周期（今日 / 7天 / 30天）按日展开逐日活跃与驻留柱状比对
  - 计算单站点日均活跃、最高单日访问与专注率指标

### ⚙️ 偏好设置与数据安全

- **自定义无操作空闲检测**：灵活选择开启/关闭及超时阈值。
- **注意力目标与健康提醒开关**：选择开启/关闭每日活跃上限目标（2h/4h/6h/8h）与桌面防沉迷通知。
- **实时自动刷新设置**：支持开启/关闭视图自动刷新，并可自由设定刷新频率（3s / 5s / 10s / 30s）。
- **隐私黑名单管理**：一键快捷导入开发环境预设（`localhost`、`127.0.0.1`），支持通配符排除敏感站点。
- **数据全量备份与清理**：JSON 格式一键导出备份 / 导入恢复，支持 30 天旧日志清理与全量清空。

---

## 🎨 极致 UI 与组件封装

- **`TooltipText` 智能文本提示框**：
  - 使用 React `createPortal` 将浮窗直接挂载到 `document.body` 根节点，彻底解决表格 `overflow` 裁剪与吸顶表头遮挡问题（`z-index: 99999`）。
  - 智能溢出检测：仅在文本实际被截断（`scrollWidth > clientWidth`）时触发。
  - 精致 SVG 导向箭头与 `180ms` 丝滑缩放渐入渐出动画。
- **`ConfirmModal` 现代模态弹窗**：
  - 全面替代浏览器原生 `window.confirm` 与 `alert` 弹窗。
  - 毛玻璃半透明遮罩（`bg-slate-900/40 backdrop-blur-sm`），提供 `danger` / `warning` / `info` 语义化精致卡片。
- **`FaviconImg` 多源 Fallback 图标**：
  - 依次尝试网站自带 `/favicon.ico` -> DuckDuckGo API -> Google Favicon -> 兜底地球图标，解决国内网络环境下 Google 图标加载失败问题。
- **`CustomSelect` 自定义下拉菜单**：
  - 替代原生 HTML Select，提供一致的现代视觉风格与交互体验。

---

## 🛠️ 技术栈

| 层面           | 技术                                  |
| -------------- | ------------------------------------- |
| **扩展规范**   | Chrome Manifest V3                    |
| **前端框架**   | React 18 + TypeScript 5               |
| **构建工具**   | Vite 5                                |
| **样式方案**   | TailwindCSS 3                         |
| **数据可视化** | ECharts 5 (`echarts-for-react`)       |
| **图标库**     | Lucide React                          |
| **本地存储**   | IndexedDB (`idb` 库封装)              |
| **后台引擎**   | Service Worker (Manifest V3 后台脚本) |
| **内容脚本**   | Content Script (网页交互行为监听)     |

---

## 📁 项目结构

```
LZ7_InsightTrack/
├── public/
│   ├── manifest.json          # Chrome 扩展 MV3 清单文件
│   ├── logo.svg               # InsightTrack 全局矢量 LOGO 图标
│   ├── logo_black.png         # LZ7工作室 品牌 LOGO
│   └── icons/                 # 扩展全套应用图标 (16 / 48 / 128)
├── LOGO.png
├── LOGO_BLACK.png
├── src/
│   ├── background/            # Service Worker 后台脚本
│   │   └── index.ts           # 标签页监听、时间统计引擎、角标更新、桌面通知
│   ├── content/               # Content Script 内容脚本
│   │   └── index.ts           # 网页交互行为监听 (鼠标移动/键盘输入/滚动)
│   ├── popup/                 # Popup 快捷弹窗
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── Popup.tsx          # 弹窗主组件：本站速报、每日排行与导航
│   ├── options/               # Options 完整仪表盘
│   │   ├── index.html
│   │   ├── index.tsx
│   │   ├── Options.tsx        # 仪表盘主入口、品牌浮窗与状态编排
│   │   ├── Sidebar.tsx        # 侧边栏导航组件与工作室品牌区域
│   │   ├── OverviewTab.tsx    # 概览分析 Tab (指标卡片 + 折线/饼/热力图)
│   │   ├── SiteListTab.tsx    # 网站列表明细 Tab (固定列 + 表头吸顶)
│   │   ├── SiteDetailTab.tsx  # 单站点深度下钻 Tab (URL 切页流水追踪)
│   │   ├── CompareTab.tsx     # 历史跨段比对 Tab (单站点逐日柱状图)
│   │   ├── SettingsTab.tsx    # 偏好设置 Tab (算法/目标/黑名单/备份)
│   │   └── utils.ts           # 共享工具函数与类型定义
│   ├── components/            # 通用独立 UI 组件
│   │   ├── ConfirmModal.tsx   # 毛玻璃模态确认/提示弹窗
│   │   ├── CustomSelect.tsx   # 自定义下拉选择器
│   │   ├── FaviconImg.tsx     # 多源 Fallback 网站图标组件
│   │   └── TooltipText.tsx    # React Portal 全局悬浮气泡提示组件
│   ├── storage/               # 数据模型与本地存储层
│   │   ├── db.ts              # IndexedDB CRUD 数据库封装
│   │   └── types.ts           # 数据模型与 Settings 接口定义
│   └── styles/
│       └── index.css          # TailwindCSS 全局样式定义
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── README.md
└── LICENSE
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9
- **Chrome / Edge** 等 Chromium 内核浏览器

### 安装与开发

```bash
# 1. 克隆项目
git clone https://github.com/LZ7TOP/InsightTrack.git
cd InsightTrack

# 2. 安装依赖
npm install

# 3. 开发构建模式
npm run dev

# 4. 生产环境构建
npm run build
```

### 加载到浏览器

1. 执行 `npm run build` 完成打包构建（产物输出至 `dist` 目录）
2. 打开 Chrome / Edge 浏览器，访问 `chrome://extensions/`
3. 开启右上角的 **「开发者模式」**
4. 点击 **「加载已解压的扩展程序」 (Load unpacked)**
5. 选择项目根目录下的 `dist` 文件夹
6. 扩展安装成功！点击扩展栏图标体验 Popup 快捷速报，或右键选择「选项」进入全屏仪表盘

---

## 🔒 隐私与数据安全

InsightTrack 始终将用户的隐私与数据安全放在第一位：

- ✅ **100% 本地存储**：所有细粒度切页数据仅保存在浏览器本地 IndexedDB 数据库中
- ✅ **零网络上传**：不收集、不追踪、不上传任何浏览记录至外部网络服务器
- ✅ **无需注册**：即装即用，不绑定任何用户账号
- ✅ **灵活黑名单**：支持一键排除敏感网站或开发环境地址
- ✅ **一键完全擦除**：提供完整的数据导出备份与数据库一键清空机制
- ✅ **开源透明**：代码完全公开在 GitHub，欢迎广大开发者审查

---

## 🤝 参与贡献

欢迎提交 Issue 或 Pull Request 帮助改善项目！

```bash
# Fork 本仓库后克隆
git checkout -b feature/amazing-feature
git commit -m "feat: 增加某项新特性"
git push origin feature/amazing-feature
# 发起 Pull Request
```

---

## 📜 开源许可

本项目基于 [MIT License](LICENSE) 协议开源。

---

<div align="center">

**⭐ 如果 InsightTrack 对您的日常学习与工作有所帮助，欢迎点个 Star 支持！**

Made with ❤️ by [LZ7工作室](https://github.com/LZ7TOP)

</div>
