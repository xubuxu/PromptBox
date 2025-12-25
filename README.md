# 📦 PromptBox

> Your Second Brain for AI Prompts.
> 
> 你的 AI 提示词"第二大脑" —— 极速调用、动态模版、数据掌控。

**PromptBox** 是一个专为 AI 重度用户和开发者设计的**桌面应用程序**（Electron）。它旨在解决提示词管理混乱、重复编写、查找困难等痛点，提供从"存储"到"调用"的极致效率体验。

## 🛠️ 技术栈 (Tech Stack)

| 类别 | 技术 |
|------|------|
| 框架 | Electron + electron-vite |
| 前端 | React 18 + TypeScript |
| 样式 | Tailwind CSS v3 |
| 图标 | Lucide React |
| 数据存储 | 本地 JSON 文件 (`prompts.json`) |

## ⚡ 快速开始 (Quick Start)

### 开发模式

```bash
# 克隆项目
git clone https://github.com/yourname/promptbox.git
cd promptbox

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 🎯 核心功能 (Features)

### ✅ 已实现 (MVP)

- **🖥️ 无边框窗口** - 自定义标题栏，支持"置顶"功能
- **⌨️ 全局快捷键** - `Alt+Space` 快速唤起/隐藏窗口
- **📝 Prompt CRUD** - 创建、读取、更新、删除提示词
- **🔍 全文搜索** - 实时过滤标题、内容和标签
- **⭐ 收藏功能** - 快速访问常用提示词
- **🧩 变量支持** - `{{变量}}` 语法，自动识别和高亮
- **📋 一键复制** - 点击即可复制提示词到剪贴板
- **💾 本地存储** - 数据保存在 `userData/prompts.json`
- **📥📤 导入/导出** - 支持 JSON 格式备份和恢复

### 🚧 计划中 (Roadmap)

- [ ] 变量填空弹窗 - 调用时弹出表单填写变量
- [ ] 文件夹/分组管理
- [ ] 多主题支持
- [ ] 系统托盘
- [ ] 开机自启动

## 📁 项目结构 (Project Structure)

```
src/
├── main/                # [后端] Node.js 主进程
│   ├── index.ts         # 窗口创建、全局快捷键
│   ├── ipcHandlers.ts   # IPC 事件处理
│   └── store.ts         # 文件读写逻辑
├── preload/             # [桥接] 安全层
│   ├── index.ts         # contextBridge API
│   └── index.d.ts       # TypeScript 类型声明
├── renderer/            # [前端] React 应用
│   └── src/
│       ├── App.tsx      # 主应用组件
│       ├── components/  # UI 组件
│       └── hooks/       # 自定义 Hooks
└── shared/              # 共享类型定义
    └── types.ts
```

## ⌨️ 快捷键 (Keyboard Shortcuts)

| 快捷键 | 功能 |
|--------|------|
| `Alt+Space` | 显示/隐藏窗口 |

## 📖 使用示例 (Usage)

### 1. 创建带变量的模版

在新建 Prompt 时，使用双大括号定义变量：

> **标题**：周报生成器
> 
> **内容**：请帮我写一份关于 {{本周工作重点}} 的周报，我的职位是 {{职位}}，语气要求 {{语气}}。

### 2. 快捷调用

1. 按 `Alt+Space` 唤起 PromptBox
2. 搜索 "周报"
3. 点击卡片复制内容
4. 粘贴到 ChatGPT/Claude 使用

## 🤝 贡献 (Contributing)

欢迎提交 Issue 或 Pull Request！

## 📄 许可证 (License)

[MIT License](LICENSE)
