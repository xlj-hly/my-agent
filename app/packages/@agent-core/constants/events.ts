/**
 * 事件常量定义
 */

export const SYSTEM_EVENTS = {
  // 系统生命周期事件
  SYSTEM_START: 'system:start',
  SYSTEM_STOP: 'system:stop',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_HEALTH_CHECK: 'system:health-check',

  // 插件相关事件
  PLUGIN_LOADED: 'plugin:loaded',
  PLUGIN_UNLOADED: 'plugin:unloaded',
  PLUGIN_ERROR: 'plugin:error',
  PLUGIN_HEALTH_CHECK: 'plugin:health-check',

  // 函数相关事件
  FUNCTION_REGISTERED: 'function:registered',
  FUNCTION_UNREGISTERED: 'function:unregistered',
  FUNCTION_EXECUTED: 'function:executed',
  FUNCTION_ERROR: 'function:error',

  // Agent相关事件
  AGENT_REGISTERED: 'agent:registered',
  AGENT_UNREGISTERED: 'agent:unregistered',
  AGENT_STARTED: 'agent:started',
  AGENT_STOPPED: 'agent:stopped',
  AGENT_TASK_ASSIGNED: 'agent:task-assigned',
  AGENT_TASK_COMPLETED: 'agent:task-completed',
  AGENT_ERROR: 'agent:error',

  // 记忆相关事件
  MEMORY_ADDED: 'memory:added',
  MEMORY_UPDATED: 'memory:updated',
  MEMORY_DELETED: 'memory:deleted',
  MEMORY_CLEANUP: 'memory:cleanup',
  MEMORY_ERROR: 'memory:error',

  // 编排相关事件
  TASK_STARTED: 'task:started',
  TASK_COMPLETED: 'task:completed',
  TASK_ERROR: 'task:error',

  // 配置相关事件
  CONFIG_CHANGED: 'config:changed',
  CONFIG_LOADED: 'config:loaded',
  CONFIG_ERROR: 'config:error',
} as const;

export const EVENT_PRIORITIES = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  CRITICAL: 4,
} as const;

export interface EventData {
  event: string;
  timestamp: number;
  source: string;
  data: any;
  metadata?: Record<string, any>;
}

export interface EventHandler {
  (data: EventData): Promise<void> | void;
}
