/**
 * 工具基础类
 */

import type { ITool, ToolDefinition } from '../interfaces/ITool.js';
import type { Result } from '../types/common.js';

export abstract class BaseTool implements ITool {
  public readonly name: string;
  public readonly description: string;
  public readonly parameters: ToolDefinition['parameters'];
  public readonly category?: string;
  public readonly version?: string;

  constructor(definition: ToolDefinition) {
    this.name = definition.name;
    this.description = definition.description;
    this.parameters = definition.parameters;
    this.category = definition.category;
    this.version = definition.version || '1.0.0';
  }

  abstract execute(args: Record<string, any>): Promise<Result>;

  validateArgs(args: Record<string, any>): Result<boolean> {
    try {
      // 检查必需参数
      const required = this.parameters.required || [];
      for (const param of required) {
        if (!(param in args)) {
          return this.createResult(false, false, `缺少必需参数: ${param}`);
        }
      }

      // 基础类型检查
      for (const [key, value] of Object.entries(args)) {
        if (!(key in this.parameters.properties)) {
          return this.createResult(false, false, `未知参数: ${key}`);
        }

        const propDef = this.parameters.properties[key];
        if (propDef.type && !this.checkType(value, propDef.type)) {
          return this.createResult(
            false,
            false,
            `参数 ${key} 类型错误，期望: ${propDef.type}`
          );
        }
      }

      return this.createResult(true, true);
    } catch (error) {
      return this.createResult(
        false,
        false,
        `参数验证失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  getHelp(): string {
    const required = this.parameters.required || [];
    const properties = Object.entries(this.parameters.properties)
      .map(([key, prop]) => {
        const isRequired = required.includes(key);
        const typeInfo = prop.type ? `(${prop.type})` : '';
        const desc = prop.description || '';
        return `  ${key}${isRequired ? '*' : ''} ${typeInfo}: ${desc}`;
      })
      .join('\n');

    return `${this.name} - ${this.description}\n\n参数:\n${properties}\n\n* 表示必需参数`;
  }

  protected createResult<T>(
    success: boolean,
    data?: T,
    error?: string
  ): Result<T> {
    return {
      success,
      data,
      error,
      metadata: {
        tool: this.name,
        timestamp: Date.now(),
      },
    };
  }

  private checkType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return (
          typeof value === 'object' && value !== null && !Array.isArray(value)
        );
      default:
        return true; // 未知类型，跳过检查
    }
  }
}
