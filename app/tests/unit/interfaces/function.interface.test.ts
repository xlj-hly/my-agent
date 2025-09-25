/**
 * 函数接口测试
 */

import {
  FunctionCall,
  ExecutionContext,
  FunctionResult,
  ValidationResult,
} from '../../../packages/@agent-core';

describe('FunctionCall Interface', () => {
  const mockFunction: FunctionCall<string, string> = {
    name: 'test-function',
    version: '1.0.0',
    description: '测试函数',
    category: 'test',
    tags: ['test', 'mock'],
    inputSchema: {
      type: 'string',
      description: '输入字符串',
    },
    outputSchema: {
      type: 'string',
      description: '输出字符串',
    },
    execute: async (
      input: string,
      _context?: ExecutionContext
    ): Promise<FunctionResult<string>> => {
      return {
        success: true,
        data: `processed: ${input}`,
        executionTime: 100,
        timestamp: Date.now(),
      };
    },
    validate: (input: string): ValidationResult => {
      if (!input || typeof input !== 'string') {
        return {
          valid: false,
          errors: ['输入必须是字符串'],
        };
      }
      return { valid: true };
    },
  };

  it('应该有正确的函数属性', () => {
    expect(mockFunction.name).toBe('test-function');
    expect(mockFunction.version).toBe('1.0.0');
    expect(mockFunction.category).toBe('test');
    expect(mockFunction.tags).toContain('test');
  });

  it('应该能够执行函数', async () => {
    const result = await mockFunction.execute('test input');

    expect(result.success).toBe(true);
    expect(result.data).toBe('processed: test input');
    expect(result.executionTime).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  it('应该能够验证输入', () => {
    const validResult = mockFunction.validate!('valid input');
    expect(validResult.valid).toBe(true);

    const invalidResult = mockFunction.validate!('');
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('输入必须是字符串');
  });

  it('应该支持执行上下文', async () => {
    const context: ExecutionContext = {
      sessionId: 'test-session',
      userId: 'test-user',
      agentId: 'test-agent',
      metadata: { test: true },
    };

    const result = await mockFunction.execute('test', context);
    expect(result.success).toBe(true);
  });
});
