/**
 * ServiceRegistry 实现测试（Week 3）
 */

import { ServiceRegistry } from '../../../registry/service-registry';
import { ERROR_CODES, getErrorMessage } from '../../../packages/@agent-core';

describe('ServiceRegistry 实现', () => {
  let registry: ServiceRegistry;

  const svcA = {
    name: 'svc-a',
    type: 'http',
    async healthCheck() {
      return { healthy: true, status: 'healthy', timestamp: Date.now() };
    },
  };

  const svcB = {
    name: 'svc-b',
    type: 'grpc',
  };

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  it('应能注册与查询服务', async () => {
    await registry.registerService(svcA);
    expect(registry.isRegistered('svc-a')).toBe(true);
    expect(registry.getService('svc-a')?.type).toBe('http');
  });

  it('健康状态应能聚合', async () => {
    await registry.registerService(svcA);
    await registry.registerService(svcB);
    const health = await registry.getHealthStatus();
    expect(health['svc-a']?.healthy).toBe(true);
    expect(health['svc-b']?.status).toBe('unknown');
  });

  it('重复注册抛出 RESOURCE_ALREADY_EXISTS', async () => {
    await registry.registerService(svcA);
    await expect(registry.registerService(svcA)).rejects.toThrow(
      getErrorMessage(ERROR_CODES.RESOURCE_ALREADY_EXISTS)
    );
  });

  it('未注册卸载抛出 REGISTRY_ERROR', async () => {
    await expect(registry.unregisterService('none')).rejects.toThrow(
      getErrorMessage(ERROR_CODES.REGISTRY_ERROR)
    );
  });

  it('卸载后不可再获取', async () => {
    await registry.registerService(svcB);
    await registry.unregisterService('svc-b');
    expect(registry.getService('svc-b')).toBeUndefined();
  });
});
