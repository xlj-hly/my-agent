/**
 * ServiceRegistry 内存实现（Week 3）
 * 严格遵循 @agent-core/interfaces/registry.interface.ts
 */

import {
  IServiceRegistry,
  ERROR_CODES,
  getErrorMessage,
} from '../packages/@agent-core';

export class ServiceRegistry implements IServiceRegistry {
  private readonly nameToService: Map<string, any> = new Map();

  async registerService(service: any): Promise<void> {
    const name = service?.name;
    if (!name) {
      throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
    }
    if (this.nameToService.has(name)) {
      throw new Error(getErrorMessage(ERROR_CODES.RESOURCE_ALREADY_EXISTS));
    }
    this.nameToService.set(name, service);
  }

  async unregisterService(serviceName: string): Promise<void> {
    if (!this.nameToService.has(serviceName)) {
      throw new Error(getErrorMessage(ERROR_CODES.REGISTRY_ERROR));
    }
    this.nameToService.delete(serviceName);
  }

  getService(serviceName: string): any {
    return this.nameToService.get(serviceName);
  }

  getAllServices(): any[] {
    return Array.from(this.nameToService.values());
  }

  isRegistered(serviceName: string): boolean {
    return this.nameToService.has(serviceName);
  }

  async getHealthStatus(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const [name, svc] of this.nameToService.entries()) {
      if (typeof svc?.healthCheck === 'function') {
        try {
          result[name] = await svc.healthCheck();
        } catch (err: any) {
          result[name] = {
            healthy: false,
            status: 'unhealthy',
            error: String(err?.message ?? err),
            timestamp: Date.now(),
          };
        }
      } else {
        result[name] = {
          healthy: true,
          status: 'unknown',
          timestamp: Date.now(),
        };
      }
    }
    return result;
  }
}

export default ServiceRegistry;
