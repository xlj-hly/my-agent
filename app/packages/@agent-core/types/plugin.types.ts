/**
 * 插件相关类型定义
 */

export type PluginType = 'core' | 'tool' | 'service' | 'agent' | 'integration';

export type PluginStatus =
  | 'loading'
  | 'loaded'
  | 'initialized'
  | 'error'
  | 'unloaded';

export interface PluginMetadata {
  type: PluginType;
  status: PluginStatus;
  dependencies: string[];
  conflicts: string[];
  requirements: {
    nodeVersion?: string;
    memory?: number;
    disk?: number;
  };
  permissions: {
    network?: boolean;
    filesystem?: boolean;
    system?: boolean;
  };
}

export interface PluginConfig {
  enabled: boolean;
  autoLoad: boolean;
  priority: number;
  settings: Record<string, any>;
  environment: 'development' | 'testing' | 'production';
}

export interface PluginError {
  code: string;
  message: string;
  stack?: string;
  timestamp: number;
  plugin: string;
}
