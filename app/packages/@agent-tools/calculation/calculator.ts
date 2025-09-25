/**
 * Calculator 工具函数
 * 提供基础数学运算功能
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';

// 输入接口
export interface CalculatorInput {
  operation: string;
  numbers: number[];
}

// 输出接口
export interface CalculatorOutput {
  result: number;
}

export const calculatorFunction: FunctionCall<CalculatorInput, CalculatorOutput> = {
  name: 'calculator',
  version: '1.0.0',
  description: '执行基础数学运算',
  category: 'calculation',
  tags: ['math', 'arithmetic', 'calculation'],
  
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt'],
        description: '要执行的数学运算',
      },
      numbers: {
        type: 'array',
        items: { type: 'number' },
        description: '参与运算的数字数组',
        minItems: 1,
        maxItems: 10,
      },
    },
    required: ['operation', 'numbers'],
  },
  
  outputSchema: {
    type: 'object',
    properties: {
      result: {
        type: 'number',
        description: '运算结果',
      },
    },
    required: ['result'],
  },
  
  validate: (input: CalculatorInput): ValidationResult => {
    const errors: string[] = [];
    
    if (!input.operation || typeof input.operation !== 'string') {
      errors.push('运算类型是必需的且必须是字符串');
    } else if (!['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt'].includes(input.operation)) {
      errors.push('不支持的运算类型');
    }
    
    if (!Array.isArray(input.numbers)) {
      errors.push('数字数组是必需的且必须是数组');
    } else if (input.numbers.length === 0) {
      errors.push('数字数组不能为空');
    } else if (input.numbers.length > 10) {
      errors.push('数字数组长度不能超过10');
    } else if (!input.numbers.every(n => typeof n === 'number' && !isNaN(n))) {
      errors.push('数字数组中的所有元素必须是有效数字');
    }
    
    // 特定运算的验证
    if (input.operation === 'divide' && input.numbers.length >= 2) {
      if (input.numbers.slice(1).some(n => n === 0)) {
        errors.push('除法运算中除数不能为零');
      }
    }
    
    if (input.operation === 'sqrt' && input.numbers.length !== 1) {
      errors.push('开方运算只能接受一个数字');
    } else if (input.operation === 'sqrt' && input.numbers.length === 1 && input.numbers[0] < 0) {
      errors.push('开方运算的被开方数不能为负数');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  execute: async (
    input: CalculatorInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<CalculatorOutput>> => {
    const startTime = Date.now();
    
    try {
      // 验证输入
      if (calculatorFunction.validate) {
        const validation = calculatorFunction.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: '输入验证失败',
            metadata: { errors: validation.errors },
            executionTime: Date.now() - startTime,
          };
        }
      }
      
      // 执行运算
      const result = performCalculation(input.operation, input.numbers);
      
      return {
        success: true,
        data: { result },
        metadata: {
          operation: input.operation,
          inputCount: input.numbers.length,
          inputs: input.numbers,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `计算失败: ${error.message}`,
        metadata: {
          operation: input.operation,
          inputCount: input.numbers?.length,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  },
};

/**
 * 执行数学运算
 */
function performCalculation(operation: string, numbers: number[]): number {
  switch (operation) {
    case 'add':
      return numbers.reduce((sum, num) => sum + num, 0);
    
    case 'subtract':
      if (numbers.length === 1) {
        return -numbers[0]; // 单数减法返回负数
      }
      return numbers.slice(1).reduce((result, num) => result - num, numbers[0]);
    
    case 'multiply':
      return numbers.reduce((product, num) => product * num, 1);
    
    case 'divide':
      if (numbers.length === 1) {
        return 1 / numbers[0]; // 单数除法返回倒数
      }
      return numbers.slice(1).reduce((result, num) => result / num, numbers[0]);
    
    case 'power':
      if (numbers.length !== 2) {
        throw new Error('幂运算需要两个数字');
      }
      return Math.pow(numbers[0], numbers[1]);
    
    case 'sqrt':
      if (numbers.length !== 1) {
        throw new Error('开方运算只需要一个数字');
      }
      if (numbers[0] < 0) {
        throw new Error('被开方数不能为负数');
      }
      return Math.sqrt(numbers[0]);
    
    default:
      throw new Error(`不支持的运算类型: ${operation}`);
  }
}
