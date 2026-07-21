<div align="center">

# 🔍 InsightTrack

**精准网页注意力与时间分析浏览器扩展**

区分「页面驻留时间」与「实际活跃时间」，通过多维可视化图表洞察真实浏览习惯

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?logo=google&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vite.dev)

</div>

---

## ✨ 项目简介

**InsightTrack** 是一款开源的 Chromium 浏览器扩展，帮助用户量化和分析自己的网页浏览习惯。

不同于传统浏览器历史记录只记录「访问了什么」，InsightTrack 精准追踪您在每个网页上的**实际活跃时间**（鼠标、键盘交互时段）和**页面驻留时间**（标签页存在时间），通过丰富的数据可视化图表，让您真正了解时间花在了哪里。

> 📦 所有数据完全存储在浏览器本地 IndexedDB 中，**绝不上传任何服务器**，隐私安全无忧。

---

## 🚀 核心特性

### 📊 智能时间追踪

- **双维度计时**：同时追踪「实际活跃时间」与「页面驻留时间」，精确区分前台交互与后台挂机
- **智能空闲检测**：可自定义无操作超时阈值（30s ~ 10min），超时自动暂停活跃计时
- **域名自动聚合**：智能清洗 `www.` 前缀，支持子域名归并统计
- **实时角标展示**：在浏览器扩展图标上实时显示当前网页活跃使用时长

### 📈 多维度数据可视化仪表盘

- **概览分析**：今日/本周/本月的活跃时间、驻留时间、专注率三大核心指标
- **网站使用时间对比折线图**：横轴展示各网站域名，纵轴展示使用时长，直观对比
- **每日时间趋势图**：折线图展示选定周期内每日浏览时间的起伏变化
- **Top 10 网站占比饼图**：环形图展示最常访问网站的时间占比
- **24 小时活跃热力图**：柱状图展示一天中各时段的活跃分布规律
- **域名时长排行榜**：一目了然的网站时间消耗排名

### 🔬 单站点深度分析

- **页面级下钻**：查看某个网站下每个具体页面的访问次数与时长
- **切换流水明细**：展开查看每次标签切换的精确时间戳、活跃时长与状态标识
- **完整网站列表**：含网站图标、名称、域名、访问次数、专注率等全量信息

### ⚙️ 丰富的偏好设置

- **追踪算法调节**：空闲超时阈值、角标显示开关、子域名归并开关
- **健康提醒目标**：设置每日活跃时间上限，超出时桌面通知提醒
- **隐私黑名单**：自定义不纳入统计的网站，支持通配符与一键导入开发环境预设
- **数据管理**：JSON 一键备份导出 / 导入恢复 / 30天旧日志清理 / 全量数据清空

---

## 🛠️ 技术栈

| 层面           | 技术                          |
| -------------- | ----------------------------- |
| **扩展规范**   | Chrome Manifest V3            |
| **前端框架**   | React 18 + TypeScript 5       |
| **构建工具**   | Vite 5                        |
| **样式方案**   | TailwindCSS 3                 |
| **数据可视化** | ECharts 5 (echarts-for-react) |
| **图标库**     | Lucide React                  |
| **本地存储**   | IndexedDB (idb 库封装)        |
| **后台引擎**   | Service Worker (Manifest V3)  |
| **内容脚本**   | Content Script (交互行为监听) |

---

## 📁 项目结构

