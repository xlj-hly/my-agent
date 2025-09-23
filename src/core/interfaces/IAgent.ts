/**
 * Agent核心接口
 */

import type { Result, AgentConfig, SessionContext } from '../types/common.js';

export interface AgentResponse {
  content: string;
  success: boolean;
  rounds: number;
  toolsUsed: string[];
  error?: string;
  metadata?: Record<string, any>;
}

export interface IAgent {
  /**
   * 处理用户输入
   */
  process(input: string): Promise<Result<AgentResponse>>;

  /**
   * 重置会话
   */
  reset(): void;

  /**
   * 获取会话信息
   */
  getSession(): SessionContext;

  /**
   * 获取配置
   */
  getConfig(): AgentConfig;

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AgentConfig>): void;

  /**
   * 检查Agent是否就绪
   */
  isReady(): boolean;
}
