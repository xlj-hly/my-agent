import { MemoryType } from '../packages/@agent-core';
import { LogLevel, LogFormat, LogOutput } from '../packages/@agent-core';

export interface MemoryBackendConfig {
  type: 'memory' | 'redis' | 'database' | 'file';
  options?: Record<string, any>;
}

export interface SystemConfig {
  memory: {
    defaultType: MemoryType;
    strategies?: Partial<Record<MemoryType, MemoryBackendConfig>>;
  };
  agents: {
    decision?: Record<string, any>;
    experts?: Array<Record<string, any>>;
    tools?: Array<Record<string, any>>;
  };
  orchestration: {
    maxConcurrentTasks: number;
    timeout: number;
    retryAttempts: number;
    enableParallelExecution: boolean;
  };
  plugins: {
    autoLoad: boolean;
    loadPaths: string[];
    enableHotReload: boolean;
  };
  logging: {
    level: LogLevel;
    format: LogFormat;
    outputs: LogOutput[];
  };
}
