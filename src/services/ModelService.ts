/**
 * OpenAI模型服务实现
 */

import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  BaseMessage,
} from '@langchain/core/messages';
import { BaseModel } from '../core/base/BaseModel.js';
import type { ModelConfig } from '../core/interfaces/IModel.js';
import type { Message, Result } from '../core/types/common.js';
import dotenv from 'dotenv';

dotenv.config();

export class ModelService extends BaseModel {
  private llm: ChatOpenAI;

  constructor(config: ModelConfig = {}) {
    super(config);

    this.llm = new ChatOpenAI({
      apiKey: process.env.SILICONFLOW_API_KEY,
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      configuration: {
        baseURL: process.env.SILICONFLOW_BASE_URL,
      },
    });
  }

  async generate(
    messages: Message[],
    config?: Partial<ModelConfig>
  ): Promise<Result<string>> {
    try {
      const mergedConfig = { ...this.config, ...config };

      // 转换消息格式
      const langchainMessages = this.convertMessages(messages);

      // 更新配置
      if (config) {
        this.updateLLMConfig(mergedConfig);
      }

      const response = await this.llm.invoke(langchainMessages);

      return this.createResult(true, response.content as string);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '模型调用失败';
      return this.createResult(false, '', errorMessage);
    }
  }

  getInfo() {
    return {
      name: this.config.model,
      provider: 'OpenAI Compatible',
      capabilities: ['chat', 'completion', 'streaming'],
    };
  }

  private convertMessages(messages: Message[]): BaseMessage[] {
    return messages.map((msg) => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        default:
          throw new Error(`Unknown message role: ${msg.role}`);
      }
    });
  }

  private updateLLMConfig(config: ModelConfig): void {
    // 创建新的LLM实例（LangChain不支持动态配置更新）
    this.llm = new ChatOpenAI({
      apiKey: process.env.SILICONFLOW_API_KEY,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      configuration: {
        baseURL: process.env.SILICONFLOW_BASE_URL,
      },
    });
  }

  /**
   * 检查服务可用性
   */
  static checkAvailability(): Result<boolean> {
    const requiredEnvVars = [
      'SILICONFLOW_API_KEY',
      'SILICONFLOW_MODEL',
      'SILICONFLOW_BASE_URL',
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        return {
          success: false,
          data: false,
          error: `缺少环境变量: ${envVar}`,
        };
      }
    }

    return {
      success: true,
      data: true,
    };
  }
}
