/**
 * 函数相关类型定义
 */

export type FunctionCategory =
  | 'search'
  | 'calculation'
  | 'data'
  | 'text'
  | 'system'
  | 'communication'
  | 'storage'
  | 'utility';

export type FunctionTag =
  | 'web'
  | 'vector'
  | 'semantic'
  | 'math'
  | 'statistics'
  | 'json'
  | 'csv'
  | 'xml'
  | 'analyze'
  | 'summarize'
  | 'translate'
  | 'file'
  | 'network'
  | 'datetime'
  | 'cache'
  | 'database';

export interface FunctionMetadata {
  category: FunctionCategory;
  tags: FunctionTag[];
  complexity: 'low' | 'medium' | 'high';
  performance: {
    averageExecutionTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  reliability: {
    successRate: number;
    errorRate: number;
    retryCount: number;
  };
}

export interface FunctionExecutionOptions {
  timeout?: number;
  retryCount?: number;
  priority?: 'low' | 'normal' | 'high';
  parallel?: boolean;
  cache?: boolean;
  validateInput?: boolean;
  validateOutput?: boolean;
}
