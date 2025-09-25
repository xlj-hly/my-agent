/**
 * PluginRegistry 内存实现（Week 3）
 * 严格遵循 @agent-core/interfaces/registry.interface.ts
 */

import {
  Plugin,
  ExecutionContext,
  FunctionResult,
  IPluginRegistry,
  ERROR_CODES,
  getErrorMessage,
} from '../packages/@agent-core';
import { AgentRegistry } from './agent-registry';
import { ServiceRegistry } from './service-registry';
import { FunctionRegistry } from './function-registry';

export class PluginRegistry implements IPluginRegistry {
  private readonly nameToPlugin: Map<string, Plugin> = new Map();
  private readonly functionRegistry: FunctionRegistry = new FunctionRegistry();
  private readonly agentRegistry: AgentRegistry = new AgentRegistry();
  private readonly serviceRegistry: ServiceRegistry = new ServiceRegistry();

  async register(plugin: Plugin): Promise<void> {
    if (!plugin?.name) {
      throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
    }
    if (this.nameToPlugin.has(plugin.name)) {
      throw new Error(getErrorMessage(ERROR_CODES.RESOURCE_ALREADY_EXISTS));
    }

    // 校验与依赖
    const ok = await this.validatePlugin(plugin);
    if (!ok) {
      throw new Error(getErrorMessage(ERROR_CODES.REGISTRATION_ERROR));
    }
    const depOk = await this.checkDependencies(plugin);
    if (!depOk) {
      throw new Error(getErrorMessage(ERROR_CODES.PLUGIN_DEPENDENCY_ERROR));
    }

    this.nameToPlugin.set(plugin.name, plugin);

    // 批量注册函数
    if (Array.isArray(plugin.functions)) {
      for (const func of plugin.functions) {
        await this.functionRegistry.registerFunction(func);
      }
    }
    // 批量注册 Agent
    if (Array.isArray(plugin.agents)) {
      for (const agent of plugin.agents) {
        await this.agentRegistry.registerAgent(agent);
      }
    }
    // 批量注册 Service
    if (Array.isArray(plugin.services)) {
      for (const svc of plugin.services) {
        await this.serviceRegistry.registerService(svc);
      }
    }

    // 初始化
    if (typeof plugin.initialize === 'function') {
      await plugin.initialize();
    }
  }

  async unregister(pluginName: string): Promise<void> {
    const plugin = this.nameToPlugin.get(pluginName);
    if (!plugin) {
      throw new Error(getErrorMessage(ERROR_CODES.PLUGIN_NOT_FOUND));
    }

    // 销毁
    if (typeof plugin.destroy === 'function') {
      await plugin.destroy();
    }

    // 卸载函数
    if (Array.isArray(plugin.functions)) {
      for (const func of plugin.functions) {
        try {
          await this.functionRegistry.unregisterFunction(func.name);
        } catch {
          // 忽略未注册情况
        }
      }
    }
    // 卸载 Agent
    if (Array.isArray(plugin.agents)) {
      for (const agent of plugin.agents) {
        try {
          await this.agentRegistry.unregisterAgent(agent.name);
        } catch {
          // 忽略卸载错误
        }
      }
    }
    // 卸载 Service
    if (Array.isArray(plugin.services)) {
      for (const svc of plugin.services) {
        try {
          await this.serviceRegistry.unregisterService(svc.name);
        } catch {
          // 忽略卸载错误
        }
      }
    }

    this.nameToPlugin.delete(pluginName);
  }

  getPlugin(pluginName: string): Plugin | undefined {
    return this.nameToPlugin.get(pluginName);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.nameToPlugin.values());
  }

  isRegistered(pluginName: string): boolean {
    return this.nameToPlugin.has(pluginName);
  }

  async getHealthStatus(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const [name, plugin] of this.nameToPlugin.entries()) {
      if (typeof plugin.healthCheck === 'function') {
        try {
          result[name] = await plugin.healthCheck();
        } catch (err: any) {
          result[name] = {
            healthy: false,
            status: 'unhealthy',
            error: String(err?.message ?? err),
            timestamp: Date.now(),
          };
        }
      } else {
        result[name] = {
          healthy: true,
          status: 'unknown',
          timestamp: Date.now(),
        };
      }
    }
    return result;
  }

  async validatePlugin(plugin: Plugin): Promise<boolean> {
    // 最小校验：name、version、description、functions（可为空数组）
    if (!plugin?.name || !plugin?.version || !plugin?.description) return false;
    if (!Array.isArray(plugin.functions)) return false;
    // 函数形态轻校验
    for (const f of plugin.functions) {
      if (!f?.name || typeof f.execute !== 'function') return false;
    }
    return true;
  }

  async checkDependencies(_plugin: Plugin): Promise<boolean> {
    // 依赖检查：当前阶段不引入外部解析，返回 true；后续可扩展
    return true;
  }

  async callFunction<TInput, TOutput>(
    functionName: string,
    input: TInput,
    context?: ExecutionContext
  ): Promise<FunctionResult<TOutput>> {
    return this.functionRegistry.callFunction<TInput, TOutput>(
      functionName,
      input,
      context
    );
  }
}

export default PluginRegistry;
