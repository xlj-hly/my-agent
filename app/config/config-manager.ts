import type { SystemConfig } from './config-types';

type ConfigListener = (config: SystemConfig) => void | Promise<void>;

export class ConfigManager {
  private config!: SystemConfig;
  private readonly listeners: Set<ConfigListener> = new Set();

  get(): SystemConfig {
    return this.config;
  }

  async load(config: SystemConfig): Promise<void> {
    this.config = config;
    await this.notify();
  }

  async set(
    updater: Partial<SystemConfig> | ((prev: SystemConfig) => SystemConfig)
  ): Promise<void> {
    if (typeof updater === 'function') {
      this.config = updater(this.config);
    } else {
      this.config = { ...this.config, ...updater } as SystemConfig;
    }
    await this.notify();
  }

  subscribe(listener: ConfigListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async notify(): Promise<void> {
    for (const l of this.listeners) {
      await l(this.config);
    }
  }
}

export default ConfigManager;
