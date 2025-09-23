/**
 * 新架构工具系统导出
 * 使用基于类的工具实现，支持更好的扩展性
 */

// 导出新架构的工具类
export { DateTimeTool } from './adapters/DateTimeTool.js';
export { CalculatorTool } from './adapters/CalculatorTool.js';
export { SystemInfoTool } from './adapters/SystemInfoTool.js';

// 导出核心类型和接口
export type { ITool, IToolManager } from '../core/interfaces/ITool.js';
export type { Result } from '../core/types/common.js';

// 便于快速创建工具实例的工厂函数
export async function createBuiltinTools() {
  const [DateTimeToolModule, CalculatorToolModule, SystemInfoToolModule] =
    await Promise.all([
      import('./adapters/DateTimeTool.js'),
      import('./adapters/CalculatorTool.js'),
      import('./adapters/SystemInfoTool.js'),
    ]);

  return [
    new DateTimeToolModule.DateTimeTool(),
    new CalculatorToolModule.CalculatorTool(),
    new SystemInfoToolModule.SystemInfoTool(),
  ];
}

