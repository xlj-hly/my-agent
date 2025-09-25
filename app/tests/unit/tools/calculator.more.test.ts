import { calculatorFunction } from '../../../tools/calculation/calculator';

describe('calculatorFunction 额外分支', () => {
  it('不支持的操作符返回 INVALID_INPUT', async () => {
    const res = await calculatorFunction.execute({
      op: 'xxx' as any,
      a: 1,
      b: 2,
    });
    expect(res.success).toBe(false);
  });
});
