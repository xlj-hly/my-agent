/**
 * MCP适配器 - 为MCP服务提供Agent功能
 * 替代原来的AgentRunner，消除重复代码
 */

import { AgentCore } from '../services/AgentCore.js';
import { ModelService } from '../services/ModelService.js';
import { MemoryService } from '../services/MemoryService.js';
import { ToolService } from '../services/ToolService.js';
import { DateTimeTool } from '../tools/adapters/DateTimeTool.js';
import { CalculatorTool } from '../tools/adapters/CalculatorTool.js';
import { SystemInfoTool } from '../tools/adapters/SystemInfoTool.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { BaseTool } from '../core/base/BaseTool.js';
import type { Result } from '../core/types/common.js';
import fs from 'fs/promises';
import path from 'path';

export interface MCPServerConfig {
  command: string;
  args: string[];
  type: 'stdio';
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

/**
 * MCP工具包装器
 */
class MCPToolWrapper extends BaseTool {
  constructor(
    private client: Client,
    private toolName: string,
    toolDescription: string,
    parameters: any
  ) {
    super({
      name: toolName,
      description: toolDescription,
      category: 'mcp',
      parameters,
    });
  }

  async execute(args: Record<string, any>): Promise<Result> {
    try {
      const result = await this.client.callTool({
        name: this.toolName,
        arguments: args,
      });

      if (
        result.content &&
        Array.isArray(result.content) &&
        result.content.length > 0
      ) {
        const content = result.content
          .map((c: any) => (c.type === 'text' ? c.text : JSON.stringify(c)))
          .join('\n');

        return this.createResult(true, content);
      }

      return this.createResult(true, '工具执行完成，但无返回内容');
    } catch (error) {
      return this.createResult(
        false,
        undefined,
        `MCP工具调用失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }
}

export class MCPAdapter {
  private agent: AgentCore;
  private mcpClients: Map<string, Client> = new Map();
  private toolService: ToolService;

  constructor() {
    // 创建依赖服务
    const modelService = new ModelService({
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
    });

    const memoryService = new MemoryService({
      maxMessages: 20,
      maxToolCalls: 10,
    });

    this.toolService = new ToolService();

    // 创建Agent核心
    this.agent = new AgentCore(
      {
        model: modelService,
        memory: memoryService,
        toolManager: this.toolService,
      },
      {
        maxRounds: 8, // MCP模式支持更多推理轮数
        enableLogging: true,
      }
    );
  }

  /**
   * 初始化MCP连接和工具
   */
  async initialize(): Promise<void> {
    console.log('初始化MCP适配器...');

    try {
      // 注册内置工具
      this.toolService.registerMultiple([
        new DateTimeTool(),
        new CalculatorTool(),
        new SystemInfoTool(),
      ]);

      // 读取MCP配置
      const configPath = path.join(process.cwd(), 'src/mcp/mcp.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config: MCPConfig = JSON.parse(configContent);

      // 连接到每个MCP服务器
      for (const [serverName, serverConfig] of Object.entries(
        config.mcpServers
      )) {
        await this.connectToMCPServer(serverName, serverConfig);
      }

      console.log(
        `MCP适配器初始化完成，总工具数: ${this.toolService.getNames().length}`
      );
    } catch (error) {
      console.error('MCP适配器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 连接到MCP服务器并注册工具
   */
  private async connectToMCPServer(
    serverName: string,
    config: MCPServerConfig
  ): Promise<void> {
    try {
      console.log(`连接到MCP服务器: ${serverName}`);

      // 创建传输层
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
      });

      // 创建客户端
      const client = new Client(
        {
          name: `my-agent-${serverName}`,
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      // 连接
      await client.connect(transport);
      this.mcpClients.set(serverName, client);

      // 获取可用工具
      const toolsResult = await client.listTools();

      for (const tool of toolsResult.tools) {
        const toolName = `${serverName}_${tool.name}`;
        const mcpTool = new MCPToolWrapper(
          client,
          tool.name,
          `[${serverName}] ${tool.description}`,
          tool.inputSchema || { type: 'object', properties: {} }
        );

        // 重新设置工具名称以包含服务器前缀
        (mcpTool as any).name = toolName;

        this.toolService.register(mcpTool);
      }

      console.log(
        `${serverName} 连接成功，工具: ${toolsResult.tools.map((t) => t.name).join(', ')}`
      );
    } catch (error) {
      console.error(`连接到 ${serverName} 失败:`, error);
      // 不抛出错误，允许其他服务器继续连接
    }
  }

  /**
   * 运行Agent
   */
  async run(input: string): Promise<string> {
    try {
      console.log('MCP Agent处理请求:', input);

      const result = await this.agent.process(input);

      if (result.success && result.data) {
        const agentResponse = result.data;
        console.log('处理完成:', {
          success: agentResponse.success,
          rounds: agentResponse.rounds,
          toolsUsed: agentResponse.toolsUsed,
        });

        return agentResponse.content;
      } else {
        throw new Error(result.error || 'Agent处理失败');
      }
    } catch (error) {
      const errorMessage = `MCP Agent执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(errorMessage);
      return errorMessage;
    }
  }

  /**
   * 重置Agent
   */
  async reset(): Promise<void> {
    this.agent.reset();
    console.log('MCP Agent会话已重置');
  }

  /**
   * 获取状态信息
   */
  getStatus() {
    const session = this.agent.getSession();
    const toolStats = this.toolService.getStats();

    return {
      sessionId: session.sessionId,
      messageCount: session.messages.length,
      toolCallCount: session.toolCalls.length,
      duration: session.updatedAt - session.createdAt,
      mcpServers: Array.from(this.mcpClients.keys()),
      availableTools: this.toolService.getNames(),
      toolStats,
    };
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    console.log('清理MCP适配器资源...');

    // 关闭所有MCP连接
    for (const [serverName, client] of this.mcpClients) {
      try {
        await client.close();
        console.log(`${serverName} 连接已关闭`);
      } catch (error) {
        console.error(`关闭 ${serverName} 连接时出错:`, error);
      }
    }

    this.mcpClients.clear();
    this.toolService.clear();

    console.log('MCP适配器资源清理完成');
  }
}

// 导出单例实例管理
let mcpAdapter: MCPAdapter | null = null;

export async function getMCPAdapter(): Promise<MCPAdapter> {
  if (!mcpAdapter) {
    mcpAdapter = new MCPAdapter();
    await mcpAdapter.initialize();
  }
  return mcpAdapter;
}

export async function resetMCPAgent(): Promise<void> {
  if (mcpAdapter) {
    await mcpAdapter.reset();
  }
}
