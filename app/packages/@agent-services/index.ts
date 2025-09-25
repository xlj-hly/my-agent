/**
 * @agent-services 服务函数包主入口
 * 提供记忆服务、LLM服务、通信服务等基础服务功能
 */

// 导出记忆服务
export * from './memory';

// 导出LLM服务
export * from './llm';

// 导出通信服务
export * from './communication';

// 导出存储服务
export * from './storage';

// 包信息
export const AGENT_SERVICES_VERSION = '1.0.0';
export const AGENT_SERVICES_DESCRIPTION = 'Agent服务函数包 - 提供记忆服务、LLM服务、通信服务、存储服务等';
export const AGENT_SERVICES_PACKAGE_NAME = '@agent-services';

