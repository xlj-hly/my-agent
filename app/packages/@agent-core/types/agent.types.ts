/**
 * Agent相关类型定义
 */

export type AgentCapability =
  | 'decision-making'
  | 'data-analysis'
  | 'code-generation'
  | 'text-processing'
  | 'web-search'
  | 'file-operations'
  | 'system-monitoring'
  | 'user-interaction'
  | 'task-coordination'
  | 'error-handling';

export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline' | 'maintenance';

export interface AgentCapabilities {
  primary: AgentCapability[];
  secondary: AgentCapability[];
  limitations: string[];
  requirements: string[];
}

export interface AgentPerformance {
  tasksCompleted: number;
  averageExecutionTime: number;
  successRate: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  lastActivity: number;
}

export interface AgentConfig {
  name: string;
  type: string;
  enabled: boolean;
  maxConcurrentTasks: number;
  timeout: number;
  retryCount: number;
  priority: number;
  settings: Record<string, any>;
}

export interface TaskAssignment {
  taskId: string;
  agentId: string;
  priority: number;
  deadline?: number;
  dependencies: string[];
  metadata: Record<string, any>;
}
