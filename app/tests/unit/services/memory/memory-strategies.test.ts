/**
 * 记忆策略服务单元测试
 */

import { memoryStrategyFunction, MemoryStrategyType } from '../../../../packages/@agent-services/memory/memory-strategies';

describe('MemoryStrategyFunction', () => {
  describe('获取可用策略', () => {
    it('应该返回所有可用的策略类型', async () => {
      const input = {
        operation: 'get-available'
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.availableStrategies).toBeDefined();
      expect(Array.isArray(result.data?.availableStrategies)).toBe(true);
      expect(result.data?.availableStrategies).toContain(MemoryStrategyType.CENTRALIZED);
      expect(result.data?.availableStrategies).toContain(MemoryStrategyType.DISTRIBUTED);
      expect(result.data?.availableStrategies).toContain(MemoryStrategyType.HYBRID);
    });
  });

  describe('获取当前策略', () => {
    it('应该返回当前使用的策略', async () => {
      const input = {
        operation: 'get-current'
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.currentStrategy).toBeDefined();
      expect([
        MemoryStrategyType.CENTRALIZED,
        MemoryStrategyType.DISTRIBUTED,
        MemoryStrategyType.HYBRID
      ]).toContain(result.data?.currentStrategy);
    });
  });

  describe('选择策略', () => {
    it('应该成功选择集中式策略', async () => {
      const input = {
        operation: 'select',
        strategyType: MemoryStrategyType.CENTRALIZED
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.currentStrategy).toBe(MemoryStrategyType.CENTRALIZED);
      expect(result.data?.success).toBe(true);
      expect(result.data?.message).toContain('Selected centralized strategy');
    });

    it('应该成功选择分布式策略', async () => {
      const input = {
        operation: 'select',
        strategyType: MemoryStrategyType.DISTRIBUTED
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.currentStrategy).toBe(MemoryStrategyType.DISTRIBUTED);
      expect(result.data?.success).toBe(true);
      expect(result.data?.message).toContain('Selected distributed strategy');
    });

    it('应该成功选择混合策略', async () => {
      const input = {
        operation: 'select',
        strategyType: MemoryStrategyType.HYBRID
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.currentStrategy).toBe(MemoryStrategyType.HYBRID);
      expect(result.data?.success).toBe(true);
      expect(result.data?.message).toContain('Selected hybrid strategy');
    });

    it('应该验证选择参数', () => {
      const invalidInput = {
        operation: 'select'
        // 缺少 strategyType
      };

      if (memoryStrategyFunction.validate) {
        const validation = memoryStrategyFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Strategy type is required for select and switch operations.');
      }
    });
  });

  describe('切换策略', () => {
    it('应该成功切换到集中式策略', async () => {
      const input = {
        operation: 'switch',
        strategyType: MemoryStrategyType.CENTRALIZED
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.switchedTo).toBe(MemoryStrategyType.CENTRALIZED);
      expect(result.data?.success).toBe(true);
      expect(result.data?.message).toContain('Switched to centralized strategy');
    });

    it('应该成功切换到分布式策略', async () => {
      const input = {
        operation: 'switch',
        strategyType: MemoryStrategyType.DISTRIBUTED
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.switchedTo).toBe(MemoryStrategyType.DISTRIBUTED);
      expect(result.data?.success).toBe(true);
      expect(result.data?.message).toContain('Switched to distributed strategy');
    });

    it('应该成功切换到混合策略', async () => {
      const input = {
        operation: 'switch',
        strategyType: MemoryStrategyType.HYBRID
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.switchedTo).toBe(MemoryStrategyType.HYBRID);
      expect(result.data?.success).toBe(true);
      expect(result.data?.message).toContain('Switched to hybrid strategy');
    });

    it('应该支持策略配置', async () => {
      const config = {
        maxMessages: 5000,
        maxSessions: 500,
        cleanupInterval: 1800000
      };

      const input = {
        operation: 'switch',
        strategyType: MemoryStrategyType.CENTRALIZED,
        config
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.switchedTo).toBe(MemoryStrategyType.CENTRALIZED);
    });

    it('应该验证切换参数', () => {
      const invalidInput = {
        operation: 'switch'
        // 缺少 strategyType
      };

      if (memoryStrategyFunction.validate) {
        const validation = memoryStrategyFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Strategy type is required for select and switch operations.');
      }
    });
  });

  describe('错误处理', () => {
    it('应该处理不支持的操作', async () => {
      const input = {
        operation: 'unsupported' as any
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('元数据', () => {
    it('应该返回正确的元数据', async () => {
      const input = {
        operation: 'select',
        strategyType: MemoryStrategyType.CENTRALIZED
      };

      const result = await memoryStrategyFunction.execute(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.operation).toBe('select');
      expect(result.metadata?.strategyType).toBe(MemoryStrategyType.CENTRALIZED);
      expect(result.executionTime).toBeDefined();
      expect(typeof result.executionTime).toBe('number');
    });
  });

  describe('策略类型枚举', () => {
    it('应该包含所有预定义的策略类型', () => {
      expect(MemoryStrategyType.CENTRALIZED).toBe('centralized');
      expect(MemoryStrategyType.DISTRIBUTED).toBe('distributed');
      expect(MemoryStrategyType.HYBRID).toBe('hybrid');
    });
  });
});

