/**
 * 函数调用接口定义
 * 定义系统中所有函数调用的标准接口
 */

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  description?: string;
  default?: any;
  [key: string]: any;
}

export interface ExecutionContext {
  sessionId?: string;
  userId?: string;
  agentId?: string;
  metadata?: Record<string, any>;
  dependencies?: DependencyMap;
  timeout?: number;
  retryCount?: number;
}

export interface DependencyMap {
  [key: string]: any;
}

export interface FunctionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
  executionTime?: number;
  memoryUsage?: number;
  timestamp?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * 函数调用接口
 * 系统中所有可调用函数的标准接口
 */
export interface FunctionCall<TInput = any, TOutput = any> {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly category: string;
  readonly tags: string[];
  readonly inputSchema: JSONSchema;
  readonly outputSchema: JSONSchema;
  readonly execute: (
    input: TInput,
    context?: ExecutionContext
  ) => Promise<FunctionResult<TOutput>>;
  readonly validate?: (input: TInput) => ValidationResult;
  readonly dependencies?: string[];
}
