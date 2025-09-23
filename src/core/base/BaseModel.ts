/**
 * 模型服务基础类
 */

import type { IModel, ModelConfig } from '../interfaces/IModel.js';
import type { Message, Result } from '../types/common.js';

export abstract class BaseModel implements IModel {
  protected config: Required<ModelConfig>;

  constructor(config: ModelConfig = {}) {
    this.config = {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };
  }

  abstract generate(
    messages: Message[],
    config?: Partial<ModelConfig>
  ): Promise<Result<string>>;

  async isAvailable(): Promise<boolean> {
    try {
      // 简单的健康检查
      const testMessages: Message[] = [
        {
          id: 'test',
          role: 'user',
          content: 'test',
          timestamp: Date.now(),
        },
      ];

      const result = await this.generate(testMessages, { maxTokens: 1 });
      return result.success;
    } catch {
      return false;
    }
  }

  abstract getInfo(): {
    name: string;
    provider: string;
    capabilities: string[];
  };

  protected createResult<T>(
    success: boolean,
    data?: T,
    error?: string
  ): Result<T> {
    return {
      success,
      data,
      error,
      metadata: {
        model: this.config.model,
        timestamp: Date.now(),
      },
    };
  }
}
