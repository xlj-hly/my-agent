/**
 * 函数和Agent分类常量
 */

export const FUNCTION_CATEGORIES = {
  SEARCH: 'search',
  CALCULATION: 'calculation',
  DATA: 'data',
  TEXT: 'text',
  SYSTEM: 'system',
  COMMUNICATION: 'communication',
  STORAGE: 'storage',
  UTILITY: 'utility',
} as const;

export const AGENT_TYPES = {
  DECISION: 'decision',
  EXPERT: 'expert',
  TOOL: 'tool',
  COORDINATOR: 'coordinator',
} as const;

export const MEMORY_TYPES = {
  CENTRALIZED: 'centralized',
  DISTRIBUTED: 'distributed',
  HYBRID: 'hybrid',
} as const;

export const PLUGIN_TYPES = {
  CORE: 'core',
  TOOL: 'tool',
  SERVICE: 'service',
  AGENT: 'agent',
  INTEGRATION: 'integration',
} as const;

export const STATUS_TYPES = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  IDLE: 'idle',
  BUSY: 'busy',
  ERROR: 'error',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;
