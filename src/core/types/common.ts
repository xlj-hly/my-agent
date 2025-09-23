/**
 * 通用类型定义
 */

export interface Result<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  result?: Result;
  timestamp: number;
}

export interface AgentConfig {
  maxRounds?: number;
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
  enableLogging?: boolean;
}

export interface SessionContext {
  sessionId: string;
  messages: Message[];
  toolCalls: ToolCall[];
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}
