/**
 * 插件接口定义
 * 定义系统中所有插件的标准接口
 */

import { FunctionCall } from './function.interface.js';
import { AgentDefinition } from './agent.interface.js';

export interface ServiceDefinition {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly type: string;
  readonly initialize?: () => Promise<void>;
  readonly destroy?: () => Promise<void>;
  readonly healthCheck?: () => Promise<HealthStatus>;
}

export interface HealthStatus {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details?: Record<string, any>;
  timestamp: number;
}

/**
 * 插件接口
 * 系统中所有插件都必须实现此接口
 */
export interface Plugin {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author?: string;
  readonly license?: string;
  readonly functions: FunctionCall[];
  readonly agents?: AgentDefinition[];
  readonly services?: ServiceDefinition[];
  readonly dependencies?: string[];
  readonly initialize?: () => Promise<void>;
  readonly destroy?: () => Promise<void>;
  readonly healthCheck?: () => Promise<HealthStatus>;
}
