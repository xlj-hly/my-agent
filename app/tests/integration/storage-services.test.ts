import { databaseClientFunction, cacheClientFunction, fileStorageFunction } from '../../packages/@agent-services/storage';

describe('Storage Services Integration', () => {
  beforeEach(async () => {
    // 清理所有存储服务状态
    await cacheClientFunction.execute({ operation: 'clear' });
  });

  it('should integrate database and cache services', async () => {
    // 1. 连接数据库
    const connectResult = await databaseClientFunction.execute({
      operation: 'connect',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      },
    });
    expect(connectResult.success).toBe(true);
    const connectionId = connectResult.data!.connectionId!;

    // 2. 插入数据到数据库
    const insertResult = await databaseClientFunction.execute({
      operation: 'insert',
      connectionId,
      table: 'users',
      data: { name: 'Integration User', email: 'integration@test.com' },
    });
    expect(insertResult.success).toBe(true);
    const userId = insertResult.data!.lastInsertId!;

    // 3. 将数据缓存到缓存服务
    const cacheResult = await cacheClientFunction.execute({
      operation: 'set',
      key: `user:${userId}`,
      value: { name: 'Integration User', email: 'integration@test.com' },
      ttl: 300000, // 5分钟
    });
    expect(cacheResult.success).toBe(true);

    // 4. 从缓存读取数据
    const getCacheResult = await cacheClientFunction.execute({
      operation: 'get',
      key: `user:${userId}`,
    });
    expect(getCacheResult.success).toBe(true);
    expect(getCacheResult.data!.value).toEqual({
      name: 'Integration User',
      email: 'integration@test.com',
    });

    // 5. 断开数据库连接
    const disconnectResult = await databaseClientFunction.execute({
      operation: 'disconnect',
      connectionId,
    });
    expect(disconnectResult.success).toBe(true);
  });

  it('should integrate cache and file storage services', async () => {
    // 1. 创建配置文件内容
    const configContent = JSON.stringify({
      database: {
        host: 'localhost',
        port: 5432,
        name: 'appdb',
      },
      cache: {
        ttl: 3600,
        maxSize: 1000,
      },
      features: {
        analytics: true,
        logging: false,
      },
    });

    // 2. 将配置保存到文件存储
    const uploadResult = await fileStorageFunction.execute({
      operation: 'upload',
      path: '/config/app-config.json',
      content: configContent,
    });
    expect(uploadResult.success).toBe(true);

    // 3. 从文件存储读取配置
    const downloadResult = await fileStorageFunction.execute({
      operation: 'download',
      path: '/config/app-config.json',
    });
    expect(downloadResult.success).toBe(true);
    const config = JSON.parse(downloadResult.data!.content!);

    // 4. 将配置数据缓存
    const cacheResult = await cacheClientFunction.execute({
      operation: 'set',
      key: 'app:config',
      value: config,
      ttl: 1800000, // 30分钟
    });
    expect(cacheResult.success).toBe(true);

    // 5. 验证缓存中的配置
    const getConfigResult = await cacheClientFunction.execute({
      operation: 'get',
      key: 'app:config',
    });
    expect(getConfigResult.success).toBe(true);
    expect(getConfigResult.data!.value).toEqual(config);
    expect(getConfigResult.data!.value.features.analytics).toBe(true);
  });

  it('should handle complete data workflow', async () => {
    // 0. 清理数据库状态
    await databaseClientFunction.execute({ operation: 'status' });
    
    // 1. 准备数据文件
    const csvData = `id,name,email,department
1,Alice Johnson,alice@company.com,Engineering
2,Bob Smith,bob@company.com,Marketing
3,Carol Davis,carol@company.com,Engineering
4,David Wilson,david@company.com,Sales`;

    // 2. 上传CSV文件到文件存储
    const uploadResult = await fileStorageFunction.execute({
      operation: 'upload',
      path: '/data/employees.csv',
      content: csvData,
    });
    expect(uploadResult.success).toBe(true);

    // 3. 解析CSV数据（模拟）
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    const employees = lines.slice(1).map(line => {
      const values = line.split(',');
      const employee: Record<string, string> = {};
      headers.forEach((header, index) => {
        employee[header] = values[index];
      });
      return employee;
    });

    // 4. 连接数据库
    const connectResult = await databaseClientFunction.execute({
      operation: 'connect',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'companydb',
        username: 'admin',
        password: 'password',
      },
    });
    expect(connectResult.success).toBe(true);
    const connectionId = connectResult.data!.connectionId!;

    // 5. 将员工数据插入数据库
    for (const employee of employees) {
      const insertResult = await databaseClientFunction.execute({
        operation: 'insert',
        connectionId,
        table: 'employees',
        data: employee,
      });
      expect(insertResult.success).toBe(true);
    }

    // 6. 查询Engineering部门的员工
    const queryResult = await databaseClientFunction.execute({
      operation: 'query',
      connectionId,
      query: 'SELECT * FROM employees WHERE department = ?',
      table: 'employees',
      params: { department: 'Engineering' },
    });
    expect(queryResult.success).toBe(true);
    expect(queryResult.data!.result!.rows).toHaveLength(2);

    // 7. 将查询结果缓存
    const cacheResult = await cacheClientFunction.execute({
      operation: 'set',
      key: 'employees:engineering',
      value: queryResult.data!.result!.rows,
      ttl: 600000, // 10分钟
    });
    expect(cacheResult.success).toBe(true);

    // 8. 验证缓存的数据
    const getCacheResult = await cacheClientFunction.execute({
      operation: 'get',
      key: 'employees:engineering',
    });
    expect(getCacheResult.success).toBe(true);
    expect(getCacheResult.data!.value).toHaveLength(2);

    // 9. 断开数据库连接
    const disconnectResult = await databaseClientFunction.execute({
      operation: 'disconnect',
      connectionId,
    });
    expect(disconnectResult.success).toBe(true);
  });

  it('should handle error scenarios across services', async () => {
    // 1. 尝试使用无效连接ID查询数据库
    const invalidQueryResult = await databaseClientFunction.execute({
      operation: 'query',
      connectionId: 'invalid_connection',
      query: 'SELECT * FROM users',
      table: 'users',
    });
    expect(invalidQueryResult.success).toBe(false);
    expect(invalidQueryResult.error).toBeDefined();

    // 2. 尝试下载不存在的文件
    const downloadResult = await fileStorageFunction.execute({
      operation: 'download',
      path: '/nonexistent/file.txt',
    });
    expect(downloadResult.success).toBe(false);
    expect(downloadResult.error).toBeDefined();

    // 3. 尝试获取不存在的缓存键
    const cacheResult = await cacheClientFunction.execute({
      operation: 'get',
      key: 'nonexistent:key',
    });
    expect(cacheResult.success).toBe(true); // 缓存miss是正常的
    expect(cacheResult.data!.value).toBeNull();
  });

  it('should handle concurrent operations across services', async () => {
    // 1. 并发创建多个文件
    const filePromises = Array.from({ length: 5 }, (_, i) =>
      fileStorageFunction.execute({
        operation: 'upload',
        path: `/concurrent/file${i}.txt`,
        content: `Content for file ${i}`,
      })
    );

    const fileResults = await Promise.all(filePromises);
    fileResults.forEach(result => {
      expect(result.success).toBe(true);
    });

    // 2. 并发设置多个缓存项
    const cachePromises = Array.from({ length: 5 }, (_, i) =>
      cacheClientFunction.execute({
        operation: 'set',
        key: `concurrent:item${i}`,
        value: `Value ${i}`,
      })
    );

    const cacheResults = await Promise.all(cachePromises);
    cacheResults.forEach(result => {
      expect(result.success).toBe(true);
    });

    // 3. 并发读取所有缓存项
    const getCachePromises = Array.from({ length: 5 }, (_, i) =>
      cacheClientFunction.execute({
        operation: 'get',
        key: `concurrent:item${i}`,
      })
    );

    const getCacheResults = await Promise.all(getCachePromises);
    getCacheResults.forEach((result, i) => {
      expect(result.success).toBe(true);
      expect(result.data!.value).toBe(`Value ${i}`);
    });

    // 4. 验证所有文件都存在
    for (let i = 0; i < 5; i++) {
      const existsResult = await fileStorageFunction.execute({
        operation: 'exists',
        path: `/concurrent/file${i}.txt`,
      });
      expect(existsResult.success).toBe(true);
      expect(existsResult.data!.message).toBe('File or directory exists');
    }
  });

  it('should handle service statistics and monitoring', async () => {
    // 1. 获取缓存统计信息
    const cacheStatsResult = await cacheClientFunction.execute({
      operation: 'stats',
    });
    expect(cacheStatsResult.success).toBe(true);
    expect(cacheStatsResult.data!.stats).toBeDefined();
    expect(cacheStatsResult.data!.stats!.totalItems).toBeGreaterThanOrEqual(0);

    // 2. 获取数据库状态
    const dbStatusResult = await databaseClientFunction.execute({
      operation: 'status',
    });
    expect(dbStatusResult.success).toBe(true);
    expect(dbStatusResult.data!.message).toContain('Database status:');

    // 3. 创建一些文件并验证文件系统状态
    await fileStorageFunction.execute({
      operation: 'upload',
      path: '/monitoring/test1.txt',
      content: 'Test content 1',
    });
    await fileStorageFunction.execute({
      operation: 'upload',
      path: '/monitoring/test2.txt',
      content: 'Test content 2',
    });

    // 4. 搜索文件以验证文件系统状态
    const searchResult = await fileStorageFunction.execute({
      operation: 'search',
      pattern: 'test.*',
    });
    expect(searchResult.success).toBe(true);
    expect(searchResult.data!.files!.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle data persistence and recovery simulation', async () => {
    // 1. 创建持久化数据
    const connectResult = await databaseClientFunction.execute({
      operation: 'connect',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'persistentdb',
        username: 'user',
        password: 'pass',
      },
    });
    expect(connectResult.success).toBe(true);
    const connectionId = connectResult.data!.connectionId!;

    // 2. 插入重要数据
    const insertResult = await databaseClientFunction.execute({
      operation: 'insert',
      connectionId,
      table: 'backup_data',
      data: { id: 1, type: 'critical', content: 'Important data' },
    });
    expect(insertResult.success).toBe(true);

    // 3. 将数据备份到文件
    const backupContent = JSON.stringify({
      timestamp: Date.now(),
      data: { id: 1, type: 'critical', content: 'Important data' },
    });

    const backupResult = await fileStorageFunction.execute({
      operation: 'upload',
      path: '/backups/critical_data_backup.json',
      content: backupContent,
    });
    expect(backupResult.success).toBe(true);

    // 4. 将备份信息缓存
    const cacheResult = await cacheClientFunction.execute({
      operation: 'set',
      key: 'backup:critical_data',
      value: {
        path: '/backups/critical_data_backup.json',
        size: backupContent.length,
        timestamp: Date.now(),
      },
      ttl: 86400000, // 24小时
    });
    expect(cacheResult.success).toBe(true);

    // 5. 模拟恢复过程
    const restoreInfo = await cacheClientFunction.execute({
      operation: 'get',
      key: 'backup:critical_data',
    });
    expect(restoreInfo.success).toBe(true);
    expect(restoreInfo.data!.value.path).toBe('/backups/critical_data_backup.json');

    // 6. 从备份文件恢复数据
    const restoreFileResult = await fileStorageFunction.execute({
      operation: 'download',
      path: '/backups/critical_data_backup.json',
    });
    expect(restoreFileResult.success).toBe(true);
    const restoredData = JSON.parse(restoreFileResult.data!.content!);
    expect(restoredData.data.content).toBe('Important data');

    // 7. 断开数据库连接
    const disconnectResult = await databaseClientFunction.execute({
      operation: 'disconnect',
      connectionId,
    });
    expect(disconnectResult.success).toBe(true);
  });
});
