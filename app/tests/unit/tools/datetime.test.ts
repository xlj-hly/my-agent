import { datetimeFunction } from '../../../tools/system/datetime';

describe('datetimeFunction', () => {
  it('应返回当前时间信息', async () => {
    const res = await datetimeFunction.execute({});
    expect(res.success).toBe(true);
    expect(typeof res.data?.nowIso).toBe('string');
    expect(typeof res.data?.timestamp).toBe('number');
    expect(typeof res.data?.timezone).toBe('string');
  });
});
