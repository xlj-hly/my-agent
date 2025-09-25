/**
 * 注册中心接口定义
 * 定义系统中所有注册中心的标准接口
 */

import { Plugin } from './plugin.interface.js';
import {
  FunctionCall,
  ExecutionContext,
  FunctionResult,
} from './function.interface.js';
import { AgentDefinition } from './agent.interface.js';

/**
 * 插件注册中心接口
 */
export interface IPluginRegistry {
  register(plugin: Plugin): Promise<void>;
  unregister(pluginName: string): Promise<void>;
  getPlugin(pluginName: string): Plugin | undefined;
  getAllPlugins(): Plugin[];
  isRegistered(pluginName: string): boolean;
  getHealthStatus(): Promise<Record<string, any>>;
  validatePlugin(plugin: Plugin): Promise<boolean>;
  checkDependencies(plugin: Plugin): Promise<boolean>;
  callFunction<TInput, TOutput>(
    functionName: string,
    input: TInput,
    context?: ExecutionContext
  ): Promise<FunctionResult<TOutput>>;
}

/**
 * 函数注册中心接口
 */
export interface IFunctionRegistry {
  registerFunction(func: FunctionCall): Promise<void>;
  unregisterFunction(functionName: string): Promise<void>;
  getFunction(functionName: string): FunctionCall | undefined;
  getAllFunctions(): FunctionCall[];
  getFunctionsByCategory(category: string): FunctionCall[];
  getFunctionsByTag(tag: string): FunctionCall[];
  callFunction<TInput, TOutput>(
    functionName: string,
    input: TInput,
    context?: ExecutionContext
  ): Promise<FunctionResult<TOutput>>;
  isRegistered(functionName: string): boolean;
}

/**
 * Agent注册中心接口
 */
export interface IAgentRegistry {
  registerAgent(agent: AgentDefinition): Promise<void>;
  unregisterAgent(agentName: string): Promise<void>;
  getAgent(agentName: string): AgentDefinition | undefined;
  getAllAgents(): AgentDefinition[];
  getAgentsByType(type: string): AgentDefinition[];
  getAgentsByCapability(capability: string): AgentDefinition[];
  isRegistered(agentName: string): boolean;
  getAvailableAgents(): AgentDefinition[];
}

/**
 * 服务注册中心接口
 */
export interface IServiceRegistry {
  registerService(service: any): Promise<void>;
  unregisterService(serviceName: string): Promise<void>;
  getService(serviceName: string): any;
  getAllServices(): any[];
  isRegistered(serviceName: string): boolean;
  getHealthStatus(): Promise<Record<string, any>>;
}
