/**
 * Agent接口测试
 */

import {
  AgentDefinition,
  AgentType,
  AgentResult,
  AgentStatus,
} from '../../../packages/@agent-core';

describe('Agent接口测试', () => {
  describe('AgentType枚举', () => {
    it('应该包含所有预期的Agent类型', () => {
      expect(AgentType.DECISION).toBe('decision');
      expect(AgentType.EXPERT).toBe('expert');
      expect(AgentType.TOOL).toBe('tool');
      expect(AgentType.COORDINATOR).toBe('coordinator');
    });

    it('应该支持所有Agent类型', () => {
      const types = Object.values(AgentType);
      expect(types).toContain('decision');
      expect(types).toContain('expert');
      expect(types).toContain('tool');
      expect(types).toContain('coordinator');
      expect(types).toHaveLength(4);
    });
  });

  describe('AgentResult接口', () => {
    it('应该正确创建AgentResult对象', () => {
      const result: AgentResult = {
        success: true,
        data: { message: 'Success' },
        executionTime: 150,
        memoryUsage: 1024,
        functionsUsed: ['func1', 'func2'],
        agentsUsed: ['agent1'],
      };

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Success');
      expect(result.executionTime).toBe(150);
      expect(result.memoryUsage).toBe(1024);
      expect(result.functionsUsed).toEqual(['func1', 'func2']);
      expect(result.agentsUsed).toEqual(['agent1']);
    });

    it('应该支持错误结果', () => {
      const errorResult: AgentResult = {
        success: false,
        error: 'Processing failed',
        executionTime: 50,
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('Processing failed');
      expect(errorResult.data).toBeUndefined();
    });

    it('应该支持元数据', () => {
      const resultWithMetadata: AgentResult = {
        success: true,
        data: { result: 'OK' },
        metadata: {
          source: 'test',
          timestamp: Date.now(),
        },
      };

      expect(resultWithMetadata.metadata).toBeDefined();
      expect(resultWithMetadata.metadata?.source).toBe('test');
      expect(resultWithMetadata.metadata?.timestamp).toBeDefined();
    });
  });

  describe('AgentStatus接口', () => {
    it('应该正确创建AgentStatus对象', () => {
      const status: AgentStatus = {
        name: 'test-agent',
        type: AgentType.EXPERT,
        status: 'idle',
        capabilities: ['test', 'mock'],
        lastActivity: Date.now(),
      };

      expect(status.name).toBe('test-agent');
      expect(status.type).toBe(AgentType.EXPERT);
      expect(status.status).toBe('idle');
      expect(status.capabilities).toEqual(['test', 'mock']);
      expect(status.lastActivity).toBeDefined();
    });

    it('应该支持不同的状态类型', () => {
      const idleStatus: AgentStatus = {
        name: 'agent-1',
        type: AgentType.EXPERT,
        status: 'idle',
        capabilities: ['test'],
      };

      const busyStatus: AgentStatus = {
        name: 'agent-2',
        type: AgentType.DECISION,
        status: 'busy',
        capabilities: ['decision'],
      };

      const errorStatus: AgentStatus = {
        name: 'agent-3',
        type: AgentType.TOOL,
        status: 'error',
        capabilities: ['tool'],
      };

      const offlineStatus: AgentStatus = {
        name: 'agent-4',
        type: AgentType.COORDINATOR,
        status: 'offline',
        capabilities: ['coordinate'],
      };

      expect(idleStatus.status).toBe('idle');
      expect(busyStatus.status).toBe('busy');
      expect(errorStatus.status).toBe('error');
      expect(offlineStatus.status).toBe('offline');
    });

    it('应该支持可选的元数据', () => {
      const statusWithMetadata: AgentStatus = {
        name: 'test-agent',
        type: AgentType.EXPERT,
        status: 'idle',
        capabilities: ['test'],
        metadata: {
          uptime: 3600,
          memoryUsage: 2048,
        },
      };

      expect(statusWithMetadata.metadata).toBeDefined();
      expect(statusWithMetadata.metadata?.uptime).toBe(3600);
    });
  });

  describe('AgentDefinition接口', () => {
    it('应该正确创建AgentDefinition对象', () => {
      const agent: AgentDefinition = {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test agent',
        type: AgentType.EXPERT,
        capabilities: ['test', 'mock'],
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { type: 'string' },
          },
        },
        process: async (_input: any) => ({
          success: true,
          data: { result: 'processed' },
        }),
      };

      expect(agent.name).toBe('test-agent');
      expect(agent.version).toBe('1.0.0');
      expect(agent.type).toBe(AgentType.EXPERT);
      expect(agent.capabilities).toEqual(['test', 'mock']);
      expect(agent.inputSchema).toBeDefined();
      expect(agent.outputSchema).toBeDefined();
      expect(typeof agent.process).toBe('function');
    });

    it('应该支持可选的方法', () => {
      const agentWithOptionalMethods: AgentDefinition = {
        name: 'full-agent',
        version: '1.0.0',
        description: 'Agent with optional methods',
        type: AgentType.DECISION,
        capabilities: ['decision'],
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
        process: async (_input: any) => ({
          success: true,
          data: { decision: 'route' },
        }),
        canHandle: (input: any) => Boolean(input),
        getStatus: () => ({
          name: 'full-agent',
          type: AgentType.DECISION,
          status: 'idle',
          capabilities: ['decision'],
        }),
      };

      expect(typeof agentWithOptionalMethods.canHandle).toBe('function');
      expect(typeof agentWithOptionalMethods.getStatus).toBe('function');
    });

    it('应该支持异步处理', async () => {
      const agent: AgentDefinition = {
        name: 'async-agent',
        version: '1.0.0',
        description: 'Async processing agent',
        type: AgentType.EXPERT,
        capabilities: ['async'],
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
        process: async (input: any) => {
          // 模拟异步处理
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            success: true,
            data: { processed: input },
            executionTime: 100,
          };
        },
      };

      const result = await agent.process({ test: 'data' });

      expect(result.success).toBe(true);
      expect(result.data.processed).toEqual({ test: 'data' });
      expect(result.executionTime).toBe(100);
    });
  });

  describe('接口兼容性测试', () => {
    it('所有Agent类型都应该有正确的值', () => {
      expect(AgentType.DECISION).toBe('decision');
      expect(AgentType.EXPERT).toBe('expert');
      expect(AgentType.TOOL).toBe('tool');
      expect(AgentType.COORDINATOR).toBe('coordinator');
    });

    it('AgentResult应该支持所有字段', () => {
      const result: AgentResult = {
        success: true,
        data: { test: 'data' },
        error: undefined,
        metadata: { source: 'test' },
        executionTime: 100,
        memoryUsage: 512,
        functionsUsed: ['func1'],
        agentsUsed: ['agent1'],
      };

      expect(result.success).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.metadata).toBeDefined();
      expect(result.executionTime).toBeDefined();
      expect(result.memoryUsage).toBeDefined();
      expect(result.functionsUsed).toBeDefined();
      expect(result.agentsUsed).toBeDefined();
    });

    it('AgentStatus应该支持所有状态值', () => {
      const statuses: AgentStatus[] = [
        {
          name: 'agent1',
          type: AgentType.EXPERT,
          status: 'idle',
          capabilities: ['test'],
        },
        {
          name: 'agent2',
          type: AgentType.DECISION,
          status: 'busy',
          capabilities: ['decision'],
        },
        {
          name: 'agent3',
          type: AgentType.TOOL,
          status: 'error',
          capabilities: ['tool'],
        },
        {
          name: 'agent4',
          type: AgentType.COORDINATOR,
          status: 'offline',
          capabilities: ['coordinate'],
        },
      ];

      statuses.forEach((status) => {
        expect(status.name).toBeDefined();
        expect(status.type).toBeDefined();
        expect(status.status).toMatch(/^(idle|busy|error|offline)$/);
        expect(Array.isArray(status.capabilities)).toBe(true);
      });
    });
  });
});
