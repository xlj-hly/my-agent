import { datetimeFunction } from '../../../tools/system/datetime';

describe('datetimeFunction 额外分支', () => {
  it('支持自定义 timezone 传入', async () => {
    const res = await datetimeFunction.execute({ timezone: 'Asia/Shanghai' });
    expect(res.success).toBe(true);
    expect(res.data?.timezone).toBe('Asia/Shanghai');
  });
});
