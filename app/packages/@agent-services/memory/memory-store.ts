/**
 * 记忆存储服务实现
 * 提供记忆数据的存储、检索、更新和删除功能
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';

// 记忆消息接口
export interface MemoryMessage {
  id: string;
  content: string;
  timestamp: number;
  agentId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// 消息过滤器接口
export interface MessageFilter {
  agentId?: string;
  sessionId?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}

// 记忆上下文接口
export interface MemoryContext {
  currentSessionId?: string;
  activeAgentId?: string;
  contextData?: Record<string, any>;
}

// 会话接口
export interface Session {
  id: string;
  agentId?: string;
  createdAt: number;
  lastAccessedAt: number;
  metadata?: Record<string, any>;
}

// 记忆统计接口
export interface MemoryStats {
  totalMessages: number;
  totalSessions: number;
  memoryUsage: number;
  lastCleanup?: number;
}

// 记忆配置接口
export interface MemoryConfig {
  maxMessages?: number;
  maxSessions?: number;
  cleanupInterval?: number;
  storageType?: 'memory' | 'persistent';
  encryptionKey?: string;
}

// 记忆操作输入接口
export interface MemoryStoreInput {
  operation: string; // 'add', 'get', 'update', 'delete', 'clear', 'stats', 'cleanup'
  message?: MemoryMessage;
  messageId?: string;
  filter?: MessageFilter;
  context?: MemoryContext;
  config?: MemoryConfig;
}

// 记忆操作输出接口
export interface MemoryStoreOutput {
  messages?: MemoryMessage[];
  message?: MemoryMessage;
  context?: MemoryContext;
  stats?: MemoryStats;
  success?: boolean;
  count?: number;
}

/**
 * 记忆存储函数
 * 实现记忆数据的CRUD操作和统计功能
 */
