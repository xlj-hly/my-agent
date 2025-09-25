/**
 * 记忆清理服务单元测试
 */

import { memoryCleanupFunction } from '../../../../packages/@agent-services/memory/memory-cleanup';

describe('MemoryCleanupFunction', () => {
  describe('清理操作', () => {
    it('应该成功清理所有数据', async () => {
      const input = {
        operation: 'cleanup',
        target: 'all'
      };

      const result = await memoryCleanupFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.cleanedCount).toBeDefined();
      expect(result.data?.stats).toBeDefined();
    });

    it('应该支持清理特定目标', async () => {
      const input = {
        operation: 'cleanup',
        target: 'messages'
      };

      const result = await memoryCleanupFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.cleanedCount).toBeDefined();
    });

    it('应该支持自定义清理条件', async () => {
      const input = {
        operation: 'cleanup',
        target: 'all',
        criteria: {
          maxAge: 86400000, // 1天
          maxCount: 1000
        }
      };

      const result = await memoryCleanupFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.cleanedCount).toBeDefined();
    });

    it('应该验证清理条件', () => {
      const invalidInput = {
        operation: 'cleanup',
        criteria: {
          maxAge: -1000 // 负数
        }
      };

      if (memoryCleanupFunction.validate) {
        const validation = memoryCleanupFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Max age must be a positive number.');
      }
    });
  });

  describe('优化操作', () => {
    it('应该成功优化记忆存储', async () => {
      const input = {
        operation: 'optimize'
      };

      const result = await memoryCleanupFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.optimizationResults).toBeDefined();
      expect(result.data?.optimizationResults?.beforeStats).toBeDefined();
      expect(result.data?.optimizationResults?.afterStats).toBeDefined();
      expect(result.data?.optimizationResults?.improvements).toBeDefined();
      expect(Array.isArray(result.data?.optimizationResults?.improvements)).toBe(true);
    });
  });

  describe('归档操作', () => {
    it('应该成功归档数据', async () => {
      const input = {
        operation: 'archive',
        archivePath: '/tmp/test-archive.json',
        criteria: {
          maxAge: 86400000
        }
      };

      const result = await memoryCleanupFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.archivedCount).toBeDefined();
      expect(result.data?.archivePath).toBe('/tmp/test-archive.json');
    });

    it('应该验证归档路径', () => {
      const invalidInput = {
        operation: 'archive'
        // 缺少 archivePath
      };

      if (memoryCleanupFunction.validate) {
        const validation = memoryCleanupFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Archive path is required for archive operation.');
      }
    });
  });

  describe('备份操作', () => {
    it('应该成功备份数据', async () => {
      const input = {
        operation: 'backup',
        backupPath: '/tmp/test-backup.json'
      };

      const result = await memoryCleanupFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.backupPath).toBe('/tmp/test-backup.json');
    });

    it('应该验证备份路径', () => {
      const invalidInput = {
        operation: 'backup'
        // 缺少 backupPath
      };

      if (memoryCleanupFunction.validate) {
        const validation = memoryCleanupFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Backup path is required for backup operation.');
      }
    });
  });

  describe('恢复操作', () => {
    it('应该成功恢复数据', async () => {
      const input = {
        operation: 'restore',
        backupPath: '/tmp/test-backup.json'
      };

      const result = await memoryCleanupFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.stats).toBeDefined();
    });

    it('应该验证恢复路径', () => {
      const invalidInput = {
        operation: 'restore'
        // 缺少 backupPath
      };

      if (memoryCleanupFunction.validate) {
        const validation = memoryCleanupFunction.validate(invalidInput as any);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Backup path is required for restore operation.');
      }
    });
  });

  describe('验证操作', () => {
    it('应该成功验证记忆数据', async () => {
      const input = {
        operation: 'validate'
      };

      const result = await memoryCleanupFunction.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.validationResults).toBeDefined();
      expect(result.data?.validationResults?.valid).toBeDefined();
      expect(typeof result.data?.validationResults?.valid).toBe('boolean');
      expect(result.data?.validationResults?.errors).toBeDefined();
      expect(Array.isArray(result.data?.validationResults?.errors)).toBe(true);
      expect(result.data?.validationResults?.warnings).toBeDefined();
      expect(Array.isArray(result.data?.validationResults?.warnings)).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理不支持的操作', async () => {
      const input = {
        operation: 'unsupported' as any
      };

      const result = await memoryCleanupFunction.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('元数据', () => {
    it('应该返回正确的元数据', async () => {
      const input = {
        operation: 'cleanup',
        target: 'messages'
      };

      const result = await memoryCleanupFunction.execute(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.operation).toBe('cleanup');
      expect(result.metadata?.target).toBe('messages');
      expect(result.executionTime).toBeDefined();
      expect(typeof result.executionTime).toBe('number');
    });
  });
});

