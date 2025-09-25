/**
 * FunctionRegistry 实现测试（Week 3）
 */

import { FunctionRegistry } from '../../../registry/function-registry';
import {
  FunctionCall,
  ERROR_CODES,
  getErrorMessage,
} from '../../../packages/@agent-core';

describe('FunctionRegistry 实现', () => {
  let registry: FunctionRegistry;

  beforeEach(() => {
    registry = new FunctionRegistry();
  });

  const mockFn: FunctionCall<{ x: number }, { y: number }> = {
    name: 'add-one',
    version: '1.0.0',
    description: 'add 1',
    category: 'math',
    tags: ['unit', 'math'],
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    validate: (input: any) => ({ valid: typeof input?.x === 'number' }),
    async execute(input) {
      return { success: true, data: { y: input.x + 1 } };
    },
  };

  it('应能注册与查询函数', async () => {
    await registry.registerFunction(mockFn);
    expect(registry.isRegistered('add-one')).toBe(true);
    expect(registry.getFunction('add-one')?.name).toBe('add-one');
  });

  it('应能按分类与标签筛选', async () => {
    await registry.registerFunction(mockFn);
    expect(registry.getFunctionsByCategory('math').length).toBe(1);
    expect(registry.getFunctionsByTag('unit').length).toBe(1);
  });

  it('应能调用函数并返回结果', async () => {
    await registry.registerFunction(mockFn);
    const res = await registry.callFunction<{ x: number }, { y: number }>(
      'add-one',
      { x: 1 }
    );
    expect(res.success).toBe(true);
    expect((res.data as any)?.y).toBe(2);
  });

  it('未注册调用返回 NOT_FOUND', async () => {
    const res = await registry.callFunction('not-exist', { x: 1 } as any);
    expect(res.success).toBe(false);
    expect(res.error).toBe(getErrorMessage(ERROR_CODES.FUNCTION_NOT_FOUND));
  });

  it('校验失败返回 VALIDATION_ERROR', async () => {
    await registry.registerFunction(mockFn);
    const res = await registry.callFunction('add-one', {} as any);
    expect(res.success).toBe(false);
  });

  it('重复注册抛出 ALREADY_REGISTERED', async () => {
    await registry.registerFunction(mockFn);
    await expect(registry.registerFunction(mockFn)).rejects.toThrow(
      getErrorMessage(ERROR_CODES.RESOURCE_ALREADY_EXISTS)
    );
  });

  it('卸载未注册函数抛出 NOT_FOUND', async () => {
    await expect(registry.unregisterFunction('none')).rejects.toThrow(
      getErrorMessage(ERROR_CODES.FUNCTION_NOT_FOUND)
    );
  });

  it('卸载后不可再调用', async () => {
    await registry.registerFunction(mockFn);
    await registry.unregisterFunction('add-one');
    const res = await registry.callFunction('add-one', { x: 1 });
    expect(res.success).toBe(false);
  });
});
