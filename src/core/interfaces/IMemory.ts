/**
 * 记忆服务接口
 */

import type { Message, ToolCall, SessionContext } from '../types/common.js';

export interface MemoryConfig {
  maxMessages?: number;
  maxToolCalls?: number;
  enablePersistence?: boolean;
}

export interface IMemory {
  /**
   * 添加消息
   */
  addMessage(message: Omit<Message, 'id' | 'timestamp'>): void;

  /**
   * 添加工具调用记录
   */
  addToolCall(toolCall: Omit<ToolCall, 'id' | 'timestamp'>): void;

  /**
   * 获取消息历史
   */
  getMessages(limit?: number): Message[];

  /**
   * 获取工具调用历史
   */
  getToolCalls(limit?: number): ToolCall[];

  /**
   * 获取会话上下文
   */
  getContext(): SessionContext;

  /**
   * 清除记忆
   */
  clear(): void;

  /**
   * 获取会话摘要
   */
  getSummary(): string;

  /**
   * 设置系统消息
   */
  setSystemMessage(message: string): void;
}
