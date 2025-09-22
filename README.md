# My Agent CLI

TypeScript + Ink + React

## ✨ 功能特性

- **Ink UI**：基于 `ink` 的终端界面，包含欢迎提示、对话区、输入区与状态栏
- **交互输入**：回车发送，显示思考态；内置 Ctrl+C 退出
- **可配置名称**：`--name` 指定助手显示名（默认：阿冬）
- **零依赖运行时打包**：使用 `esbuild` 打包源码，`node` 直接运行

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 20（项目目标环境：`node20`）

### 安装依赖

```bash
npm i
```

### 开发模式（监听构建）

```bash
npm run dev
# 生成 dist/ 并持续监听变更
```

### 构建

```bash
npm run build
# 单次构建到 dist/
```

### 运行

```bash
npm run start            # 运行已构建产物
npm run start:watch      # 使用 Node --watch 运行 dist/cli.js

# 传参示例（meow flags）
npm run start -- --name=阿冬
```

## 🧭 CLI 用法

编译后的命令帮助（节选）：

```
Usage
  $ my-ai-cli

Options
  --name  AI助手的名称 (默认: 阿冬)

Examples
  $ my-ai-cli
  $ my-ai-cli --name=阿冬
```

> 提示：当前仓库未通过 `npm publish` 暴露全局命令，推荐使用 `npm run start -- [flags]` 运行。

## 📁 项目结构

```
my-agent/
├── src/
│   ├── cli.tsx                 # CLI 入口（解析 flags，渲染 App）
│   ├── app.tsx                 # Ink 应用主体（会话、输入、状态栏）
│   └── components/             # UI 组件（AsciiArt、ChatMessage、…）
├── dist/                       # 构建输出（esbuild 产物）
├── esbuild.config.mjs          # esbuild 构建与 watch 配置（Node ESM）
├── eslint.config.js            # ESLint 配置
├── tsconfig.json               # TypeScript 类型检查配置
└── package.json                # 脚本与依赖
```

## 🧪 技术栈

- **TypeScript**：类型安全
- **React**：UI 抽象
- **Ink**：终端渲染器
- **meow**：命令行参数解析
- **esbuild**：打包与监听
- **ESLint / Prettier**：代码质量与风格

## 🔧 常用脚本

```bash
npm run dev         # 监听构建
npm run build       # 单次构建
npm run start       # 运行 dist/cli.js
npm run start:watch # Node 原生 --watch 运行 dist/cli.js
npm run lint        # ESLint 检查
npm run lint:fix    # ESLint 自动修复
npm run format      # Prettier 写入
npm run format:check# Prettier 校验
npm run type-check  # TypeScript 类型检查（tsc --noEmit）
```

## 🗺️ 代码概览

- `src/cli.tsx` 使用 `meow` 解析 `--name`，并通过 `ink.render(<App .../>)` 启动应用
- `src/app.tsx` 维护会话列表与输入状态：
  - 回显用户输入，模拟 1s 异步后输出助手回应（可接入后端 API）
  - `Ctrl+C` 退出
  - 组件：`AsciiArt`（标题）、`WelcomeTips`、`ChatMessage`、`WarningBox`、`InputArea`、`StatusBar`
- `esbuild.config.mjs` 指定 `entryPoints: ['src/cli.tsx']`、`target: node20`、`banner: '#!/usr/bin/env node'`

## 🤝 扩展与集成

- 将 `src/app.tsx` 中的模拟延迟替换为真实 API 调用
- 如需发布为全局命令：在 `package.json` 增加 `bin` 字段并发布到 npm

## 📝 许可证

ISC
