/**
 * Agent接口定义
 * 定义系统中所有Agent的标准接口
 */

import { JSONSchema, ExecutionContext } from './function.interface.js';

export enum AgentType {
  DECISION = 'decision',
  EXPERT = 'expert',
  TOOL = 'tool',
  COORDINATOR = 'coordinator',
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
  executionTime?: number;
  memoryUsage?: number;
  functionsUsed?: string[];
  agentsUsed?: string[];
}

export interface AgentStatus {
  name: string;
  type: AgentType;
  status: 'idle' | 'busy' | 'error' | 'offline';
  capabilities: string[];
  lastActivity?: number;
  metadata?: Record<string, any>;
}

/**
 * Agent定义接口
 * 系统中所有Agent都必须实现此接口
 */
export interface AgentDefinition {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly type: AgentType;
  readonly capabilities: string[];
  readonly inputSchema: JSONSchema;
  readonly outputSchema: JSONSchema;
  readonly process: (
    input: any,
    context?: ExecutionContext
  ) => Promise<AgentResult>;
  readonly canHandle?: (input: any) => boolean;
  readonly getStatus?: () => AgentStatus;
}
