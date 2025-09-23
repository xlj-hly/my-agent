# My Agent - AI智能代理系统

基于TypeScript的现代化AI Agent系统，支持CLI交互和MCP协议

## ✨ 功能特性

### 🤖 智能代理核心
- **ReAct推理循环**：思考→行动→观察的智能决策过程
- **工具调用系统**：内置工具（时间、计算器、系统信息）+ 外部MCP工具集成
- **会话记忆管理**：智能上下文维护和历史记录
- **错误恢复机制**：工具失败时的重试和降级处理

### 🎯 双模式运行
- **CLI模式**：基于Ink的美观终端界面，流畅的AI对话体验
- **MCP服务器模式**：作为MCP工具在Cursor等支持MCP的应用中使用

### 🏗️ 现代化架构
- **分层架构设计**：核心层、服务层、适配器层、工具层、应用层
- **依赖注入**：松耦合设计，易于测试和扩展
- **插件化工具系统**：统一接口，支持动态工具注册
- **TypeScript全覆盖**：完整的类型安全保障

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 20（项目目标环境：`node20`）

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量示例文件并配置：

```bash
cp env.example .env
```

编辑 `.env` 文件，填入你的API配置：

```bash
# SiliconFlow API (推荐，国内可用)
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_MODEL=gpt-3.5-turbo
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# 或者使用OpenAI官方API
# SILICONFLOW_API_KEY=your_openai_api_key
# SILICONFLOW_MODEL=gpt-3.5-turbo  
# SILICONFLOW_BASE_URL=https://api.openai.com/v1
```

### 3. 构建项目

```bash
npm run build
```

## 📱 使用方式

### 方式一：CLI交互模式

启动命令行AI助手，享受终端中的智能对话：

```bash
npm start
# 或者自定义助手名称
npm start -- --name="你的AI助手"
```

**CLI功能特点：**
- ✅ 美观的终端界面（基于Ink）
- ✅ 实时AI对话和工具调用
- ✅ 自动环境检查和错误提示
- ✅ Ctrl+C 优雅退出

### 方式二：MCP服务器模式

作为MCP工具在支持MCP的应用中使用：

```bash
# 启动MCP服务器
npm run mcp:server
```

在支持MCP的客户端（如Cursor）中配置：

```json
{
  "mcpServers": {
    "my-agent": {
      "command": "node",
      "type": "stdio", 
      "args": ["path/to/dist/mcp/main.js"]
    }
  }
}
```

**可用MCP工具：**
- `agent_run`: 运行AI Agent处理复杂任务
- `agent_reset`: 重置Agent会话
- `agent_status`: 查看Agent状态

### 开发模式

```bash
npm run dev         # 监听构建模式
npm run start:watch # Node --watch 运行模式
```

## 🏗️ 项目架构

### 分层架构设计

```
┌─────────────────────────────────────────┐
│                应用层                    │
├─────────────────────────────────────────┤
│  CLI界面     │  MCP服务器  │  React组件  │
│  cli.tsx     │  main.ts    │  app.tsx    │
└─────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│               适配器层                   │
├─────────────────────────────────────────┤
│  CLIAdapter.ts    │    MCPAdapter.ts    │
│  (CLI环境适配)     │   (MCP环境适配)      │
└─────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│                服务层                    │
├─────────────────────────────────────────┤
│ AgentCore.ts  │ ModelService.ts        │
│ (核心逻辑)     │ MemoryService.ts       │
│               │ ToolService.ts          │
└─────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│                核心层                    │
├─────────────────────────────────────────┤
│ interfaces/   │  base/     │  types/    │
│ (接口定义)     │ (基础类)    │ (类型定义)  │
└─────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│                工具层                    │
├─────────────────────────────────────────┤
│           tools/adapters/               │
│    (具体工具实现，符合ITool接口)          │
└─────────────────────────────────────────┘
```

### 目录结构

