/**
 * 模型服务接口
 */

import type { Message, Result } from '../types/common.js';

export interface ModelConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  maxRetries?: number;
}

export interface IModel {
  /**
   * 生成回复
   */
  generate(
    messages: Message[],
    config?: Partial<ModelConfig>
  ): Promise<Result<string>>;

  /**
   * 检查模型是否可用
   */
  isAvailable(): Promise<boolean>;

  /**
   * 获取模型信息
   */
  getInfo(): {
    name: string;
    provider: string;
    capabilities: string[];
  };
}
