/**
 * Memory 服务模块导出
 * 提供记忆相关的所有服务功能
 */

// 导出记忆存储服务
export * from './memory-store';

// 导出记忆查询服务
export * from './memory-query';

// 导出记忆清理服务
export * from './memory-cleanup';

// 导出记忆策略服务
export * from './memory-strategies';

// 导出记忆服务集合
export const memoryServices = [
  // 这里将在后续添加具体的服务实例
];

// 模块信息
export const MEMORY_SERVICES_VERSION = '1.0.0';
export const MEMORY_SERVICES_DESCRIPTION = '记忆服务模块 - 提供记忆存储、查询、清理、策略等功能';
