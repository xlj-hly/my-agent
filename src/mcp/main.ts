import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getAgentRunner } from './handlers/agentRun.js';
import { handleAgentReset } from './handlers/agentReset.js';
import dotenv from 'dotenv';

dotenv.config();

// 创建MCP服务器
const server = new Server(
  {
    name: 'my-agent-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册agent运行工具
server.setRequestHandler('tools/call' as any, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'agent_run': {
        const { input } = args as { input: string };
        if (!input) {
          throw new Error('缺少必需参数: input');
        }

        const runner = await getAgentRunner();
        const result = await runner.run(input);

        return {
          content: [
            {
              type: 'text' as const,
              text: result,
            },
          ],
        };
      }

      case 'agent_reset': {
        const result = await handleAgentReset();
        return {
          content: [
            {
              type: 'text' as const,
              text: result,
            },
          ],
        };
      }

      case 'agent_status': {
        const runner = await getAgentRunner();
        const status = runner.getStatus();

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error(`工具调用失败 [${name}]:`, errorMessage);

    return {
      content: [
        {
          type: 'text' as const,
          text: `错误: ${errorMessage}`,
        },
      ],
    };
  }
});

// 注册工具列表
server.setRequestHandler('tools/list' as any, async () => {
  return {
    tools: [
      {
        name: 'agent_run',
        description: '运行AI Agent处理用户输入，支持ReAct循环和工具调用',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: '用户输入的任务或问题',
            },
          },
          required: ['input'],
        },
      },
      {
        name: 'agent_reset',
        description: '重置Agent会话，清除对话历史和状态',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'agent_status',
        description: '获取Agent当前状态信息',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，正在关闭...');
  try {
    const runner = await getAgentRunner();
    await runner.cleanup();
  } catch (error) {
    console.error('清理资源时出错:', error);
  }
  process.exit(0);
});

// 启动服务器
async function main() {
  try {
    console.log('启动My Agent MCP服务器...');

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log('My Agent MCP服务器已启动，等待连接...');
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
