/**
 * 记忆服务实现
 */

import { BaseMemory } from '../core/base/BaseMemory.js';
import type { MemoryConfig } from '../core/interfaces/IMemory.js';

export class MemoryService extends BaseMemory {
  constructor(config: MemoryConfig = {}) {
    super(config);
  }

  /**
   * 获取适合模型的消息格式
   */
  getMessagesForModel(limit?: number) {
    return this.getMessages(limit).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * 添加系统消息
   */
  setSystemMessage(content: string): void {
    // 移除现有系统消息
    this.messages = this.messages.filter((m) => m.role !== 'system');

    // 添加新系统消息到开头
    this.messages.unshift({
      id: this.generateId(),
      role: 'system',
      content,
      timestamp: Date.now(),
    });

    this.updatedAt = Date.now();
  }

  /**
   * 获取最近的工具调用
   */
  getRecentToolCalls(limit: number = 5) {
    return this.getToolCalls(limit);
  }

  /**
   * 检查会话是否活跃
   */
  isActive(timeoutMs: number = 30 * 60 * 1000): boolean {
    return Date.now() - this.updatedAt < timeoutMs;
  }


  /**
   * 获取会话统计
   */
  getStats() {
    const userMessages = this.messages.filter((m) => m.role === 'user').length;
    const assistantMessages = this.messages.filter(
      (m) => m.role === 'assistant'
    ).length;
    const systemMessages = this.messages.filter(
      (m) => m.role === 'system'
    ).length;

    return {
      totalMessages: this.messages.length,
      userMessages,
      assistantMessages,
      systemMessages,
      toolCalls: this.toolCalls.length,
      sessionDuration: this.updatedAt - this.createdAt,
      lastActivity: this.updatedAt,
    };
  }
}
