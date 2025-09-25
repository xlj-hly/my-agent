import { ServiceRegistry } from '../../../registry/service-registry';

describe('ServiceRegistry 错误分支', () => {
  it('healthCheck 抛错被聚合为 unhealthy', async () => {
    const sr = new ServiceRegistry();
    await sr.registerService({
      name: 'svc-err',
      async healthCheck() {
        throw new Error('boom');
      },
    });
    const health = await sr.getHealthStatus();
    expect(health['svc-err']?.healthy).toBe(false);
  });
});
