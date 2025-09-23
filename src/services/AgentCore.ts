/**
 * Agent核心服务 - 统一的Agent实现
 * 消除重复代码，提供可扩展的Agent基础
 */

import type { IAgent, AgentResponse } from '../core/interfaces/IAgent.js';
import type { IModel } from '../core/interfaces/IModel.js';
import type { IMemory } from '../core/interfaces/IMemory.js';
import type { IToolManager } from '../core/interfaces/ITool.js';
import type {
  Result,
  AgentConfig,
  SessionContext,
} from '../core/types/common.js';

export interface AgentDependencies {
  model: IModel;
  memory: IMemory;
  toolManager: IToolManager;
}

export class AgentCore implements IAgent {
  private model: IModel;
  private memory: IMemory;
  private toolManager: IToolManager;
  private config: Required<AgentConfig>;
  private isInitialized: boolean = false;

  constructor(dependencies: AgentDependencies, config: AgentConfig = {}) {
    this.model = dependencies.model;
    this.memory = dependencies.memory;
    this.toolManager = dependencies.toolManager;

    this.config = {
      maxRounds: 10,
      timeout: 30000,
      temperature: 0.7,
      maxTokens: 2000,
      enableLogging: true,
      ...config,
    };
  }

  async process(input: string): Promise<Result<AgentResponse>> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Agent未就绪，请检查依赖服务',
      };
    }

    this.ensureInitialized();

    // const startTime = Date.now();
    let rounds = 0;
    const toolsUsed: string[] = [];

    try {
      // 添加用户消息
      this.memory.addMessage({
        role: 'user',
        content: input,
      });

      // ReAct循环
      while (rounds < this.config.maxRounds) {
        rounds++;
        this.log(`开始第 ${rounds} 轮推理`);

        // 获取消息历史
        const messages = this.memory.getMessages();

        // 调用模型
        const modelResult = await this.model.generate(messages, {
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        });

        if (!modelResult.success) {
          throw new Error(`模型调用失败: ${modelResult.error}`);
        }

        const response = modelResult.data!;

        // 检查是否需要使用工具
        const toolCall = this.parseToolCall(response);

        if (!toolCall) {
          // 没有工具调用，认为是最终答案
          this.memory.addMessage({
            role: 'assistant',
            content: response,
          });

          return {
            success: true,
            data: {
              content: response,
              success: true,
              rounds,
              toolsUsed,
            },
          };
        }

        // 执行工具调用
        const { toolName, args } = toolCall;
        this.log(`执行工具: ${toolName}`, args);

        const toolResult = await this.toolManager.execute(toolName, args);

        // 记录工具调用
        this.memory.addToolCall({
          name: toolName,
          args,
          result: toolResult,
        });

        if (toolResult.success) {
          toolsUsed.push(toolName);

          // 将工具结果添加到对话中
          const toolResultMessage = `工具 "${toolName}" 执行结果：\n${toolResult.data}`;
          this.memory.addMessage({
            role: 'user',
            content: toolResultMessage,
          });
        } else {
          // 工具执行失败，让模型知道
          const errorMessage = `工具 "${toolName}" 执行失败：${toolResult.error}`;
          this.memory.addMessage({
            role: 'user',
            content: errorMessage,
          });
        }
      }

      // 达到最大轮数限制
      const finalMessages = this.memory.getMessages();
      finalMessages.push({
        id: 'final_prompt',
        role: 'user',
        content: `已达到最大推理轮数 (${this.config.maxRounds})，请基于目前掌握的信息给出最终答案。`,
        timestamp: Date.now(),
      });

      const finalResult = await this.model.generate(finalMessages);

      if (finalResult.success) {
        this.memory.addMessage({
          role: 'assistant',
          content: finalResult.data!,
        });
      }

      return {
        success: false,
        data: {
          content: finalResult.data || '抱歉，无法完成任务',
          success: false,
          rounds,
          toolsUsed,
          error: '达到最大推理轮数限制',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.log(`Agent执行错误: ${errorMessage}`);

      return {
        success: false,
        data: {
          content: '抱歉，处理过程中出现错误',
          success: false,
          rounds,
          toolsUsed,
          error: errorMessage,
        },
        error: errorMessage,
      };
    }
  }

  reset(): void {
    this.memory.clear();
    this.isInitialized = false;
    this.log('Agent会话已重置');
  }

  getSession(): SessionContext {
    return this.memory.getContext();
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<AgentConfig>): void {
    Object.assign(this.config, config);
    this.log('Agent配置已更新', config);
  }

  isReady(): boolean {
    return (
      this.model !== undefined &&
      this.memory !== undefined &&
      this.toolManager !== undefined
    );
  }

  private ensureInitialized(): void {
    if (this.isInitialized) return;

    // 设置系统提示词
    const systemPrompt = this.createSystemPrompt();
    this.memory.setSystemMessage(systemPrompt);

    this.isInitialized = true;
    this.log('Agent已初始化');
  }

  private createSystemPrompt(): string {
    const toolDescriptions = this.toolManager.getDescriptions();
    const toolList =
      toolDescriptions.length > 0
        ? `\n可用工具:\n${toolDescriptions.map((desc) => `- ${desc}`).join('\n')}`
        : '';

    return `你是一个智能助手，能够通过工具调用来完成用户的任务。

## 工作原则
1. **够用优先**: 选择最简单有效的方案
2. **工具优先**: 当需要实时信息或计算时，优先使用工具
3. **简洁明了**: 回答要简洁有用，避免冗长
4. **循环限制**: 最多进行 ${this.config.maxRounds} 轮推理

## 工具调用格式
当需要使用工具时，请在回答中包含：**使用工具: 工具名称(参数)**

例如：
- 询问时间：**使用工具: get_current_datetime({"format": "full"})**
- 计算问题：**使用工具: calculator({"expression": "2+3*4"})**${toolList}

请根据用户需求智能选择合适的工具，或直接给出答案。`;
  }

  private parseToolCall(
    response: string
  ): { toolName: string; args: Record<string, any> } | null {
    const toolCallPattern = /\*\*使用工具:\s*(\w+)\s*\(([^)]*)\)\*\*/;
    const match = response.match(toolCallPattern);

    if (match) {
      const toolName = match[1];
      let args = {};

      try {
        if (match[2].trim()) {
          args = JSON.parse(match[2]);
        }
      } catch (error) {
        this.log(`解析工具参数失败: ${match[2]}`, error);
      }

      return { toolName, args };
    }

    return null;
  }

  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] AgentCore: ${message}`, data || '');
    }
  }
}
