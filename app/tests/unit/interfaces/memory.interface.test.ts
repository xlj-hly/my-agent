/**
 * Memory接口测试
 */

import {
  MemoryType,
  MemoryMessage,
  MessageFilter,
  MemoryContext,
  Session,
  MemoryStats,
  MemoryConfig,
} from '../../../packages/@agent-core';

describe('Memory接口测试', () => {
  describe('MemoryType枚举', () => {
    it('应该包含所有预期的记忆类型', () => {
      expect(MemoryType.CENTRALIZED).toBe('centralized');
      expect(MemoryType.DISTRIBUTED).toBe('distributed');
      expect(MemoryType.HYBRID).toBe('hybrid');
    });

    it('应该支持所有记忆类型', () => {
      const types = Object.values(MemoryType);
      expect(types).toContain('centralized');
      expect(types).toContain('distributed');
      expect(types).toContain('hybrid');
      expect(types).toHaveLength(3);
    });
  });

  describe('MemoryMessage接口', () => {
    it('应该正确创建MemoryMessage对象', () => {
      const message: MemoryMessage = {
        id: 'msg-123',
        content: 'Hello World',
        type: 'user',
        timestamp: Date.now(),
        agentId: 'agent-456',
        sessionId: 'session-789',
        metadata: {
          source: 'web',
          priority: 'high',
        },
      };

      expect(message.id).toBe('msg-123');
      expect(message.content).toBe('Hello World');
      expect(message.type).toBe('user');
      expect(message.agentId).toBe('agent-456');
      expect(message.sessionId).toBe('session-789');
      expect(message.metadata?.source).toBe('web');
    });

    it('应该支持不同的消息类型', () => {
      const userMessage: MemoryMessage = {
        id: '1',
        content: 'User message',
        type: 'user',
        timestamp: Date.now(),
      };

      const assistantMessage: MemoryMessage = {
        id: '2',
        content: 'Assistant message',
        type: 'assistant',
        timestamp: Date.now(),
      };

      const systemMessage: MemoryMessage = {
        id: '3',
        content: 'System message',
        type: 'system',
        timestamp: Date.now(),
      };

      const functionMessage: MemoryMessage = {
        id: '4',
        content: 'Function message',
        type: 'function',
        timestamp: Date.now(),
      };

      expect(userMessage.type).toBe('user');
      expect(assistantMessage.type).toBe('assistant');
      expect(systemMessage.type).toBe('system');
      expect(functionMessage.type).toBe('function');
    });

    it('应该支持可选的属性', () => {
      const minimalMessage: MemoryMessage = {
        id: 'minimal',
        content: 'Minimal message',
        type: 'user',
        timestamp: Date.now(),
      };

      expect(minimalMessage.agentId).toBeUndefined();
      expect(minimalMessage.sessionId).toBeUndefined();
      expect(minimalMessage.metadata).toBeUndefined();
    });
  });

  describe('MessageFilter接口', () => {
    it('应该正确创建MessageFilter对象', () => {
      const filter: MessageFilter = {
        agentId: 'agent-123',
        sessionId: 'session-456',
        type: 'user',
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        limit: 10,
        offset: 0,
      };

      expect(filter.agentId).toBe('agent-123');
      expect(filter.sessionId).toBe('session-456');
      expect(filter.type).toBe('user');
      expect(filter.startTime).toBeDefined();
      expect(filter.endTime).toBeDefined();
      expect(filter.limit).toBe(10);
      expect(filter.offset).toBe(0);
    });

    it('应该支持可选的过滤条件', () => {
      const partialFilter: MessageFilter = {
        type: 'system',
        limit: 5,
      };

      expect(partialFilter.type).toBe('system');
      expect(partialFilter.limit).toBe(5);
      expect(partialFilter.agentId).toBeUndefined();
      expect(partialFilter.sessionId).toBeUndefined();
    });
  });

  describe('MemoryContext接口', () => {
    it('应该正确创建MemoryContext对象', () => {
      const context: MemoryContext = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        userId: 'user-789',
        metadata: {
          theme: 'dark',
          language: 'zh-CN',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(context.sessionId).toBe('session-123');
      expect(context.agentId).toBe('agent-456');
      expect(context.userId).toBe('user-789');
      expect(context.metadata?.theme).toBe('dark');
      expect(context.createdAt).toBeDefined();
      expect(context.updatedAt).toBeDefined();
    });

    it('应该支持最小配置', () => {
      const minimalContext: MemoryContext = {
        sessionId: 'session-minimal',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(minimalContext.sessionId).toBe('session-minimal');
      expect(minimalContext.agentId).toBeUndefined();
      expect(minimalContext.userId).toBeUndefined();
      expect(minimalContext.metadata).toBeUndefined();
    });
  });

  describe('Session接口', () => {
    it('应该正确创建Session对象', () => {
      const session: Session = {
        id: 'session-123',
        agentId: 'agent-456',
        userId: 'user-789',
        createdAt: Date.now(),
        lastActivity: Date.now() + 3600000,
        metadata: {
          userAgent: 'Mozilla/5.0',
          ip: '192.168.1.1',
        },
      };

      expect(session.id).toBe('session-123');
      expect(session.agentId).toBe('agent-456');
      expect(session.userId).toBe('user-789');
      expect(session.createdAt).toBeDefined();
      expect(session.lastActivity).toBeDefined();
      expect(session.metadata?.userAgent).toBe('Mozilla/5.0');
    });

    it('应该支持最小配置', () => {
      const minimalSession: Session = {
        id: 'session-minimal',
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      expect(minimalSession.id).toBe('session-minimal');
      expect(minimalSession.agentId).toBeUndefined();
      expect(minimalSession.userId).toBeUndefined();
      expect(minimalSession.metadata).toBeUndefined();
    });
  });

  describe('MemoryStats接口', () => {
    it('应该正确创建MemoryStats对象', () => {
      const stats: MemoryStats = {
        totalMessages: 1000,
        totalSessions: 50,
        averageMessageLength: 128,
        memoryUsage: 1024000,
        lastCleanup: Date.now(),
      };

      expect(stats.totalMessages).toBe(1000);
      expect(stats.totalSessions).toBe(50);
      expect(stats.averageMessageLength).toBe(128);
      expect(stats.memoryUsage).toBe(1024000);
      expect(stats.lastCleanup).toBeDefined();
    });

    it('应该支持可选的清理时间', () => {
      const statsWithoutCleanup: MemoryStats = {
        totalMessages: 500,
        totalSessions: 25,
        averageMessageLength: 64,
        memoryUsage: 512000,
      };

      expect(statsWithoutCleanup.totalMessages).toBe(500);
      expect(statsWithoutCleanup.lastCleanup).toBeUndefined();
    });
  });

  describe('MemoryConfig接口', () => {
    it('应该正确创建MemoryConfig对象', () => {
      const config: MemoryConfig = {
        type: MemoryType.CENTRALIZED,
        maxMessages: 10000,
        maxSessions: 100,
        cleanupInterval: 3600000,
        storage: {
          type: 'redis',
          host: 'localhost',
          port: 6379,
        },
      };

      expect(config.type).toBe(MemoryType.CENTRALIZED);
      expect(config.maxMessages).toBe(10000);
      expect(config.maxSessions).toBe(100);
      expect(config.cleanupInterval).toBe(3600000);
      expect(config.storage?.type).toBe('redis');
    });

    it('应该支持最小配置', () => {
      const minimalConfig: MemoryConfig = {
        type: MemoryType.DISTRIBUTED,
      };

      expect(minimalConfig.type).toBe(MemoryType.DISTRIBUTED);
      expect(minimalConfig.maxMessages).toBeUndefined();
      expect(minimalConfig.maxSessions).toBeUndefined();
      expect(minimalConfig.cleanupInterval).toBeUndefined();
      expect(minimalConfig.storage).toBeUndefined();
    });

    it('应该支持自定义属性', () => {
      const customConfig: MemoryConfig = {
        type: MemoryType.HYBRID,
        customProperty: 'custom-value',
        anotherProperty: 123,
      };

      expect(customConfig.type).toBe(MemoryType.HYBRID);
      expect(customConfig.customProperty).toBe('custom-value');
      expect(customConfig.anotherProperty).toBe(123);
    });
  });

  describe('接口兼容性测试', () => {
    it('所有记忆类型都应该有正确的值', () => {
      expect(MemoryType.CENTRALIZED).toBe('centralized');
      expect(MemoryType.DISTRIBUTED).toBe('distributed');
      expect(MemoryType.HYBRID).toBe('hybrid');
    });

    it('MemoryMessage应该支持所有消息类型', () => {
      const messageTypes = ['user', 'assistant', 'system', 'function'];

      messageTypes.forEach((type) => {
        const message: MemoryMessage = {
          id: `msg-${type}`,
          content: `${type} message`,
          type: type as any,
          timestamp: Date.now(),
        };

        expect(message.type).toBe(type);
      });
    });

    it('所有接口都应该支持时间戳', () => {
      const now = Date.now();

      const message: MemoryMessage = {
        id: '1',
        content: 'test',
        type: 'user',
        timestamp: now,
      };

      const context: MemoryContext = {
        sessionId: 'session',
        createdAt: now,
        updatedAt: now,
      };

      const session: Session = {
        id: 'session',
        createdAt: now,
        lastActivity: now,
      };

      expect(message.timestamp).toBe(now);
      expect(context.createdAt).toBe(now);
      expect(context.updatedAt).toBe(now);
      expect(session.createdAt).toBe(now);
      expect(session.lastActivity).toBe(now);
    });

    it('配置对象应该支持灵活的属性', () => {
      const configs: MemoryConfig[] = [
        {
          type: MemoryType.CENTRALIZED,
          maxMessages: 1000,
        },
        {
          type: MemoryType.DISTRIBUTED,
          maxSessions: 50,
          customSetting: true,
        },
        {
          type: MemoryType.HYBRID,
          cleanupInterval: 1800000,
          storage: { type: 'memory' },
          anotherCustom: 'value',
        },
      ];

      configs.forEach((config) => {
        expect(config.type).toBeDefined();
        expect(Object.values(MemoryType)).toContain(config.type);
      });
    });
  });
});
