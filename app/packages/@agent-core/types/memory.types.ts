/**
 * 记忆相关类型定义
 */

export type MemoryBackend = 'memory' | 'redis' | 'database' | 'file' | 'hybrid';

export type MemoryPriority = 'low' | 'normal' | 'high' | 'critical';

export interface MemoryConfig {
  backend: MemoryBackend;
  maxSize: number;
  ttl: number;
  compression: boolean;
  encryption: boolean;
  backup: boolean;
  settings: Record<string, any>;
}

export interface MemoryMetrics {
  totalSize: number;
  usedSize: number;
  freeSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  lastCleanup: number;
}

export interface MemoryEvent {
  type: 'add' | 'update' | 'delete' | 'cleanup' | 'error';
  timestamp: number;
  data: any;
  metadata: Record<string, any>;
}

export interface MemoryQuery {
  filters: Record<string, any>;
  sort: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit: number;
  offset: number;
}
