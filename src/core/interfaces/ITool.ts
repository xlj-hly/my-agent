/**
 * 工具服务接口
 */

import type { Result } from '../types/common.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  category?: string;
  version?: string;
}

export interface ITool extends ToolDefinition {
  /**
   * 执行工具
   */
  execute(args: Record<string, any>): Promise<Result>;

  /**
   * 验证参数
   */
  validateArgs(args: Record<string, any>): Result<boolean>;

  /**
   * 获取帮助信息
   */
  getHelp(): string;
}

export interface IToolManager {
  /**
   * 注册工具
   */
  register(tool: ITool): void;

  /**
   * 注册多个工具
   */
  registerMultiple(tools: ITool[]): void;

  /**
   * 获取工具
   */
  get(name: string): ITool | undefined;

  /**
   * 获取所有工具
   */
  getAll(): ITool[];

  /**
   * 获取工具名称列表
   */
  getNames(): string[];

  /**
   * 按类别获取工具
   */
  getByCategory(category: string): ITool[];

  /**
   * 执行工具
   */
  execute(name: string, args: Record<string, any>): Promise<Result>;

  /**
   * 移除工具
   */
  unregister(name: string): boolean;

  /**
   * 获取工具描述列表
   */
  getDescriptions(): string[];
}
