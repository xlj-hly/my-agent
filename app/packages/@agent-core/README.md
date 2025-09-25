# @agent-core

多Agent编排系统核心接口和类型定义包。

## 📋 概述

`@agent-core` 是多Agent编排系统的核心包，提供了系统中所有组件必须遵循的标准接口和类型定义。

## 🏗️ 架构设计

本包遵循以下设计原则：

- **接口优先**: 先定义接口，再实现具体功能
- **类型安全**: 严格的TypeScript类型定义
- **标准化**: 统一的接口规范和数据结构
- **可扩展**: 支持系统的灵活扩展

## 📦 包结构

```
@agent-core/
├── interfaces/           # 核心接口定义
│   ├── function.interface.ts    # 函数调用接口
│   ├── plugin.interface.ts      # 插件接口
│   ├── agent.interface.ts       # Agent接口
│   ├── memory.interface.ts      # 记忆接口
│   └── registry.interface.ts    # 注册中心接口
├── types/                # 类型定义
│   ├── function.types.ts        # 函数相关类型
│   ├── plugin.types.ts          # 插件相关类型
│   ├── agent.types.ts           # Agent相关类型
│   ├── memory.types.ts          # 记忆相关类型
│   └── common.types.ts          # 通用类型
├── constants/            # 常量定义
│   ├── categories.ts            # 分类常量
│   ├── errors.ts                # 错误常量
│   └── events.ts                # 事件常量
├── index.ts              # 主入口文件
├── package.json          # 包配置
├── tsconfig.json         # TypeScript配置
└── README.md             # 文档
```

## 📥 导入/导出约定（重要）

- 统一使用“无后缀导入/导出”，不要带 `.ts` 或 `.js` 后缀。
- 本包公开入口：`app/packages/@agent-core/index.ts`。
- 在本仓库内的测试或其它包中应这样导入：

```ts
// 在 app/tests 或其它包中
import { FunctionCall, AgentDefinition, Plugin } from '../../../packages/@agent-core';
```

- 原因：根 tsconfig 配置了 `allowImportingTsExtensions: false`，并通过 ts-jest 直接编译 TS 源码；统一无后缀可避免 IDE 与运行时解析分歧。

## 🔧 核心接口

### FunctionCall 接口

定义系统中所有可调用函数的标准接口：

```typescript
import { FunctionCall } from '@agent-core';

const myFunction: FunctionCall<InputType, OutputType> = {
  name: 'my-function',
  version: '1.0.0',
  description: '我的函数',
  category: 'utility',
  tags: ['test'],
  inputSchema: { type: 'object' },
  outputSchema: { type: 'object' },
  async execute(input, context) {
    // 函数实现
    return { success: true, data: result };
  },
};
```

### AgentDefinition 接口

定义系统中所有Agent的标准接口：

```typescript
import { AgentDefinition, AgentType } from '@agent-core';

const myAgent: AgentDefinition = {
  name: 'my-agent',
  version: '1.0.0',
  description: '我的Agent',
  type: AgentType.EXPERT,
  capabilities: ['data-analysis'],
  inputSchema: { type: 'object' },
  outputSchema: { type: 'object' },
  async process(input, context) {
    // Agent处理逻辑
    return { success: true, data: result };
  },
};
```

### Plugin 接口

定义系统中所有插件的标准接口：

```typescript
import { Plugin } from '@agent-core';

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: '我的插件',
  functions: [myFunction],
  agents: [myAgent],
  async initialize() {
    // 初始化逻辑
  },
};
```

### Plugin 接口

定义插件的标准接口：

```typescript
import { Plugin } from '@agent-core';

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: '我的插件',
  functions: [myFunction],
  agents: [myAgent],
  async initialize() {
    // 初始化逻辑
  },
};
```

## 📝 使用示例

### 基本使用

```typescript
import {
  FunctionCall,
  AgentDefinition,
  Plugin,
  AgentType,
  ERROR_CODES,
  getErrorMessage,
} from '@agent-core';

// 创建函数
const searchFunction: FunctionCall = {
  name: 'web-search',
  version: '1.0.0',
  description: '网络搜索函数',
  category: 'search',
  tags: ['web', 'search'],
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      maxResults: { type: 'number', default: 10 },
    },
    required: ['query'],
  },
  outputSchema: {
    type: 'array',
    items: { type: 'object' },
  },
  async execute(input) {
    // 搜索逻辑
    return { success: true, data: searchResults };
  },
};

// 创建Agent
const searchAgent: AgentDefinition = {
  name: 'search-agent',
  version: '1.0.0',
  description: '搜索Agent',
  type: AgentType.TOOL,
  capabilities: ['web-search', 'data-processing'],
  inputSchema: { type: 'object' },
  outputSchema: { type: 'object' },
  async process(input, context) {
    // 使用搜索函数
    const result = await searchFunction.execute(input.query);
    return result;
  },
};

```

### 错误处理

```typescript
import { ERROR_CODES, getErrorMessage } from '@agent-core';

try {
  // 执行操作
} catch (error) {
  const errorMessage = getErrorMessage(ERROR_CODES.FUNCTION_EXECUTION_ERROR);
  console.error(errorMessage, error);
}
```

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 当前阶段与测试状态（Week 1 / Week 2）

- 已完成：核心接口（function / plugin / agent / memory / registry）、类型与常量导出；Jest（ESM + ts-jest）配置。
- 单元测试：7/7 通过（85/85）。
- 说明：`registry` 相关测试在此阶段仅验证“接口方法存在性”，使用最小 mock 实现对象；真实注册中心实现将在 Week 3 引入并补充集成测试。

## 📚 开发指南

### 添加新接口

1. 在 `interfaces/` 目录下创建新的接口文件
2. 在 `types/` 目录下添加相关的类型定义
3. 在 `constants/` 目录下添加相关常量
4. 更新 `index.ts` 导出新接口
5. 添加相应的测试用例


### 版本管理

- 遵循语义化版本控制
- 接口变更需要版本升级
- 保持向后兼容性

## 🤝 贡献

欢迎贡献代码和建议！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

ISC License
