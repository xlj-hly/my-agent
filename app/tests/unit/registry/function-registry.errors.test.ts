import { FunctionRegistry } from '../../../registry/function-registry';
import {
  FunctionCall,
  ERROR_CODES,
  getErrorMessage,
} from '../../../packages/@agent-core';

describe('FunctionRegistry 错误分支', () => {
  it('execute 抛错时返回 FUNCTION_EXECUTION_ERROR', async () => {
    const fr = new FunctionRegistry();
    const bad: FunctionCall = {
      name: 'bad',
      version: '1.0.0',
      description: 'bad',
      category: 'test',
      tags: [],
      inputSchema: { type: 'object' },
      outputSchema: { type: 'object' },
      async execute() {
        throw new Error('boom');
      },
    };
    await fr.registerFunction(bad);
    const res = await fr.callFunction('bad', {});
    expect(res.success).toBe(false);
    expect(res.error).toBe(
      getErrorMessage(ERROR_CODES.FUNCTION_EXECUTION_ERROR)
    );
  });
});
