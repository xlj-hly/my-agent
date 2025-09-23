/**
 * 记忆服务基础类
 */

import type { IMemory, MemoryConfig } from '../interfaces/IMemory.js';
import type { Message, ToolCall, SessionContext } from '../types/common.js';

export abstract class BaseMemory implements IMemory {
  protected config: Required<MemoryConfig>;
  protected sessionId: string;
  protected messages: Message[] = [];
  protected toolCalls: ToolCall[] = [];
  protected metadata: Record<string, any> = {};
  protected createdAt: number;
  protected updatedAt: number;

  constructor(config: MemoryConfig = {}) {
    this.config = {
      maxMessages: 50,
      maxToolCalls: 20,
      enablePersistence: false,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  addMessage(message: Omit<Message, 'id' | 'timestamp'>): void {
    const fullMessage: Message = {
      ...message,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.messages.push(fullMessage);
    this.trimMessages();
    this.updatedAt = Date.now();
  }

  addToolCall(toolCall: Omit<ToolCall, 'id' | 'timestamp'>): void {
    const fullToolCall: ToolCall = {
      ...toolCall,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.toolCalls.push(fullToolCall);
    this.trimToolCalls();
    this.updatedAt = Date.now();
  }

  getMessages(limit?: number): Message[] {
    const messages = [...this.messages];
    return limit ? messages.slice(-limit) : messages;
  }

  getToolCalls(limit?: number): ToolCall[] {
    const toolCalls = [...this.toolCalls];
    return limit ? toolCalls.slice(-limit) : toolCalls;
  }

  getContext(): SessionContext {
    return {
      sessionId: this.sessionId,
      messages: this.getMessages(),
      toolCalls: this.getToolCalls(),
      metadata: { ...this.metadata },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  clear(): void {
    // 保留系统消息
    this.messages = this.messages.filter((m) => m.role === 'system');
    this.toolCalls = [];
    this.metadata = {};
    this.updatedAt = Date.now();
  }

  getSummary(): string {
    const messageCount = this.messages.filter(
      (m) => m.role !== 'system'
    ).length;
    const toolCallCount = this.toolCalls.length;
    const duration = Math.round((this.updatedAt - this.createdAt) / 1000 / 60);

    return `会话时长: ${duration}分钟, 消息数: ${messageCount}, 工具调用: ${toolCallCount}`;
  }

  setSystemMessage(message: string): void {
    // 移除现有的系统消息
    this.messages = this.messages.filter(m => m.role !== 'system');
    
    // 添加新的系统消息到开头
    this.addMessage({
      role: 'system',
      content: message,
    });
    
    // 将系统消息移到开头
    const systemMsg = this.messages.pop();
    if (systemMsg) {
      this.messages.unshift(systemMsg);
    }
  }

  protected trimMessages(): void {
    if (this.messages.length > this.config.maxMessages) {
      // 保留系统消息
      const systemMessages = this.messages.filter((m) => m.role === 'system');
      const otherMessages = this.messages.filter((m) => m.role !== 'system');

      const keepCount = this.config.maxMessages - systemMessages.length;
      const recentMessages = otherMessages.slice(-keepCount);

      this.messages = [...systemMessages, ...recentMessages];
    }
  }

  protected trimToolCalls(): void {
    if (this.toolCalls.length > this.config.maxToolCalls) {
      this.toolCalls = this.toolCalls.slice(-this.config.maxToolCalls);
    }
  }

  protected generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