export const memoryStoreFunction: FunctionCall<MemoryStoreInput, MemoryStoreOutput> = {
  name: 'memory-store',
  version: '1.0.0',
  description: '记忆存储服务，提供记忆数据的存储、检索、更新和删除功能',
  category: 'memory',
  tags: ['memory', 'storage', 'crud'],
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'get', 'update', 'delete', 'clear', 'stats', 'cleanup'],
        description: '要执行的操作'
      },
      message: {
        type: 'object',
        nullable: true,
        description: '记忆消息（用于add和update操作）'
      },
      messageId: {
        type: 'string',
        nullable: true,
        description: '消息ID（用于update和delete操作）'
      },
      filter: {
        type: 'object',
        nullable: true,
        description: '消息过滤器（用于get操作）'
      },
      context: {
        type: 'object',
        nullable: true,
        description: '记忆上下文（用于context相关操作）'
      },
      config: {
        type: 'object',
        nullable: true,
        description: '记忆配置（用于配置相关操作）'
      }
    },
    required: ['operation'],
    oneOf: [
      { properties: { operation: { const: 'add' }, message: { type: 'object' } }, required: ['message'] },
      { properties: { operation: { const: 'update' }, messageId: { type: 'string' }, message: { type: 'object' } }, required: ['messageId', 'message'] },
      { properties: { operation: { const: 'delete' }, messageId: { type: 'string' } }, required: ['messageId'] },
      { properties: { operation: { const: 'get' }, filter: { type: 'object' } }, required: ['filter'] }
    ]
  },
  outputSchema: {
    type: 'object',
    properties: {
      messages: {
        type: 'array',
        items: { type: 'object' },
        nullable: true
      },
      message: {
        type: 'object',
        nullable: true
      },
      context: {
        type: 'object',
        nullable: true
      },
      stats: {
        type: 'object',
        nullable: true
      },
      success: {
        type: 'boolean',
        nullable: true
      },
      count: {
        type: 'number',
        nullable: true
      }
    }
  },
  validate: (input: MemoryStoreInput): ValidationResult => {
    if (input.operation === 'add' && !input.message) {
      return { valid: false, errors: ['Message is required for add operation.'] };
    }
    if (input.operation === 'update' && (!input.messageId || !input.message)) {
      return { valid: false, errors: ['MessageId and message are required for update operation.'] };
    }
    if (input.operation === 'delete' && !input.messageId) {
      return { valid: false, errors: ['MessageId is required for delete operation.'] };
    }
    if (input.operation === 'get' && !input.filter) {
      return { valid: false, errors: ['Filter is required for get operation.'] };
    }
    return { valid: true };
  },
  execute: async (
    input: MemoryStoreInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<MemoryStoreOutput>> => {
    const startTime = Date.now();

    try {
      const result = await performMemoryOperation(input);
      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          executionTime: Date.now() - startTime
        },
        executionTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
};

// 内存存储实现（简化版本，实际应用中可使用数据库）
class InMemoryStore {
  private messages: Map<string, MemoryMessage> = new Map();
  private sessions: Map<string, Session> = new Map();
  private context: MemoryContext = {};
  private config: MemoryConfig = {
    maxMessages: 10000,
    maxSessions: 1000,
    cleanupInterval: 3600000 // 1小时
  };

  async addMessage(message: MemoryMessage): Promise<void> {
    // 检查消息数量限制
    if (this.messages.size >= (this.config.maxMessages || 10000)) {
      await this.cleanupOldMessages();
    }
    this.messages.set(message.id, message);
  }

  async getMessages(filter: MessageFilter): Promise<MemoryMessage[]> {
    let results = Array.from(this.messages.values());

    // 应用过滤器
    if (filter.agentId) {
      results = results.filter(msg => msg.agentId === filter.agentId);
    }
    if (filter.sessionId) {
      results = results.filter(msg => msg.sessionId === filter.sessionId);
    }
    if (filter.startTime) {
      results = results.filter(msg => msg.timestamp >= filter.startTime!);
    }
    if (filter.endTime) {
      results = results.filter(msg => msg.timestamp <= filter.endTime!);
    }

    // 排序（按时间戳降序）
    results.sort((a, b) => b.timestamp - a.timestamp);

    // 应用分页
    if (filter.offset) {
      results = results.slice(filter.offset);
    }
    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  async updateMessage(messageId: string, message: Partial<MemoryMessage>): Promise<MemoryMessage | null> {
    const existingMessage = this.messages.get(messageId);
    if (!existingMessage) {
      return null;
    }

    const updatedMessage = { ...existingMessage, ...message };
    this.messages.set(messageId, updatedMessage);
    return updatedMessage;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    return this.messages.delete(messageId);
  }

  async clearMessages(): Promise<number> {
    const count = this.messages.size;
    this.messages.clear();
    return count;
  }

  async getContext(): Promise<MemoryContext> {
    return { ...this.context };
  }

  async setContext(context: MemoryContext): Promise<void> {
    this.context = { ...this.context, ...context };
  }

  async createSession(agentId?: string): Promise<Session> {
    const session: Session = {
      id: generateId(),
      agentId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessedAt = Date.now();
      this.sessions.set(sessionId, session);
    }
    return session || null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async getStats(): Promise<MemoryStats> {
    return {
      totalMessages: this.messages.size,
      totalSessions: this.sessions.size,
      memoryUsage: this.messages.size * 100 + this.sessions.size * 50, // 估算内存使用
      lastCleanup: Date.now()
    };
  }

  async cleanup(): Promise<number> {
    const cleaned = await this.cleanupOldMessages();
    await this.cleanupOldSessions();
    return cleaned;
  }

  private async cleanupOldMessages(): Promise<number> {
    const messages = Array.from(this.messages.values());
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    const toDelete = Math.max(0, messages.length - (this.config.maxMessages || 10000) * 0.8);
    for (let i = 0; i < toDelete; i++) {
      this.messages.delete(messages[i].id);
    }
    
    return toDelete;
  }

  private async cleanupOldSessions(): Promise<number> {
    const sessions = Array.from(this.sessions.values());
    sessions.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
    
    const cutoffTime = Date.now() - (this.config.cleanupInterval || 3600000);
    const toDelete = sessions.filter(session => session.lastAccessedAt < cutoffTime);
    
    for (const session of toDelete) {
      this.sessions.delete(session.id);
    }
    
    return toDelete.length;
  }

  updateConfig(config: MemoryConfig): void {
    this.config = { ...this.config, ...config };
  }
}

// 全局存储实例
const memoryStore = new InMemoryStore();

/**
 * 执行记忆操作
 */
async function performMemoryOperation(input: MemoryStoreInput): Promise<MemoryStoreOutput> {
  switch (input.operation) {
    case 'add':
      if (!input.message) throw new Error('Message is required for add operation');
      await memoryStore.addMessage(input.message);
      return { success: true, message: input.message };

    case 'get': {
      if (!input.filter) throw new Error('Filter is required for get operation');
      const messages = await memoryStore.getMessages(input.filter);
      return { messages, count: messages.length };
    }

    case 'update': {
      if (!input.messageId || !input.message) throw new Error('MessageId and message are required for update operation');
      const updatedMessage = await memoryStore.updateMessage(input.messageId, input.message);
      if (!updatedMessage) throw new Error('Message not found');
      return { success: true, message: updatedMessage };
    }

    case 'delete': {
      if (!input.messageId) throw new Error('MessageId is required for delete operation');
      const deleted = await memoryStore.deleteMessage(input.messageId);
      return { success: deleted };
    }

    case 'clear': {
      const clearedCount = await memoryStore.clearMessages();
      return { success: true, count: clearedCount };
    }

    case 'stats': {
      const stats = await memoryStore.getStats();
      return { stats };
    }

    case 'cleanup': {
      const cleanedCount = await memoryStore.cleanup();
      return { success: true, count: cleanedCount };
    }

    default:
      throw new Error(`Unsupported operation: ${input.operation}`);
  }
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
