/**
 * @agent-core 包主入口
 * 导出所有核心接口、类型和常量
 */

// 接口导出
export * from './interfaces/agent.interface';
export * from './interfaces/function.interface';
export * from './interfaces/memory.interface';
export * from './interfaces/plugin.interface';
export * from './interfaces/registry.interface';

// 类型导出
export * from './types/function.types';
export * from './types/plugin.types';
export * from './types/common.types';
// 注意：agent.types.js 和 memory.types.js 中的某些类型与接口文件重复，暂时不导出

// 常量导出
export * from './constants/categories';
export * from './constants/errors';
export * from './constants/events';

// 版本信息
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@agent-core';

// 包信息
export const PACKAGE_INFO = {
  name: PACKAGE_NAME,
  version: VERSION,
  description: '多Agent编排系统核心接口和类型定义',
  author: '',
  license: 'ISC',
} as const;
