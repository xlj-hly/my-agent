/**
 * 记忆接口定义
 * 定义系统中所有记忆策略的标准接口
 */

export enum MemoryType {
  CENTRALIZED = 'centralized',
  DISTRIBUTED = 'distributed',
  HYBRID = 'hybrid',
}

export interface MemoryMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'system' | 'function';
  timestamp: number;
  agentId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface MessageFilter {
  agentId?: string;
  sessionId?: string;
  type?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}

export interface MemoryContext {
  sessionId: string;
  agentId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  agentId?: string;
  userId?: string;
  createdAt: number;
  lastActivity: number;
  metadata?: Record<string, any>;
}

export interface MemoryStats {
  totalMessages: number;
  totalSessions: number;
  averageMessageLength: number;
  memoryUsage: number;
  lastCleanup?: number;
}

/**
 * 记忆接口
 * 所有记忆实现都必须实现此接口
 */
export interface IMemory {
  addMessage(message: MemoryMessage): Promise<void>;
  getMessages(filter?: MessageFilter): Promise<MemoryMessage[]>;
  updateMessage(id: string, message: Partial<MemoryMessage>): Promise<void>;
  deleteMessage(id: string): Promise<void>;
  getContext(): Promise<MemoryContext>;
  setContext(context: MemoryContext): Promise<void>;
  createSession(): Promise<string>;
  getSession(sessionId: string): Promise<Session>;
  deleteSession(sessionId: string): Promise<void>;
  clear(): Promise<void>;
  cleanup(): Promise<void>;
  getStats(): Promise<MemoryStats>;
}

export interface MemoryConfig {
  type: MemoryType;
  maxMessages?: number;
  maxSessions?: number;
  cleanupInterval?: number;
  storage?: any;
  [key: string]: any;
}

/**
 * 记忆策略接口
 * 定义记忆系统的不同实现策略
 */
export interface MemoryStrategy {
  readonly type: MemoryType;
  readonly name: string;
  readonly description: string;
  readonly initialize: (config: MemoryConfig) => Promise<void>;
  readonly createMemory: (config: MemoryConfig) => Promise<IMemory>;
  readonly destroy: () => Promise<void>;
}