```
my-agent/
├── src/
│   ├── cli.tsx                 # CLI应用入口
│   ├── app.tsx                 # React主应用组件
│   ├── components/             # UI组件库
│   │   ├── AsciiArt.tsx        # ASCII艺术标题
│   │   ├── ChatMessage.tsx     # 聊天消息组件
│   │   ├── InputArea.tsx       # 输入区域
│   │   └── ...                 # 其他UI组件
│   ├── core/                   # 核心层
│   │   ├── interfaces/         # 接口定义
│   │   │   ├── IAgent.ts       # Agent接口
│   │   │   ├── IModel.ts       # 模型接口
│   │   │   ├── IMemory.ts      # 记忆接口
│   │   │   └── ITool.ts        # 工具接口
│   │   ├── base/               # 基础类实现
│   │   │   ├── BaseModel.ts    # 模型基础类
│   │   │   ├── BaseMemory.ts   # 记忆基础类
│   │   │   └── BaseTool.ts     # 工具基础类
│   │   └── types/              # 类型定义
│   │       └── common.ts       # 通用类型
│   ├── services/               # 服务层
│   │   ├── AgentCore.ts        # Agent核心服务
│   │   ├── ModelService.ts     # 模型服务
│   │   ├── MemoryService.ts    # 记忆服务
│   │   └── ToolService.ts      # 工具管理服务
│   ├── adapters/               # 适配器层
│   │   ├── CLIAdapter.ts       # CLI环境适配器
│   │   └── MCPAdapter.ts       # MCP协议适配器
│   ├── tools/                  # 工具层
│   │   ├── adapters/           # 工具实现
│   │   │   ├── DateTimeTool.ts # 时间工具
│   │   │   ├── CalculatorTool.ts # 计算器工具
│   │   │   └── SystemInfoTool.ts # 系统信息工具
│   │   └── index.ts            # 工具导出管理
│   └── mcp/                    # MCP服务器
│       ├── main.ts             # MCP服务器入口
│       ├── mcp.json            # MCP服务器配置
│       └── handlers/           # MCP请求处理器
├── dist/                       # 构建输出
├── docs/                       # 项目文档
├── .env                        # 环境变量配置
├── env.example                 # 环境变量示例
├── esbuild.config.mjs          # 构建配置
├── eslint.config.js            # 代码检查配置
├── tsconfig.json               # TypeScript配置
└── package.json                # 项目配置
```

## 🧪 技术栈

### 核心技术
- **TypeScript**：完整类型安全，现代化开发体验
- **React**：组件化UI抽象，声明式界面开发
- **Ink**：终端渲染器，创建美观的CLI界面
- **esbuild**：高性能构建工具，支持代码分割和压缩

### AI集成
- **OpenAI兼容API**：支持多种模型提供商
- **SiliconFlow**：推荐的国内AI服务提供商
- **LangChain**：AI应用开发框架
- **Anthropic SDK**：Claude模型集成

### MCP生态
- **@modelcontextprotocol/sdk**：MCP协议标准实现
- **外部工具集成**：context7、sequential-thinking等

### 开发工具
- **meow**：命令行参数解析
- **dotenv**：环境变量管理
- **ESLint / Prettier**：代码质量与风格统一
- **Node.js 20+**：现代JavaScript运行时

## 🔧 开发脚本

### 构建和运行
```bash
npm run build       # 构建所有组件到dist/
npm run dev         # 开发模式（监听文件变化）
npm start           # 启动CLI应用
npm run start:watch # Node --watch模式运行CLI
npm run mcp:server  # 启动MCP服务器
```

### 代码质量
```bash
npm run lint        # ESLint代码检查
npm run lint:fix    # ESLint自动修复
npm run format      # Prettier格式化代码
npm run format:check# Prettier格式检查
npm run type-check  # TypeScript类型检查
```

### 项目管理
```bash
npm run prepublishOnly # 发布前自动构建
```

## 🎯 核心特性说明

### ReAct推理循环
Agent采用"思考→行动→观察"的推理模式：
1. **思考**：分析用户需求，制定行动计划
2. **行动**：调用合适的工具执行任务
3. **观察**：分析工具执行结果，决定下一步行动

### 工具调用系统
- **内置工具**：时间查询、数学计算、系统信息获取
- **外部工具**：通过MCP协议集成context7、sequential-thinking等
- **统一接口**：所有工具遵循ITool接口，支持参数验证和错误处理

### 智能记忆管理
- **上下文维护**：自动管理对话历史和工具调用记录
- **容量控制**：智能清理过期消息，保持性能
- **会话统计**：提供详细的使用统计信息

## 🚀 扩展开发

### 添加新工具
1. 继承`BaseTool`类
2. 实现`execute`方法
3. 在适配器中注册工具

### 添加新适配器
1. 实现核心服务的环境特定配置
2. 注册所需的工具集
3. 提供环境检查和错误处理

### MCP工具集成
在`src/mcp/mcp.json`中配置外部MCP服务器连接

## 📝 许可证

ISC