```
InsightTrack/
├── public/
│   ├── manifest.json          # Chrome 扩展清单文件
│   └── icons/                 # 扩展图标 (16/48/128)
├── src/
│   ├── background/            # Service Worker 后台脚本
│   │   └── index.ts           # 标签页监听、时间统计引擎、角标更新
│   ├── content/               # Content Script 内容脚本
│   │   └── index.ts           # 网页交互行为监听 (鼠标/键盘/滚动)
│   ├── popup/                 # Popup 快捷弹窗
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── Popup.tsx          # 弹窗主组件：今日速报 & 快速操作
│   ├── options/               # Options 完整仪表盘
│   │   ├── index.html
│   │   ├── index.tsx
│   │   ├── Options.tsx        # 仪表盘主入口 & 数据编排
│   │   ├── Sidebar.tsx        # 侧边栏导航组件
│   │   ├── OverviewTab.tsx    # 概览分析 Tab
│   │   ├── SiteListTab.tsx    # 网站列表明细 Tab
│   │   ├── SiteDetailTab.tsx  # 单站点深度下钻 Tab
│   │   ├── CompareTab.tsx     # 历史跨段比对 Tab
│   │   ├── SettingsTab.tsx    # 偏好设置 Tab
│   │   └── utils.ts           # 共享类型定义与工具函数
│   ├── components/            # 通用可复用组件
│   │   ├── CustomSelect.tsx   # 自定义下拉选择器
│   │   └── FaviconImg.tsx     # 多源 Fallback 网站图标
│   ├── storage/               # 数据层
│   │   ├── db.ts              # IndexedDB 封装 (CRUD)
│   │   └── types.ts           # 数据模型类型定义
│   └── styles/
│       └── index.css          # TailwindCSS 全局样式
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
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

# 3. 开发模式 (支持 HMR 热更新)
npm run dev

# 4. 构建生产版本
npm run build
```

### 加载到浏览器

1. 运行 `npm run build` 构建项目
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 开启右上角的 **「开发者模式」**
4. 点击 **「加载已解压的扩展程序」**
5. 选择项目根目录下的 `dist` 文件夹
6. 扩展安装成功！点击工具栏图标即可查看弹窗速报，右键扩展图标选择「选项」进入完整仪表盘

---

## 📖 使用指南

### Popup 快捷弹窗

点击浏览器工具栏的 InsightTrack 图标，即可查看：

- 当前网页今日的活跃时间与驻留时间
- 当前网站是否在追踪黑名单中（可一键加入/移出）
- 今日访问网站的快速排行概览
- 一键跳转到完整数据仪表盘

### 数据可视化仪表盘

通过 Popup 弹窗中的「完整报告」按钮，或者右键扩展图标选择「选项」进入：

- **概览分析**：汇总指标卡片 + 对比折线图 + 趋势图 + 饼图 + 24h 热力图
- **网站列表明细**：带搜索和排序功能的全量网站访问信息表格
- **单站点深度下钻**：选择任意网站，查看其下所有页面的详细切换流水记录
- **历史跨段比对**：全量网站使用时长对比折线图 + 单站点柱状对比
- **偏好与设置**：追踪算法参数、健康提醒、黑名单管理、数据备份恢复

---

## 🔒 隐私说明

InsightTrack 把您的隐私放在首位：

- ✅ **所有数据仅存储在浏览器本地** IndexedDB 中
- ✅ **不收集、不上传** 任何个人信息到外部服务器
- ✅ **不需要登录** 或注册任何账号
- ✅ 提供**黑名单功能**，可排除敏感网站
- ✅ 支持随时**一键清空**所有历史数据
- ✅ 代码完全**开源**，可自行审查

---

## 🤝 参与贡献

欢迎任何形式的贡献！无论是提交 Bug 报告、功能建议，还是直接发送 Pull Request。

```bash
# Fork 本仓库后
git checkout -b feature/your-feature-name
git commit -m "feat: 你的功能描述"
git push origin feature/your-feature-name
# 然后发起 Pull Request
```

### 贡献指南

1. 代码风格请保持与项目现有风格一致
2. 提交消息请使用中文，并遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范
3. 新功能请附带必要的类型定义
4. 组件化开发，避免在单个文件中堆积过多逻辑

---

## 📜 开源许可

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">

**⭐ 如果这个项目对您有帮助，欢迎 Star 支持！**

Made with ❤️ by [LZ7工作室](https://github.com/LZ7TOP)

</div>
