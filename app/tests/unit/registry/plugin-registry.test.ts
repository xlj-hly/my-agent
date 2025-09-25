/**
 * PluginRegistry 实现测试（Week 3）
 */

import { PluginRegistry } from '../../../registry/plugin-registry';
import {
  Plugin,
  FunctionCall,
  ERROR_CODES,
  getErrorMessage,
} from '../../../packages/@agent-core';

describe('PluginRegistry 实现', () => {
  let registry: PluginRegistry;

  const fnAdd: FunctionCall<{ x: number }, { y: number }> = {
    name: 'add-one',
    version: '1.0.0',
    description: 'add 1',
    category: 'math',
    tags: ['math'],
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    async execute(input) {
      return { success: true, data: { y: input.x + 1 } };
    },
  };

  const pluginA: Plugin = {
    name: 'plugin-a',
    version: '1.0.0',
    description: 'test plugin',
    functions: [fnAdd],
    agents: [
      {
        name: 'agent-a',
        version: '1.0.0',
        description: 'A',
        type: 1 as any, // 简洁起见，这里直接用任意值（不在此用例验证 agent 行为）
        capabilities: ['test'],
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
        async process() {
          return { success: true };
        },
      },
    ],
    services: [
      {
        name: 'svc-a',
        version: '1.0.0',
        description: 'A service',
        type: 'http',
      },
    ],
    async initialize() {},
    async destroy() {},
    async healthCheck() {
      return { healthy: true, status: 'healthy', timestamp: Date.now() };
    },
  };

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  it('应能注册插件并批量注册函数', async () => {
    await registry.register(pluginA);
    expect(registry.isRegistered('plugin-a')).toBe(true);
    const health = await registry.getHealthStatus();
    expect(health['plugin-a']?.healthy).toBe(true);
  });

  it('应能通过插件调用函数', async () => {
    await registry.register(pluginA);
    const res = await registry.callFunction<{ x: number }, { y: number }>(
      'add-one',
      { x: 1 }
    );
    expect(res.success).toBe(true);
    expect((res.data as any)?.y).toBe(2);
  });

  it('重复注册抛出 RESOURCE_ALREADY_EXISTS', async () => {
    await registry.register(pluginA);
    await expect(registry.register(pluginA)).rejects.toThrow(
      getErrorMessage(ERROR_CODES.RESOURCE_ALREADY_EXISTS)
    );
  });

  it('未找到插件卸载抛出 PLUGIN_NOT_FOUND', async () => {
    await expect(registry.unregister('none')).rejects.toThrow(
      getErrorMessage(ERROR_CODES.PLUGIN_NOT_FOUND)
    );
  });

  it('卸载后不再包含插件', async () => {
    await registry.register(pluginA);
    await registry.unregister('plugin-a');
    expect(registry.isRegistered('plugin-a')).toBe(false);
  });
});
