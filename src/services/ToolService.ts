/**
 * 工具管理服务
 */

import type { ITool, IToolManager } from '../core/interfaces/ITool.js';
import type { Result } from '../core/types/common.js';

export class ToolService implements IToolManager {
  private tools: Map<string, ITool> = new Map();
  private categories: Map<string, Set<string>> = new Map();

  register(tool: ITool): void {
    this.tools.set(tool.name, tool);

    // 按类别分组
    if (tool.category) {
      if (!this.categories.has(tool.category)) {
        this.categories.set(tool.category, new Set());
      }
      this.categories.get(tool.category)!.add(tool.name);
    }
  }

  registerMultiple(tools: ITool[]): void {
    tools.forEach((tool) => this.register(tool));
  }

  get(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  getAll(): ITool[] {
    return Array.from(this.tools.values());
  }

  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getByCategory(category: string): ITool[] {
    const toolNames = this.categories.get(category);
    if (!toolNames) return [];

    return Array.from(toolNames)
      .map((name) => this.tools.get(name))
      .filter((tool): tool is ITool => tool !== undefined);
  }

  async execute(name: string, args: Record<string, any>): Promise<Result> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `工具 "${name}" 不存在`,
        metadata: { availableTools: this.getNames() },
      };
    }

    // 验证参数
    const validation = tool.validateArgs(args);
    if (!validation.success) {
      return {
        success: false,
        error: `参数验证失败: ${validation.error}`,
        metadata: { tool: name, args },
      };
    }

    try {
      return await tool.execute(args);
    } catch (error) {
      return {
        success: false,
        error: `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        metadata: { tool: name, args },
      };
    }
  }

  unregister(name: string): boolean {
    const tool = this.tools.get(name);
    if (!tool) return false;

    this.tools.delete(name);

    // 从类别中移除
    if (tool.category) {
      const categoryTools = this.categories.get(tool.category);
      if (categoryTools) {
        categoryTools.delete(name);
        if (categoryTools.size === 0) {
          this.categories.delete(tool.category);
        }
      }
    }

    return true;
  }

  /**
   * 获取工具描述列表
   */
  getDescriptions(): string[] {
    return this.getAll().map((tool) => `${tool.name}: ${tool.description}`);
  }

  /**
   * 获取所有类别
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * 获取工具统计信息
   */
  getStats() {
    return {
      totalTools: this.tools.size,
      categories: this.categories.size,
      toolsByCategory: Object.fromEntries(
        Array.from(this.categories.entries()).map(([cat, tools]) => [
          cat,
          tools.size,
        ])
      ),
    };
  }

  /**
   * 清除所有工具
   */
  clear(): void {
    this.tools.clear();
    this.categories.clear();
  }
}
