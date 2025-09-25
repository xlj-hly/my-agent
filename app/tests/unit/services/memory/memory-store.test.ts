/**
 * 记忆存储服务单元测试
 */

import { memoryStoreFunction } from '../../../../packages/@agent-services/memory/memory-store';

describe('MemoryStoreFunction', () => {
  const testMessage = {
    id: 'test-1',
    content: 'Test message content',
    timestamp: Date.now(),
    agentId: 'test-agent',
    sessionId: 'test-session'
  };

  beforeEach(async () => {
    // 清理测试数据
    await memoryStoreFunction.execute({ operation: 'clear' });
  });

  describe('添加消息', () => {
    it('应该成功添加消息', async () => {
      const input = {
        operation: 'add',
        message: testMessage
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
      expect(result.data?.message).toEqual(testMessage);
    });

    it('应该验证输入参数', () => {
      const invalidInput = {
        operation: 'add'
        // 缺少 message
      };

      if (memoryStoreFunction.validate) {
        const validation = memoryStoreFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Message is required for add operation.');
      }
    });
  });

  describe('获取消息', () => {
    beforeEach(async () => {
      // 添加测试消息
      await memoryStoreFunction.execute({
        operation: 'add',
        message: testMessage
      });
    });

    it('应该成功获取消息', async () => {
      const input = {
        operation: 'get',
        filter: {
          agentId: 'test-agent',
          limit: 10
        }
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.messages).toBeDefined();
      expect(Array.isArray(result.data?.messages)).toBe(true);
      expect(result.data?.messages!.length).toBeGreaterThan(0);
      expect(result.data?.count).toBe(result.data?.messages!.length);
    });

    it('应该支持时间范围过滤', async () => {
      const now = Date.now();
      const filter = {
        startTime: now - 3600000, // 1小时前
        endTime: now + 3600000,   // 1小时后
        limit: 10
      };

      const result = await memoryStoreFunction.execute({
        operation: 'get',
        filter
      });

      expect(result.success).toBe(true);
      expect(result.data?.messages).toBeDefined();
    });

    it('应该验证过滤器参数', () => {
      const invalidInput = {
        operation: 'get'
        // 缺少 filter
      };

      if (memoryStoreFunction.validate) {
        const validation = memoryStoreFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Filter is required for get operation.');
      }
    });
  });

  describe('更新消息', () => {
    beforeEach(async () => {
      await memoryStoreFunction.execute({
        operation: 'add',
        message: testMessage
      });
    });

    it('应该成功更新消息', async () => {
      const updatedMessage = {
        ...testMessage,
        content: 'Updated message content'
      };

      const input = {
        operation: 'update',
        messageId: testMessage.id,
        message: updatedMessage
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
      expect(result.data?.message?.content).toBe('Updated message content');
    });

    it('应该处理不存在的消息', async () => {
      const input = {
        operation: 'update',
        messageId: 'non-existent',
        message: { 
          ...testMessage,
          content: 'Updated content' 
        }
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Message not found');
    });

    it('应该验证更新参数', () => {
      const invalidInput = {
        operation: 'update',
        messageId: 'test-id'
        // 缺少 message
      };

      if (memoryStoreFunction.validate) {
        const validation = memoryStoreFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('MessageId and message are required for update operation.');
      }
    });
  });

  describe('删除消息', () => {
    beforeEach(async () => {
      await memoryStoreFunction.execute({
        operation: 'add',
        message: testMessage
      });
    });

    it('应该成功删除消息', async () => {
      const input = {
        operation: 'delete',
        messageId: testMessage.id
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
    });

    it('应该处理不存在的消息', async () => {
      const input = {
        operation: 'delete',
        messageId: 'non-existent'
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(false);
    });

    it('应该验证删除参数', () => {
      const invalidInput = {
        operation: 'delete'
        // 缺少 messageId
      };

      if (memoryStoreFunction.validate) {
        const validation = memoryStoreFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('MessageId is required for delete operation.');
      }
    });
  });

  describe('清理操作', () => {
    beforeEach(async () => {
      // 添加多个测试消息
      for (let i = 0; i < 5; i++) {
        await memoryStoreFunction.execute({
          operation: 'add',
          message: {
            ...testMessage,
            id: `test-${i}`,
            content: `Test message ${i}`
          }
        });
      }
    });

    it('应该成功清理所有消息', async () => {
      const input = {
        operation: 'clear'
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
      expect(result.data?.count).toBe(5);
    });

    it('应该返回统计信息', async () => {
      const input = {
        operation: 'stats'
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.stats).toBeDefined();
      expect(result.data?.stats?.totalMessages).toBe(5);
      expect(result.data?.stats?.totalSessions).toBeDefined();
      expect(result.data?.stats?.memoryUsage).toBeDefined();
    });

    it('应该执行清理操作', async () => {
      const input = {
        operation: 'cleanup'
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
      expect(result.data?.count).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该处理不支持的操作', async () => {
      const input = {
        operation: 'unsupported' as any
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('元数据', () => {
    it('应该返回正确的元数据', async () => {
      const input = {
        operation: 'add',
        message: testMessage
      };

      const result = await memoryStoreFunction.execute(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.operation).toBe('add');
      expect(result.executionTime).toBeDefined();
      expect(typeof result.executionTime).toBe('number');
    });
  });
});
