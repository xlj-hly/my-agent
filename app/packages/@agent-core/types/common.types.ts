/**
 * 通用类型定义
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// 日志格式与输出目标（与架构文档一致）
export type LogFormat = 'json' | 'text';
export type LogOutput = 'console' | 'file' | 'remote';

export type Environment = 'development' | 'testing' | 'staging' | 'production';

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface ErrorInfo {
  code: string;
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, any>;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  metadata?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: ErrorInfo;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SystemInfo {
  version: string;
  environment: Environment;
  nodeVersion: string;
  platform: string;
  arch: string;
  memory: {
    total: number;
    free: number;
    used: number;
  };
  uptime: number;
  timestamp: number;
}

export interface ConfigValue {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required: boolean;
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}
