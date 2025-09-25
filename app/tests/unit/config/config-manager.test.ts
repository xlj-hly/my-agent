import { ConfigManager } from '../../../config/config-manager';
import { DEFAULT_CONFIG } from '../../../config/default-config';
import type { SystemConfig } from '../../../config/config-types';

describe('ConfigManager', () => {
  it('应能加载与获取配置', async () => {
    const cm = new ConfigManager();
    await cm.load(DEFAULT_CONFIG);
    const cfg = cm.get();
    expect(cfg.memory.defaultType).toBeDefined();
  });

  it('应能更新配置并通知订阅者', async () => {
    const cm = new ConfigManager();
    await cm.load(DEFAULT_CONFIG);
    let received: SystemConfig | undefined;
    const off = cm.subscribe((cfg) => {
      received = cfg;
    });

    await cm.set({
      orchestration: { ...cm.get().orchestration, timeout: 1000 },
    });
    expect(received?.orchestration.timeout).toBe(1000);
    off();
  });

  it('支持函数式更新', async () => {
    const cm = new ConfigManager();
    await cm.load(DEFAULT_CONFIG);
    await cm.set((prev) => ({
      ...prev,
      plugins: { ...prev.plugins, autoLoad: true },
    }));
    expect(cm.get().plugins.autoLoad).toBe(true);
  });
});
