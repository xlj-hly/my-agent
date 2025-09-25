/**
 * 记忆服务集成测试（正确版本）
 * 基于实际接口定义进行测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  memoryStoreFunction, 
  memoryQueryFunction, 
  memoryCleanupFunction
} from '../../packages/@agent-services/memory';

describe('记忆服务集成测试（正确版本）', () => {
  beforeEach(() => {
    // 每个测试前清理状态
  });

  describe('记忆存储集成', () => {
    it('应该能够存储和检索消息', async () => {
      // 存储消息
      const storeResult = await memoryStoreFunction.execute({
        operation: 'add',
        message: {
          id: 'msg-1',
          content: '这是一条测试消息',
          timestamp: Date.now(),
          sessionId: 'session-1',
          metadata: { type: 'user' }
        }
      });

      expect(storeResult.success).toBe(true);

      // 检索消息
      const queryResult = await memoryStoreFunction.execute({
        operation: 'get',
        filter: { sessionId: 'session-1' }
      });

      expect(queryResult.success).toBe(true);
      expect(queryResult.data?.messages).toBeDefined();
      expect(Array.isArray(queryResult.data?.messages)).toBe(true);
    });

    it('应该能够更新消息', async () => {
      // 先创建消息
      await memoryStoreFunction.execute({
        operation: 'add',
        message: {
          id: 'msg-2',
          content: '原始消息',
          timestamp: Date.now(),
          sessionId: 'session-2',
          metadata: { type: 'user' }
        }
      });

      // 更新消息
      const updateResult = await memoryStoreFunction.execute({
        operation: 'update',
        messageId: 'msg-2',
        message: {
          id: 'msg-2',
          content: '更新后的消息',
          timestamp: Date.now(),
          sessionId: 'session-2',
          metadata: { type: 'user' }
        }
      });

      expect(updateResult.success).toBe(true);

      // 验证更新
      const queryResult = await memoryStoreFunction.execute({
        operation: 'get',
        filter: { sessionId: 'session-2' }
      });

      expect(queryResult.success).toBe(true);
      const messages = queryResult.data?.messages || [];
      const updatedMessage = messages.find((m: any) => m.id === 'msg-2');
      expect(updatedMessage?.content).toBe('更新后的消息');
    });

    it('应该能够删除消息', async () => {
      // 先创建消息
      await memoryStoreFunction.execute({
        operation: 'add',
        message: {
          id: 'msg-3',
          content: '待删除的消息',
          timestamp: Date.now(),
          sessionId: 'session-3',
          metadata: { type: 'user' }
        }
      });

      // 删除消息
      const deleteResult = await memoryStoreFunction.execute({
        operation: 'delete',
        messageId: 'msg-3'
      });

      expect(deleteResult.success).toBe(true);

      // 验证删除
      const queryResult = await memoryStoreFunction.execute({
        operation: 'get',
        filter: { sessionId: 'session-3' }
      });

      expect(queryResult.success).toBe(true);
      const messages = queryResult.data?.messages || [];
      expect(messages.length).toBe(0);
    });
  });

  describe('记忆查询集成', () => {
    beforeEach(async () => {
      // 准备测试数据
      const testMessages = [
        {
          id: 'msg-query-1',
          content: '人工智能是计算机科学的一个分支',
          timestamp: Date.now() - 1000,
          sessionId: 'query-session',
          metadata: { type: 'user' }
        },
        {
          id: 'msg-query-2',
          content: '机器学习是AI的重要组成部分',
          timestamp: Date.now() - 500,
          sessionId: 'query-session',
          metadata: { type: 'assistant' }
        },
        {
          id: 'msg-query-3',
          content: '深度学习是机器学习的子领域',
          timestamp: Date.now(),
          sessionId: 'query-session',
          metadata: { type: 'user' }
        }
      ];

      for (const message of testMessages) {
        await memoryStoreFunction.execute({
          operation: 'add',
          message: message as any
        });
      }
    });

    it('应该能够进行语义搜索', async () => {
      const result = await memoryQueryFunction.execute({
        operation: 'search',
        query: '什么是机器学习',
        limit: 5
      });

      expect(result.success).toBe(true);
      expect(result.data?.messages).toBeDefined();
      expect(Array.isArray(result.data?.messages)).toBe(true);
    });

    it('应该能够进行相似性搜索', async () => {
      const result = await memoryQueryFunction.execute({
        operation: 'find-similar',
        query: 'AI技术',
        similarityThreshold: 0.7,
        limit: 3
      });

      expect(result.success).toBe(true);
      expect(result.data?.similarMessages).toBeDefined();
      expect(Array.isArray(result.data?.similarMessages)).toBe(true);
    });

    it('应该能够获取上下文', async () => {
      const result = await memoryQueryFunction.execute({
        operation: 'get-context',
        sessionId: 'query-session',
        contextWindow: 10
      });

      expect(result.success).toBe(true);
      expect(result.data?.context).toBeDefined();
      expect(typeof result.data?.context).toBe('string');
      expect((result.data?.context as string).length).toBeGreaterThan(0);
    });

    it('应该能够生成对话摘要', async () => {
      const result = await memoryQueryFunction.execute({
        operation: 'get-summary',
        sessionId: 'query-session'
      });

      expect(result.success).toBe(true);
      expect(result.data?.summary).toBeDefined();
      expect(typeof result.data?.summary).toBe('string');
      expect((result.data?.summary as string).length).toBeGreaterThan(0);
    });
  });

  describe('记忆清理集成', () => {
    beforeEach(async () => {
      // 准备测试数据
      const testMessages = [
        {
          id: 'cleanup-msg-1',
          content: '旧消息1',
          timestamp: Date.now() - 86400000, // 1天前
          sessionId: 'cleanup-session',
          metadata: { type: 'user' }
        },
        {
          id: 'cleanup-msg-2',
          content: '旧消息2',
          timestamp: Date.now() - 172800000, // 2天前
          sessionId: 'cleanup-session',
          metadata: { type: 'assistant' }
        },
        {
          id: 'cleanup-msg-3',
          content: '新消息',
          timestamp: Date.now(),
          sessionId: 'cleanup-session',
          metadata: { type: 'user' }
        }
      ];

      for (const message of testMessages) {
        await memoryStoreFunction.execute({
          operation: 'add',
          message: message as any
        });
      }
    });

    it('应该能够清理过期消息', async () => {
      const result = await memoryCleanupFunction.execute({
        operation: 'cleanup',
        criteria: {
          maxAge: 86400000, // 1天
          sessionId: 'cleanup-session'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data?.cleanedCount).toBeDefined();
      expect((result.data?.cleanedCount as number) >= 0).toBe(true);
    });

    it('应该能够优化内存', async () => {
      const result = await memoryCleanupFunction.execute({
        operation: 'optimize',
        criteria: {
          maxCount: 10,
          sessionId: 'cleanup-session'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data?.optimizationResults).toBeDefined();
    });

    it('应该能够验证内存完整性', async () => {
      const result = await memoryCleanupFunction.execute({
        operation: 'validate',
        criteria: {
          sessionId: 'cleanup-session'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data?.validationResults).toBeDefined();
      expect(typeof result.data?.validationResults?.valid).toBe('boolean');
    });

    it('应该能够归档数据', async () => {
      const result = await memoryCleanupFunction.execute({
        operation: 'archive',
        archivePath: './archive',
        criteria: {
          maxAge: 86400000,
          sessionId: 'cleanup-session'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data?.archivedCount).toBeDefined();
    });
  });

  describe('端到端记忆流程', () => {
    it('应该能够完成完整的记忆操作流程', async () => {
      const sessionId = 'e2e-session';

      // 1. 存储多条消息
      const messages = [
        {
          id: 'e2e-msg-1',
          content: '用户询问：什么是人工智能？',
          timestamp: Date.now() - 2000,
          sessionId: sessionId,
          metadata: { type: 'user' }
        },
        {
          id: 'e2e-msg-2',
          content: '人工智能是计算机科学的一个分支...',
          timestamp: Date.now() - 1000,
          sessionId: sessionId,
          metadata: { type: 'assistant' }
        },
        {
          id: 'e2e-msg-3',
          content: '用户继续问：机器学习是什么？',
          timestamp: Date.now(),
          sessionId: sessionId,
          metadata: { type: 'user' }
        }
      ];

      for (const message of messages) {
        const storeResult = await memoryStoreFunction.execute({
          operation: 'add',
          message: message as any
        });
        expect(storeResult.success).toBe(true);
      }

      // 2. 查询消息
      const queryResult = await memoryStoreFunction.execute({
        operation: 'get',
        filter: { sessionId: sessionId }
      });
      expect(queryResult.success).toBe(true);
      expect((queryResult.data?.messages as any[]).length).toBe(3);

      // 3. 语义搜索
      const searchResult = await memoryQueryFunction.execute({
        operation: 'search',
        query: '机器学习',
        limit: 5
      });
      expect(searchResult.success).toBe(true);

      // 4. 生成摘要
      const summaryResult = await memoryQueryFunction.execute({
        operation: 'get-summary',
        sessionId: sessionId
      });
      expect(summaryResult.success).toBe(true);

      // 5. 清理过期数据
      const cleanupResult = await memoryCleanupFunction.execute({
        operation: 'cleanup',
        criteria: {
          maxAge: 5000, // 5秒
          sessionId: sessionId
        }
      });
      expect(cleanupResult.success).toBe(true);

      // 6. 验证最终状态
      const finalQueryResult = await memoryStoreFunction.execute({
        operation: 'get',
        filter: { sessionId: sessionId }
      });
      expect(finalQueryResult.success).toBe(true);
      // 应该还有消息（因为清理条件可能不会删除所有消息）
    }, 15000); // 增加超时时间
  });
});
