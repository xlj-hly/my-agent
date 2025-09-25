/**
 * @agent-tools 工具函数包主入口
 * 提供可复用的基础功能工具函数
 */

// 导出搜索工具
export * from './search';

// 导出计算工具
export * from './calculation';

// 导出数据处理工具
export * from './data';

// 导出文本工具
export * from './text';

// 导出系统工具
export * from './system';

// 包信息
export const AGENT_TOOLS_VERSION = '1.0.0';
export const AGENT_TOOLS_DESCRIPTION = 'Agent工具函数包 - 提供可复用的基础功能';
export const AGENT_TOOLS_PACKAGE_NAME = '@agent-tools';
