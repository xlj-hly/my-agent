import { MemoryType } from '../packages/@agent-core';
import type { SystemConfig } from './config-types';

export const DEFAULT_CONFIG: SystemConfig = {
  memory: {
    defaultType: MemoryType.CENTRALIZED,
    strategies: {
      [MemoryType.CENTRALIZED]: { type: 'memory' },
      [MemoryType.DISTRIBUTED]: { type: 'memory' },
      [MemoryType.HYBRID]: { type: 'memory' },
    },
  },
  agents: {
    decision: {},
    experts: [],
    tools: [],
  },
  orchestration: {
    maxConcurrentTasks: 4,
    timeout: 30000,
    retryAttempts: 1,
    enableParallelExecution: true,
  },
  plugins: {
    autoLoad: false,
    loadPaths: [],
    enableHotReload: false,
  },
  logging: {
    level: 'info',
    format: 'json',
    outputs: ['console'],
  },
};
