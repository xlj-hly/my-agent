/**
 * @jest-environment node
 * 
 * Statistics 工具函数测试
 */

import { statisticsFunction } from '../../../../packages/@agent-tools/calculation/statistics';

describe('StatisticsFunction', () => {
  it('应该成功计算描述性统计', async () => {
    const input = {
      data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      operations: ['mean', 'median', 'mode', 'variance', 'stddev']    };
    
    const result = await statisticsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.mean).toBe(5.5);
    expect(result.data?.median).toBe(5.5);
    expect(result.data?.variance).toBeCloseTo(8.25, 2);
    expect(result.data?.stddev).toBeCloseTo(2.87, 1);
  });

  it('应该处理单个数字的数据集', async () => {
    const input = {
      data: [42],
      operations: ['mean', 'median', 'stddev']    };
    
    const result = await statisticsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.mean).toBe(42);
    expect(result.data?.median).toBe(42);
    expect(result.data?.stddev).toBe(0);
  });

  it('应该处理重复数字的数据集', async () => {
    const input = {
      data: [5, 5, 5, 5, 5],
      operations: ['mean', 'median', 'mode']    };
    
    const result = await statisticsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.mean).toBe(5);
    expect(result.data?.median).toBe(5);
    expect(result.data?.mode).toBe(5);
  });

  it('应该处理无效输入', async () => {
    const input = {
      data: [], // 空数组
      operations: ['mean']    };
    
    const result = await statisticsFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该验证输入schema', () => {
    const validInput = {
      data: [1, 2, 3, 4, 5],
      operations: ['mean', 'median']    };
    
    const invalidInput = {
      data: 'not-array', // 应该是数组
      operations: ['invalid-operation'] // 无效操作
    } as any;
    
    if (statisticsFunction.validate) {
      const validResult = statisticsFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = statisticsFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      data: [1, 2, 3, 4, 5],
      operations: ['mean', 'median']    };
    
    const result = await statisticsFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.dataLength).toBe(5);
    expect(result.metadata?.operations).toEqual(['mean', 'median']);
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该支持分位数计算', async () => {
    const input = {
      data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      operations: ['percentile'],
      percentile: 25
    };
    
    const result = await statisticsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.percentile25).toBeDefined();
  });

  it('应该处理包含非数字的数据', async () => {
    const input = {
      data: [1, 2, 'invalid', 4, 5] as any,
      operations: ['mean']    };
    
    const result = await statisticsFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该支持所有统计运算', async () => {
    const input = {
      data: [1, 2, 2, 3, 4, 4, 4, 5],
      operations: ['mean', 'median', 'mode', 'variance', 'stddev', 'min', 'max', 'range']    };
    
    const result = await statisticsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.mean).toBeDefined();
    expect(result.data?.median).toBeDefined();
    expect(result.data?.mode).toBe(4);
    expect(result.data?.variance).toBeDefined();
    expect(result.data?.stddev).toBeDefined();
    expect(result.data?.min).toBe(1);
    expect(result.data?.max).toBe(5);
    expect(result.data?.range).toBe(4);
  });
});
