# My Agent - MCP智能代理

一个基于MCP (Model Context Protocol) 的智能代理系统，实现了ReAct (Reasoning and Acting) 循环，能够通过工具调用完成复杂任务。

## 特性

- **ReAct循环**: 思考 → 行动 → 观察的智能决策流程
- **MCP工具集成**: 支持连接多个MCP服务器和工具
- **会话记忆**: 自动管理对话历史和上下文
- **错误恢复**: 工具调用失败时的重试和降级机制
- **资源控制**: 循环次数限制、超时控制、成本管理
- **结构化日志**: 完整的执行过程追踪

## 架构组件

```
src/mcp/
├── agent.ts              # Agent核心类，ReAct循环实现
├── models/
│   └── openai.ts         # OpenAI模型封装，支持重试
├── memory/
│   └── sessionMemory.ts  # 会话记忆管理
├── prompts/
│   └── chat.ts           # 系统提示词模板
├── handlers/
│   ├── agentRun.ts       # Agent运行器和MCP集成
│   └── agentReset.ts     # 会话重置处理
├── main.ts               # MCP服务器入口
├── mcp.json              # MCP服务器配置
└── test.ts               # 测试脚本
```

## 快速开始

### 1. 环境配置

创建 `.env` 文件：

```bash
# OpenAI API配置
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_MODEL=gpt-3.5-turbo
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
```

### 2. 安装依赖

```bash
npm install
```

### 3. 构建项目

```bash
npm run build
```

### 4. 测试Agent

```bash
node dist/mcp/test.js
```

### 5. 运行MCP服务器

```bash
node dist/mcp/main.js
```

## 使用方式

### 作为MCP工具使用

1. 启动MCP服务器：
```bash
node dist/mcp/main.js
```

2. 在支持MCP的客户端中连接：
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

3. 使用可用工具：
- `agent_run`: 运行Agent处理任务
- `agent_reset`: 重置会话
- `agent_status`: 查看状态

### 直接编程使用

```typescript
import { getAgentRunner } from './handlers/agentRun.js';

const runner = await getAgentRunner();
const response = await runner.run('请帮我分析一下人工智能的发展趋势');
console.log(response);
```

## 配置说明

### Agent配置

```typescript
const agent = new Agent({
  model: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 30000,
    maxRetries: 3
  },
  prompt: {
    maxRounds: 10,
    toolTimeout: 30000,
    language: 'zh-CN'
  },
  maxMemoryMessages: 20,
  maxMemoryTools: 10,
  enableLogging: true
});
```

### MCP服务器配置 (mcp.json)

```json
{
  "mcpServers": {
    "context7": {
      "command": "node",
      "type": "stdio", 
      "args": ["path/to/context7-mcp/dist/index.js"]
    },
    "sequential-thinking": {
      "command": "node",
      "type": "stdio",
      "args": ["path/to/sequential-thinking/dist/index.js"]
    }
  }
}
```

## 工作原理

### ReAct循环

1. **思考 (Think)**: 分析当前情况，规划下一步行动
2. **行动 (Act)**: 选择工具调用或给出答案
3. **观察 (Observe)**: 分析结果，决定是否继续

### 安全机制

- **循环限制**: 最多10轮思考，防止无限循环
- **超时控制**: 每个工具调用30秒超时
- **失败恢复**: 连续失败3次后降级为文本回答
- **资源清理**: 优雅关闭时清理所有MCP连接

### 记忆管理

- 自动保持最近20条消息
- 保留系统消息，清理历史对话
- 工具调用历史记录
- 上下文摘要生成

## 扩展开发

### 添加自定义工具

```typescript
agent.registerTool({
  name: 'custom_tool',
  description: '自定义工具描述',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    }
  },
  handler: async (args) => {
    // 工具实现
    return '工具执行结果';
  }
});
```

### 自定义提示词

```typescript
const prompts = new ChatPrompts({
  maxRounds: 15,
  toolTimeout: 60000,
  language: 'en'
});
```

## 故障排除

### 常见问题

1. **API密钥错误**: 检查 `.env` 文件中的API配置
2. **MCP连接失败**: 确认MCP服务器路径和权限
3. **工具调用超时**: 调整 `toolTimeout` 配置
4. **内存不足**: 减少 `maxMemoryMessages` 数量

### 调试模式

启用详细日志：
```typescript
const agent = new Agent({ enableLogging: true });
```

查看MCP连接状态：
```bash
node -e "
import('./dist/mcp/handlers/agentRun.js').then(m => 
  m.getAgentRunner().then(r => console.log(r.getStatus()))
)"
```

## 许可证

ISC License
