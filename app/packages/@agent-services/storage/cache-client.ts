import { FunctionCall, FunctionResult, ExecutionContext } from '../../@agent-core';
import { JSONSchema } from '../../@agent-core/interfaces/function.interface';
import { ERROR_CODES, getErrorMessage } from '../../@agent-core/constants/errors';

// 缓存项接口
export interface CacheItem {
  key: string;
  value: any;
  ttl?: number; // 过期时间(毫秒)
  createdAt: number;
  accessCount: number;
}

// 缓存统计信息接口
export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictedItems: number;
  expiredItems: number;
}

// 缓存客户端输入接口
export interface CacheClientInput {
  operation: string;
  key?: string;
  value?: any;
  ttl?: number;
  keys?: string[];
  pattern?: string;
  maxKeys?: number;
}

// 缓存客户端输出接口
export interface CacheClientOutput {
  success: boolean;
  error?: string;
  value?: any;
  keys?: string[];
  count?: number;
  stats?: CacheStats;
  message?: string;
}

// 模拟内存缓存存储
const cacheStore = new Map<string, CacheItem>();
const accessLog = new Map<string, number>(); // key -> accessCount
let totalHits = 0;
let totalMisses = 0;
let evictedCount = 0;
let expiredCount = 0;

// 清理过期缓存项
function cleanExpiredItems(): void {
  const now = Date.now();
  for (const [key, item] of cacheStore.entries()) {
    if (item.ttl && now - item.createdAt > item.ttl) {
      cacheStore.delete(key);
      accessLog.delete(key);
      expiredCount++;
    }
  }
}

// 模拟LRU淘汰策略（暂时注释，避免未使用警告）
// function evictLRUItems(maxItems: number): void {
//   if (cacheStore.size <= maxItems) return;
  
//   const sortedItems = Array.from(cacheStore.entries())
//     .sort((a, b) => a[1].accessCount - b[1].accessCount);
  
//   const itemsToEvict = sortedItems.slice(0, cacheStore.size - maxItems);
//   for (const [key] of itemsToEvict) {
//     cacheStore.delete(key);
//     accessLog.delete(key);
//     evictedCount++;
//   }
// }

// 获取缓存统计信息
function getCacheStats(): CacheStats {
  cleanExpiredItems();
  const totalRequests = totalHits + totalMisses;
  const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
  const missRate = totalRequests > 0 ? totalMisses / totalRequests : 0;
  
  let totalSize = 0;
  for (const item of cacheStore.values()) {
    totalSize += JSON.stringify(item.value).length;
  }
  
  return {
    totalItems: cacheStore.size,
    totalSize,
    hitRate,
    missRate,
    evictedItems: evictedCount,
    expiredItems: expiredCount,
  };
}

