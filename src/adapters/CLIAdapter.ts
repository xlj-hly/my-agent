/**
 * CLI适配器 - 为CLI界面提供Agent服务
 * 替代原来的AgentService，消除重复代码
 */

import { AgentCore } from '../services/AgentCore.js';
import { ModelService } from '../services/ModelService.js';
import { MemoryService } from '../services/MemoryService.js';
import { ToolService } from '../services/ToolService.js';
import { DateTimeTool } from '../tools/adapters/DateTimeTool.js';
import { CalculatorTool } from '../tools/adapters/CalculatorTool.js';
import { SystemInfoTool } from '../tools/adapters/SystemInfoTool.js';
// import type { Result } from '../core/types/common.js';

export interface CLIAgentResponse {
  content: string;
  success: boolean;
  error?: string;
  toolsUsed?: string[];
}

export class CLIAdapter {
  private agent: AgentCore;
  private static instance: CLIAdapter | null = null;

  private constructor() {
    // 创建依赖服务
    const modelService = new ModelService({
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 30000,
    });

    const memoryService = new MemoryService({
      maxMessages: 15,
      maxToolCalls: 5,
    });

    const toolService = new ToolService();

    // 注册内置工具
    toolService.registerMultiple([
      new DateTimeTool(),
      new CalculatorTool(),
      new SystemInfoTool(),
    ]);

    // 创建Agent核心
    this.agent = new AgentCore(
      {
        model: modelService,
        memory: memoryService,
        toolManager: toolService,
      },
      {
        maxRounds: 3, // CLI模式下减少推理轮数
        enableLogging: true,
      }
    );
  }

  /**
   * 单例模式，确保CLI只有一个Agent实例
   */
  static getInstance(): CLIAdapter {
    if (!CLIAdapter.instance) {
      CLIAdapter.instance = new CLIAdapter();
    }
    return CLIAdapter.instance;
  }

  /**
   * 处理用户输入
   */
  async chat(userInput: string): Promise<CLIAgentResponse> {
    try {
      const result = await this.agent.process(userInput);

      if (result.success && result.data) {
        const agentResponse = result.data;
        return {
          content: agentResponse.content,
          success: agentResponse.success,
          toolsUsed: agentResponse.toolsUsed,
        };
      } else {
        return {
          content: '抱歉，我现在遇到了一些问题，请稍后再试。',
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      return {
        content: '抱歉，处理过程中出现错误。',
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 重置会话
   */
  reset(): void {
    this.agent.reset();
  }

  /**
   * 获取会话信息
   */
  getSessionInfo() {
    const session = this.agent.getSession();
    return {
      messageCount: session.messages.filter((m) => m.role !== 'system').length,
      duration: session.updatedAt - session.createdAt,
      toolCallCount: session.toolCalls.length,
    };
  }

  /**
   * 检查服务可用性
   */
  static checkAvailability(): { available: boolean; error?: string } {
    const availability = ModelService.checkAvailability();
    return {
      available: availability.success,
      error: availability.error,
    };
  }
}
