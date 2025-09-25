/**
 * @jest-environment node
 * 
 * Calculator 工具函数测试
 */

import { calculatorFunction } from '../../../../packages/@agent-tools/calculation/calculator';

describe('CalculatorFunction', () => {
  it('应该成功执行基础数学运算', async () => {
    // 加法测试
    let result = await calculatorFunction.execute({
      operation: 'add',
      numbers: [5, 3]
    });
    expect(result.success).toBe(true);
    expect(result.data?.result).toBe(8);

    // 减法测试
    result = await calculatorFunction.execute({
      operation: 'subtract',
      numbers: [10, 4]
    });
    expect(result.success).toBe(true);
    expect(result.data?.result).toBe(6);

    // 乘法测试
    result = await calculatorFunction.execute({
      operation: 'multiply',
      numbers: [3, 4]
    });
    expect(result.success).toBe(true);
    expect(result.data?.result).toBe(12);

    // 除法测试
    result = await calculatorFunction.execute({
      operation: 'divide',
      numbers: [15, 3]
    });
    expect(result.success).toBe(true);
    expect(result.data?.result).toBe(5);
  });

  it('应该处理多个数字的运算', async () => {
    // 多个数字加法
    let result = await calculatorFunction.execute({
      operation: 'add',
      numbers: [1, 2, 3, 4, 5]
    });
    expect(result.success).toBe(true);
    expect(result.data?.result).toBe(15);

    // 多个数字乘法
    result = await calculatorFunction.execute({
      operation: 'multiply',
      numbers: [2, 3, 4]
    });
    expect(result.success).toBe(true);
    expect(result.data?.result).toBe(24);
  });

  it('应该处理无效输入', async () => {
    const result = await calculatorFunction.execute({
      operation: 'divide',
      numbers: [10, 0] // 除零
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该验证输入schema', () => {
    const validInput = {
      operation: 'add',
      numbers: [1, 2, 3]
    };
    
    const invalidInput = {
      operation: 'invalid' as any, // 无效操作
      numbers: 'not-array' // 应该是数组
    } as any;
    
    if (calculatorFunction.validate) {
      const validResult = calculatorFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = calculatorFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      operation: 'add',
      numbers: [1, 2, 3]
    };
    
    const result = await calculatorFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.operation).toBe('add');
    expect(result.metadata?.inputCount).toBe(3);
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该支持高级运算', async () => {
    // 幂运算
    let result = await calculatorFunction.execute({
      operation: 'power',
      numbers: [2, 3]
    });
    expect(result.success).toBe(true);
    expect(result.data?.result).toBe(8);

    // 开方运算
    result = await calculatorFunction.execute({
      operation: 'sqrt',
      numbers: [16]
    });
    expect(result.success).toBe(true);
    expect(result.data?.result).toBe(4);
  });

  it('应该处理空数组输入', async () => {
    const result = await calculatorFunction.execute({
      operation: 'add',
      numbers: []
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