export const cacheClientFunction: FunctionCall<CacheClientInput, CacheClientOutput> = {
  name: 'cache-client',
  version: '1.0.0',
  description: '提供缓存存储、检索、管理等功能服务',
  category: 'storage',
  tags: ['cache', 'memory', 'storage', 'performance'],
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['get', 'set', 'delete', 'exists', 'keys', 'clear', 'stats', 'ttl', 'increment', 'decrement'],
        description: '要执行的缓存操作',
      },
      key: { type: 'string', description: '缓存键名' },
      value: { description: '缓存值' },
      ttl: { type: 'number', description: '过期时间(毫秒)' },
      keys: { type: 'array', items: { type: 'string' }, description: '多个键名' },
      pattern: { type: 'string', description: '键名模式匹配' },
      maxKeys: { type: 'number', description: '最大键数量' },
    },
    required: ['operation'],
  } as JSONSchema,
  outputSchema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', description: '操作是否成功' },
      error: { type: 'string', description: '错误信息' },
      value: { description: '缓存值' },
      keys: { type: 'array', items: { type: 'string' }, description: '键名列表' },
      count: { type: 'number', description: '数量' },
      stats: {
        type: 'object',
        properties: {
          totalItems: { type: 'number' },
          totalSize: { type: 'number' },
          hitRate: { type: 'number' },
          missRate: { type: 'number' },
          evictedItems: { type: 'number' },
          expiredItems: { type: 'number' },
        },
      },
      message: { type: 'string', description: '操作消息' },
    },
    required: ['success'],
  } as JSONSchema,
  async execute(
    input: CacheClientInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<CacheClientOutput>> {
    const startTime = Date.now();
    try {
      let output: CacheClientOutput = { success: false };

      switch (input.operation) {
        case 'get': {
          if (!input.key) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          cleanExpiredItems();
          const item = cacheStore.get(input.key);
          if (item) {
            item.accessCount++;
            accessLog.set(input.key, item.accessCount);
            totalHits++;
            output = {
              success: true,
              value: item.value,
              message: 'Cache hit',
            };
          } else {
            totalMisses++;
            output = {
              success: true,
              value: null,
              message: 'Cache miss',
            };
          }
          break;
        }
        case 'set': {
          if (!input.key || input.value === undefined) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          cleanExpiredItems();
          const now = Date.now();
          const item: CacheItem = {
            key: input.key,
            value: input.value,
            ttl: input.ttl,
            createdAt: now,
            accessCount: 0,
          };
          cacheStore.set(input.key, item);
          accessLog.set(input.key, 0);
          output = {
            success: true,
            message: 'Cache set successfully',
          };
          break;
        }
        case 'delete': {
          if (!input.key) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const deleted = cacheStore.delete(input.key);
          accessLog.delete(input.key);
          output = {
            success: true,
            count: deleted ? 1 : 0,
            message: deleted ? 'Key deleted successfully' : 'Key not found',
          };
          break;
        }
        case 'exists': {
          if (!input.key) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          cleanExpiredItems();
          const exists = cacheStore.has(input.key);
          output = {
            success: true,
            count: exists ? 1 : 0,
            message: exists ? 'Key exists' : 'Key does not exist',
          };
          break;
        }
        case 'keys': {
          cleanExpiredItems();
          let keys: string[] = [];
          if (input.pattern) {
            const regex = new RegExp(input.pattern.replace(/\*/g, '.*'));
            keys = Array.from(cacheStore.keys()).filter(key => regex.test(key));
          } else {
            keys = Array.from(cacheStore.keys());
          }
          if (input.maxKeys && input.maxKeys > 0) {
            keys = keys.slice(0, input.maxKeys);
          }
          output = {
            success: true,
            keys,
            count: keys.length,
            message: `Found ${keys.length} keys`,
          };
          break;
        }
        case 'clear': {
          const size = cacheStore.size;
          cacheStore.clear();
          accessLog.clear();
          totalHits = 0;
          totalMisses = 0;
          evictedCount = 0;
          expiredCount = 0;
          output = {
            success: true,
            count: size,
            message: `Cleared ${size} cache items`,
          };
          break;
        }
        case 'stats': {
          const stats = getCacheStats();
          output = {
            success: true,
            stats,
            message: 'Cache statistics retrieved',
          };
          break;
        }
        case 'ttl': {
          if (!input.key) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          cleanExpiredItems();
          const item = cacheStore.get(input.key);
          if (item) {
            const remaining = item.ttl ? Math.max(0, item.ttl - (Date.now() - item.createdAt)) : -1;
            output = {
              success: true,
              value: remaining,
              message: remaining > 0 ? `${remaining}ms remaining` : 'No expiration',
            };
          } else {
            output = {
              success: true,
              value: -2,
              message: 'Key not found',
            };
          }
          break;
        }
        case 'increment': {
          if (!input.key) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          cleanExpiredItems();
          const item = cacheStore.get(input.key);
          if (item && typeof item.value === 'number') {
            item.value++;
            item.accessCount++;
            accessLog.set(input.key, item.accessCount);
            output = {
              success: true,
              value: item.value,
              message: 'Value incremented',
            };
          } else {
            throw new Error('Key not found or value is not a number');
          }
          break;
        }
        case 'decrement': {
          if (!input.key) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          cleanExpiredItems();
          const item = cacheStore.get(input.key);
          if (item && typeof item.value === 'number') {
            item.value--;
            item.accessCount++;
            accessLog.set(input.key, item.accessCount);
            output = {
              success: true,
              value: item.value,
              message: 'Value decremented',
            };
          } else {
            throw new Error('Key not found or value is not a number');
          }
          break;
        }
        default:
          throw new Error(getErrorMessage(ERROR_CODES.UNKNOWN_ERROR));
      }

      return {
        success: true,
        data: output,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  },
  validate(input: CacheClientInput) {
    const errors: string[] = [];
    
    if (['get', 'delete', 'exists', 'ttl', 'increment', 'decrement'].includes(input.operation) && !input.key) {
      errors.push('Key is required for this operation.');
    }
    if (input.operation === 'set' && (input.key === undefined || input.value === undefined)) {
      errors.push('Key and value are required for set operation.');
    }
    if (input.operation === 'set' && input.ttl !== undefined && input.ttl < 0) {
      errors.push('TTL must be non-negative.');
    }
    
    return { valid: errors.length === 0, errors };
  },
};
