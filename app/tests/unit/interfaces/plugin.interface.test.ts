/**
 * Plugin接口测试
 */

import {
  Plugin,
  ServiceDefinition,
  HealthStatus,
  FunctionCall,
  AgentDefinition,
  AgentType,
} from '../../../packages/@agent-core';

describe('Plugin接口测试', () => {
  describe('ServiceDefinition接口', () => {
    it('应该正确创建ServiceDefinition对象', () => {
      const service: ServiceDefinition = {
        name: 'test-service',
        version: '1.0.0',
        description: 'Test service',
        type: 'http',
      };

      expect(service.name).toBe('test-service');
      expect(service.version).toBe('1.0.0');
      expect(service.description).toBe('Test service');
      expect(service.type).toBe('http');
    });

    it('应该支持可选的方法', () => {
      const serviceWithMethods: ServiceDefinition = {
        name: 'full-service',
        version: '1.0.0',
        description: 'Service with methods',
        type: 'grpc',
        initialize: async () => {
          // 初始化逻辑
        },
        destroy: async () => {
          // 销毁逻辑
        },
        healthCheck: async () => ({
          healthy: true,
          status: 'healthy',
          timestamp: Date.now(),
        }),
      };

      expect(typeof serviceWithMethods.initialize).toBe('function');
      expect(typeof serviceWithMethods.destroy).toBe('function');
      expect(typeof serviceWithMethods.healthCheck).toBe('function');
    });
  });

  describe('HealthStatus接口', () => {
    it('应该正确创建HealthStatus对象', () => {
      const health: HealthStatus = {
        healthy: true,
        status: 'healthy',
        details: {
          uptime: 3600,
          memoryUsage: 1024000,
        },
        timestamp: Date.now(),
      };

      expect(health.healthy).toBe(true);
      expect(health.status).toBe('healthy');
      expect(health.details?.uptime).toBe(3600);
      expect(health.timestamp).toBeDefined();
    });

    it('应该支持不同的健康状态', () => {
      const healthyStatus: HealthStatus = {
        healthy: true,
        status: 'healthy',
        timestamp: Date.now(),
      };

      const degradedStatus: HealthStatus = {
        healthy: false,
        status: 'degraded',
        details: {
          warning: 'High memory usage',
        },
        timestamp: Date.now(),
      };

      const unhealthyStatus: HealthStatus = {
        healthy: false,
        status: 'unhealthy',
        details: {
          error: 'Service unavailable',
        },
        timestamp: Date.now(),
      };

      expect(healthyStatus.healthy).toBe(true);
      expect(healthyStatus.status).toBe('healthy');

      expect(degradedStatus.healthy).toBe(false);
      expect(degradedStatus.status).toBe('degraded');

      expect(unhealthyStatus.healthy).toBe(false);
      expect(unhealthyStatus.status).toBe('unhealthy');
    });

    it('应该支持可选的详细信息', () => {
      const healthWithoutDetails: HealthStatus = {
        healthy: true,
        status: 'healthy',
        timestamp: Date.now(),
      };

      expect(healthWithoutDetails.details).toBeUndefined();
    });
  });

  describe('Plugin接口', () => {
    const mockFunction: FunctionCall = {
      name: 'test-function',
      version: '1.0.0',
      description: 'Test function',
      category: 'test',
      tags: ['test', 'mock'],
      inputSchema: { type: 'object' },
      outputSchema: { type: 'object' },
      execute: async () => ({
        success: true,
        data: { result: 'test' },
      }),
    };

    const mockAgent: AgentDefinition = {
      name: 'test-agent',
      version: '1.0.0',
      description: 'Test agent',
      type: AgentType.EXPERT,
      capabilities: ['test'],
      inputSchema: { type: 'object' },
      outputSchema: { type: 'object' },
      process: async () => ({
        success: true,
        data: { result: 'processed' },
      }),
    };

    const mockService: ServiceDefinition = {
      name: 'test-service',
      version: '1.0.0',
      description: 'Test service',
      type: 'http',
    };

    it('应该正确创建Plugin对象', () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        functions: [mockFunction],
      };

      expect(plugin.name).toBe('test-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toBe('Test plugin');
      expect(plugin.functions).toHaveLength(1);
      expect(plugin.functions[0].name).toBe('test-function');
    });

    it('应该支持所有可选属性', () => {
      const fullPlugin: Plugin = {
        name: 'full-plugin',
        version: '1.0.0',
        description: 'Full plugin',
        author: 'Test Author',
        license: 'MIT',
        functions: [mockFunction],
        agents: [mockAgent],
        services: [mockService],
        dependencies: ['dep1', 'dep2'],
        initialize: async () => {
          // 初始化逻辑
        },
        destroy: async () => {
          // 销毁逻辑
        },
        healthCheck: async () => ({
          healthy: true,
          status: 'healthy',
          timestamp: Date.now(),
        }),
      };

      expect(fullPlugin.author).toBe('Test Author');
      expect(fullPlugin.license).toBe('MIT');
      expect(fullPlugin.agents).toHaveLength(1);
      expect(fullPlugin.services).toHaveLength(1);
      expect(fullPlugin.dependencies).toEqual(['dep1', 'dep2']);
      expect(typeof fullPlugin.initialize).toBe('function');
      expect(typeof fullPlugin.destroy).toBe('function');
      expect(typeof fullPlugin.healthCheck).toBe('function');
    });

    it('应该支持最小配置', () => {
      const minimalPlugin: Plugin = {
        name: 'minimal-plugin',
        version: '1.0.0',
        description: 'Minimal plugin',
        functions: [],
      };

      expect(minimalPlugin.name).toBe('minimal-plugin');
      expect(minimalPlugin.functions).toHaveLength(0);
      expect(minimalPlugin.agents).toBeUndefined();
      expect(minimalPlugin.services).toBeUndefined();
      expect(minimalPlugin.dependencies).toBeUndefined();
      expect(minimalPlugin.author).toBeUndefined();
      expect(minimalPlugin.license).toBeUndefined();
      expect(minimalPlugin.initialize).toBeUndefined();
      expect(minimalPlugin.destroy).toBeUndefined();
      expect(minimalPlugin.healthCheck).toBeUndefined();
    });
  });

  describe('接口兼容性测试', () => {
    it('所有插件都应该有必需的属性', () => {
      const plugin: Plugin = {
        name: 'compat-plugin',
        version: '1.0.0',
        description: 'Compatibility test plugin',
        functions: [],
      };

      expect(plugin.name).toBeDefined();
      expect(plugin.version).toBeDefined();
      expect(plugin.description).toBeDefined();
      expect(Array.isArray(plugin.functions)).toBe(true);
    });

    it('健康状态应该支持所有状态值', () => {
      const statuses: HealthStatus[] = [
        {
          healthy: true,
          status: 'healthy',
          timestamp: Date.now(),
        },
        {
          healthy: false,
          status: 'degraded',
          timestamp: Date.now(),
        },
        {
          healthy: false,
          status: 'unhealthy',
          timestamp: Date.now(),
        },
      ];

      statuses.forEach((status) => {
        expect(typeof status.healthy).toBe('boolean');
        expect(status.status).toMatch(/^(healthy|degraded|unhealthy)$/);
        expect(typeof status.timestamp).toBe('number');
      });
    });

    it('服务定义应该支持不同类型的服务', () => {
      const services: ServiceDefinition[] = [
        {
          name: 'http-service',
          version: '1.0.0',
          description: 'HTTP service',
          type: 'http',
        },
        {
          name: 'grpc-service',
          version: '1.0.0',
          description: 'gRPC service',
          type: 'grpc',
        },
        {
          name: 'websocket-service',
          version: '1.0.0',
          description: 'WebSocket service',
          type: 'websocket',
        },
      ];

      services.forEach((service) => {
        expect(service.name).toBeDefined();
        expect(service.version).toBeDefined();
        expect(service.description).toBeDefined();
        expect(service.type).toBeDefined();
      });
    });

    it('插件应该能够处理异步操作', async () => {
      const asyncPlugin: Plugin = {
        name: 'async-plugin',
        version: '1.0.0',
        description: 'Async plugin',
        functions: [
          {
            name: 'async-function',
            version: '1.0.0',
            description: 'Async function',
            category: 'test',
            tags: ['async'],
            inputSchema: { type: 'object' },
            outputSchema: { type: 'object' },
            execute: async () => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return {
                success: true,
                data: { async: true },
              };
            },
          },
        ],
        initialize: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
        },
        destroy: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
        },
        healthCheck: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return {
            healthy: true,
            status: 'healthy',
            timestamp: Date.now(),
          };
        },
      };

      if (asyncPlugin.initialize) {
        await expect(asyncPlugin.initialize()).resolves.not.toThrow();
      }

      if (asyncPlugin.healthCheck) {
        const health = await asyncPlugin.healthCheck();
        expect(health.healthy).toBe(true);
      }

      if (asyncPlugin.destroy) {
        await expect(asyncPlugin.destroy()).resolves.not.toThrow();
      }

      const result = await asyncPlugin.functions[0].execute({});
      expect(result.success).toBe(true);
      expect(result.data.async).toBe(true);
    });
  });
});
