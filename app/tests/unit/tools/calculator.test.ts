import { calculatorFunction } from '../../../tools/calculation/calculator';

describe('calculatorFunction', () => {
  it('应正确执行加减乘除', async () => {
    expect(
      (await calculatorFunction.execute({ op: 'add', a: 1, b: 2 })).data?.result
    ).toBe(3);
    expect(
      (await calculatorFunction.execute({ op: 'sub', a: 5, b: 2 })).data?.result
    ).toBe(3);
    expect(
      (await calculatorFunction.execute({ op: 'mul', a: 3, b: 4 })).data?.result
    ).toBe(12);
    expect(
      (await calculatorFunction.execute({ op: 'div', a: 8, b: 2 })).data?.result
    ).toBe(4);
  });

  it('应对非法输入进行校验', async () => {
    const v1 = await calculatorFunction.execute({
      op: 'div',
      a: 1,
      b: 0,
    } as any);
    expect(v1.success).toBe(false);
  });
});
