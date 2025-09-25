/**
 * @agent-services/storage 存储服务包主入口
 * 提供数据库客户端、缓存客户端、文件存储等基础存储功能
 */

// 导出数据库客户端
export {
  databaseClientFunction,
  type DatabaseConfig,
  type QueryResult,
  type DatabaseClientInput,
  type DatabaseClientOutput,
} from './database-client';

// 导出缓存客户端
export {
  cacheClientFunction,
  type CacheItem,
  type CacheStats,
  type CacheClientInput,
  type CacheClientOutput,
} from './cache-client';

// 导出文件存储
export {
  fileStorageFunction,
  type FileInfo,
  type FileOperationResult,
  type FileStorageInput,
  type FileStorageOutput,
} from './file-storage';

// 导入具体的函数实现，以便在storageFunctions数组中使用
import { databaseClientFunction } from './database-client';
import { cacheClientFunction } from './cache-client';
import { fileStorageFunction } from './file-storage';

// 统一导出所有存储服务函数，便于插件注册
export const storageFunctions = [
  databaseClientFunction,
  cacheClientFunction,
  fileStorageFunction,
];

// 包信息
export const STORAGE_VERSION = '1.0.0';
export const STORAGE_DESCRIPTION = '存储服务包 - 提供数据库客户端、缓存客户端、文件存储等';
export const STORAGE_PACKAGE_NAME = '@agent-services/storage';
