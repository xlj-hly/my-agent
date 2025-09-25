import { PluginRegistry } from '../../../registry/plugin-registry';
import {
  Plugin,
  ERROR_CODES,
  getErrorMessage,
} from '../../../packages/@agent-core';

describe('PluginRegistry 错误分支', () => {
  it('validatePlugin 返回 false 时注册失败', async () => {
    const pr = new PluginRegistry();
    const bad: Plugin = {
      // 缺少必填 description 或 functions 形态错误
      name: 'bad',
      version: '1.0.0',
      description: '',
      functions: [{ name: 'x' } as any],
    };
    await expect(pr.register(bad)).rejects.toThrow(
      getErrorMessage(ERROR_CODES.REGISTRATION_ERROR)
    );
  });

  it('healthCheck 抛错时被聚合为 unhealthy', async () => {
    const pr = new PluginRegistry();
    const p: Plugin = {
      name: 'err-health',
      version: '1.0.0',
      description: 'x',
      functions: [],
      async healthCheck() {
        throw new Error('boom');
      },
    };
    await pr.register(p);
    const health = await pr.getHealthStatus();
    expect(health['err-health']?.healthy).toBe(false);
  });
});
