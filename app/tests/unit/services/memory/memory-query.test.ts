/**
 * 记忆查询服务单元测试
 */

import { memoryQueryFunction } from '../../../../packages/@agent-services/memory/memory-query';

describe('MemoryQueryFunction', () => {
  describe('搜索消息', () => {
    it('应该成功搜索消息', async () => {
      const input = {
        operation: 'search',
        query: 'test',
        limit: 5
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.messages).toBeDefined();
      expect(Array.isArray(result.data?.messages)).toBe(true);
      expect(result.data?.count).toBeDefined();
    });

    it('应该支持Agent过滤', async () => {
      const input = {
        operation: 'search',
        query: 'test',
        agentId: 'test-agent',
        limit: 10
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.messages).toBeDefined();
    });

    it('应该支持时间范围过滤', async () => {
      const input = {
        operation: 'search',
        query: 'test',
        timeRange: {
          start: Date.now() - 3600000,
          end: Date.now() + 3600000
        },
        limit: 10
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.messages).toBeDefined();
    });

    it('应该验证搜索参数', () => {
      const invalidInput = {
        operation: 'search'
        // 缺少 query
      };

      if (memoryQueryFunction.validate) {
        const validation = memoryQueryFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Query is required for search and find-similar operations.');
      }
    });
  });

  describe('查找相似消息', () => {
    it('应该成功查找相似消息', async () => {
      const input = {
        operation: 'find-similar',
        query: 'help project',
        similarityThreshold: 0.5,
        limit: 10
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.similarMessages).toBeDefined();
      expect(Array.isArray(result.data?.similarMessages)).toBe(true);
      expect(result.data?.relevance).toBeDefined();
    });

    it('应该支持自定义相似性阈值', async () => {
      const input = {
        operation: 'find-similar',
        query: 'test query',
        similarityThreshold: 0.8
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.similarMessages).toBeDefined();
    });

    it('应该验证相似性阈值范围', () => {
      const invalidInput = {
        operation: 'find-similar',
        query: 'test',
        similarityThreshold: 1.5 // 超出范围
      };

      if (memoryQueryFunction.validate) {
        const validation = memoryQueryFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Similarity threshold must be between 0 and 1.');
      }
    });
  });

  describe('获取上下文', () => {
    it('应该成功获取上下文', async () => {
      const input = {
        operation: 'get-context',
        agentId: 'test-agent',
        contextWindow: 5
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.context).toBeDefined();
      expect(typeof result.data?.context).toBe('string');
      expect(result.data?.messages).toBeDefined();
      expect(result.data?.count).toBeDefined();
    });

    it('应该支持自定义上下文窗口', async () => {
      const input = {
        operation: 'get-context',
        contextWindow: 10
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.context).toBeDefined();
    });
  });

  describe('获取历史消息', () => {
    it('应该成功获取历史消息', async () => {
      const input = {
        operation: 'get-history',
        agentId: 'test-agent',
        limit: 20
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.history).toBeDefined();
      expect(Array.isArray(result.data?.history)).toBe(true);
      expect(result.data?.count).toBeDefined();
    });

    it('应该支持时间范围过滤', async () => {
      const input = {
        operation: 'get-history',
        timeRange: {
          start: Date.now() - 86400000, // 1天前
          end: Date.now()
        },
        limit: 10
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.history).toBeDefined();
    });
  });

  describe('获取对话摘要', () => {
    it('应该成功生成对话摘要', async () => {
      const input = {
        operation: 'get-summary',
        agentId: 'test-agent',
        sessionId: 'test-session'
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.summary).toBeDefined();
      expect(typeof result.data?.summary).toBe('string');
      expect(result.data?.count).toBeDefined();
    });

    it('应该处理空消息的情况', async () => {
      const input = {
        operation: 'get-summary',
        agentId: 'non-existent-agent'
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.summary).toBeDefined();
      // 注意：由于mockGetMessages返回模拟数据，实际测试中会有消息
      expect(typeof result.data?.summary).toBe('string');
    });
  });

  describe('错误处理', () => {
    it('应该处理不支持的操作', async () => {
      const input = {
        operation: 'unsupported' as any
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('元数据', () => {
    it('应该返回正确的元数据', async () => {
      const input = {
        operation: 'search',
        query: 'test query'
      };

      const result = await memoryQueryFunction.execute(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.operation).toBe('search');
      expect(result.metadata?.query).toBe('test query');
      expect(result.executionTime).toBeDefined();
      expect(typeof result.executionTime).toBe('number');
    });
  });
});
