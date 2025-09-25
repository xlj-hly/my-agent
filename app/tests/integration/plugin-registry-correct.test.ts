/**
 * 插件注册机制集成测试（正确版本）
 * 基于实际接口定义进行测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PluginRegistry } from '../../registry/plugin-registry';
import { Plugin, FunctionCall, AgentDefinition } from '../../packages/@agent-core';

// 模拟插件数据
const mockFunction: FunctionCall = {
  name: 'test-function',
  version: '1.0.0',
  description: '测试函数',
  category: 'test',
  tags: ['test'],
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    },
    required: ['input']
  },
  outputSchema: {
    type: 'object',
    properties: {
      result: { type: 'string' }
    }
  },
  async execute(input: any) {
    return {
      success: true,
      data: { result: `processed: ${input.input}` }
    };
  }
};

const mockAgent: AgentDefinition = {
  name: 'test-agent',
  version: '1.0.0',
  description: '测试Agent',
  type: 'expert' as any,
  capabilities: ['test'],
  inputSchema: {
    type: 'object',
    properties: {
      task: { type: 'string' }
    },
    required: ['task']
  },
  outputSchema: {
    type: 'object',
    properties: {
      response: { type: 'string' }
    }
  },
  async process(input: any) {
    return {
      success: true,
      data: { response: `Agent processed: ${input.task}` }
    };
  }
};

const mockPlugin: Plugin = {
  name: 'test-plugin',
  version: '1.0.0',
  description: '测试插件',
  functions: [mockFunction],
  agents: [mockAgent]
};

describe('插件注册机制集成测试（正确版本）', () => {
  let pluginRegistry: PluginRegistry;

  beforeEach(() => {
    pluginRegistry = new PluginRegistry();
  });

  describe('插件注册流程', () => {
    it('应该能够注册插件', async () => {
      // 注册插件
      await pluginRegistry.register(mockPlugin);

      // 验证插件已注册
      const registeredPlugin = pluginRegistry.getPlugin('test-plugin');
      expect(registeredPlugin).toBeDefined();
      expect(registeredPlugin?.name).toBe('test-plugin');
    });

    it('应该能够调用注册的函数', async () => {
      // 注册插件
      await pluginRegistry.register(mockPlugin);

      // 调用函数
      const result = await pluginRegistry.callFunction('test-function', {
        input: 'test data'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'processed: test data' });
    });

    it('应该能够获取Agent定义并直接调用', async () => {
      // 注册插件
      await pluginRegistry.register(mockPlugin);

      // 获取Agent定义并直接调用
      const plugin = pluginRegistry.getPlugin('test-plugin');
      const agent = plugin?.agents?.[0];
      expect(agent).toBeDefined();

      if (agent) {
        const result = await agent.process({
          task: 'test task'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ response: 'Agent processed: test task' });
      }
    });
  });

  describe('插件卸载流程', () => {
    it('应该能够卸载插件', async () => {
      // 先注册插件
      await pluginRegistry.register(mockPlugin);

      // 验证已注册
      expect(pluginRegistry.getPlugin('test-plugin')).toBeDefined();
      
      // 验证函数可调用
      const functionResult = await pluginRegistry.callFunction('test-function', { input: 'test' });
      expect(functionResult.success).toBe(true);

      // 卸载插件
      await pluginRegistry.unregister('test-plugin');

      // 验证已清理
      expect(pluginRegistry.getPlugin('test-plugin')).toBeUndefined();
      
      // 验证函数不可调用
      const functionResultAfter = await pluginRegistry.callFunction('test-function', { input: 'test' });
      expect(functionResultAfter.success).toBe(false);
    });
  });

  describe('错误处理', () => {
    it('应该处理插件注册失败的情况', async () => {
      const invalidPlugin = {
        ...mockPlugin,
        name: '', // 无效的插件名
      };

      await expect(pluginRegistry.register(invalidPlugin as any)).rejects.toThrow();
    });

    it('应该处理重复注册的情况', async () => {
      // 第一次注册
      await pluginRegistry.register(mockPlugin);

      // 第二次注册应该失败
      await expect(pluginRegistry.register(mockPlugin)).rejects.toThrow();
    });

    it('应该处理卸载不存在的插件', async () => {
      await expect(pluginRegistry.unregister('non-existent-plugin')).rejects.toThrow();
    });
  });

  describe('批量操作', () => {
    it('应该能够批量注册多个插件', async () => {
      const plugin2: Plugin = {
        ...mockPlugin,
        name: 'test-plugin-2',
        functions: [{
          ...mockFunction,
          name: 'test-function-2'
        }],
        agents: [{
          ...mockAgent,
          name: 'test-agent-2'
        }]
      };

      // 批量注册
      await pluginRegistry.register(mockPlugin);
      await pluginRegistry.register(plugin2);

      // 验证都已注册
      expect(pluginRegistry.getPlugin('test-plugin')).toBeDefined();
      expect(pluginRegistry.getPlugin('test-plugin-2')).toBeDefined();
      
      // 验证函数可调用
      const result1 = await pluginRegistry.callFunction('test-function', { input: 'test' });
      expect(result1.success).toBe(true);
      
      const result2 = await pluginRegistry.callFunction('test-function-2', { input: 'test' });
      expect(result2.success).toBe(true);
    });

    it('应该能够获取所有已注册的插件', async () => {
      const plugin2: Plugin = {
        ...mockPlugin,
        name: 'test-plugin-3', // 使用不同的名称避免冲突
        functions: [{
          ...mockFunction,
          name: 'test-function-3'
        }],
        agents: [{
          ...mockAgent,
          name: 'test-agent-3'
        }]
      };

      await pluginRegistry.register(plugin2);

      const allPlugins = pluginRegistry.getAllPlugins();
      expect(allPlugins.length).toBeGreaterThan(0);
      expect(allPlugins.map(p => p.name)).toContain('test-plugin-3');
    });
  });

  describe('健康检查', () => {
    it('应该能够检查插件健康状态', async () => {
      const pluginWithHealthCheck: Plugin = {
        ...mockPlugin,
        healthCheck: async () => ({
          healthy: true,
          status: 'healthy',
          details: { message: 'Plugin is healthy' },
          timestamp: Date.now()
        })
      };

      await pluginRegistry.register(pluginWithHealthCheck);

      const healthStatus = await pluginRegistry.getHealthStatus();
      expect(healthStatus['test-plugin']).toBeDefined();
      expect(healthStatus['test-plugin'].healthy).toBe(true);
      expect(healthStatus['test-plugin'].status).toBe('healthy');
    });
  });
});
