import { cacheClientFunction, CacheClientInput, CacheClientOutput } from '../../../../packages/@agent-services/storage/cache-client';
import { FunctionResult } from '../../../../packages/@agent-core';

describe('Cache Client Function', () => {
  beforeEach(async () => {
    // 清理缓存状态
    await cacheClientFunction.execute({ operation: 'clear' });
  });

  it('should set cache value successfully', async () => {
    const input: CacheClientInput = {
      operation: 'set',
      key: 'user:123',
      value: { name: 'John', email: 'john@example.com' },
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.message).toBe('Cache set successfully');
  });

  it('should get cache value successfully', async () => {
    // First set a value
    await cacheClientFunction.execute({
      operation: 'set',
      key: 'product:456',
      value: { name: 'Laptop', price: 999.99 },
    });

    const input: CacheClientInput = {
      operation: 'get',
      key: 'product:456',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.value).toEqual({ name: 'Laptop', price: 999.99 });
    expect(result.data!.message).toBe('Cache hit');
  });

  it('should return cache miss for non-existent key', async () => {
    const input: CacheClientInput = {
      operation: 'get',
      key: 'nonexistent:key',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.value).toBeNull();
    expect(result.data!.message).toBe('Cache miss');
  });

  it('should delete cache key successfully', async () => {
    // First set a value
    await cacheClientFunction.execute({
      operation: 'set',
      key: 'temp:key',
      value: 'temporary data',
    });

    const input: CacheClientInput = {
      operation: 'delete',
      key: 'temp:key',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.count).toBe(1);
    expect(result.data!.message).toBe('Key deleted successfully');
  });

  it('should check if key exists', async () => {
    // First set a value
    await cacheClientFunction.execute({
      operation: 'set',
      key: 'existing:key',
      value: 'some data',
    });

    const input: CacheClientInput = {
      operation: 'exists',
      key: 'existing:key',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.count).toBe(1);
    expect(result.data!.message).toBe('Key exists');
  });

  it('should list cache keys', async () => {
    // Set multiple values
    await cacheClientFunction.execute({ operation: 'set', key: 'user:1', value: 'Alice' });
    await cacheClientFunction.execute({ operation: 'set', key: 'user:2', value: 'Bob' });
    await cacheClientFunction.execute({ operation: 'set', key: 'product:1', value: 'Phone' });

    const input: CacheClientInput = {
      operation: 'keys',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.keys).toHaveLength(3);
    expect(result.data!.count).toBe(3);
    expect(result.data!.message).toBe('Found 3 keys');
  });

  it('should list keys with pattern matching', async () => {
    // Set multiple values
    await cacheClientFunction.execute({ operation: 'set', key: 'user:1', value: 'Alice' });
    await cacheClientFunction.execute({ operation: 'set', key: 'user:2', value: 'Bob' });
    await cacheClientFunction.execute({ operation: 'set', key: 'product:1', value: 'Phone' });

    const input: CacheClientInput = {
      operation: 'keys',
      pattern: 'user:*',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.keys).toHaveLength(2);
    expect(result.data!.keys).toEqual(expect.arrayContaining(['user:1', 'user:2']));
  });

  it('should clear all cache entries', async () => {
    // Set multiple values
    await cacheClientFunction.execute({ operation: 'set', key: 'key1', value: 'value1' });
    await cacheClientFunction.execute({ operation: 'set', key: 'key2', value: 'value2' });

    const input: CacheClientInput = {
      operation: 'clear',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.count).toBe(2);
    expect(result.data!.message).toBe('Cleared 2 cache items');
  });

  it('should return cache statistics', async () => {
    // Perform some operations to generate statistics
    await cacheClientFunction.execute({ operation: 'set', key: 'key1', value: 'value1' });
    await cacheClientFunction.execute({ operation: 'get', key: 'key1' }); // hit
    await cacheClientFunction.execute({ operation: 'get', key: 'nonexistent' }); // miss

    const input: CacheClientInput = {
      operation: 'stats',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.stats).toBeDefined();
    expect(result.data!.stats!.totalItems).toBe(1);
    expect(result.data!.stats!.hitRate).toBeGreaterThan(0);
    expect(result.data!.stats!.missRate).toBeGreaterThan(0);
  });

  it('should handle TTL expiration', async () => {
    const input: CacheClientInput = {
      operation: 'set',
      key: 'expiring:key',
      value: 'expiring data',
      ttl: 100, // 100ms TTL
    };

    const setResult = await cacheClientFunction.execute(input);
    expect(setResult.success).toBe(true);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));

    const getResult = await cacheClientFunction.execute({
      operation: 'get',
      key: 'expiring:key',
    });

    expect(getResult.success).toBe(true);
    expect(getResult.data!.value).toBeNull(); // Should be expired
  });

  it('should get TTL for existing key', async () => {
    await cacheClientFunction.execute({
      operation: 'set',
      key: 'ttl:key',
      value: 'data',
      ttl: 5000,
    });

    const input: CacheClientInput = {
      operation: 'ttl',
      key: 'ttl:key',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.value).toBeGreaterThan(0);
    expect(result.data!.message).toContain('remaining');
  });

  it('should increment numeric value', async () => {
    await cacheClientFunction.execute({
      operation: 'set',
      key: 'counter',
      value: 10,
    });

    const input: CacheClientInput = {
      operation: 'increment',
      key: 'counter',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.value).toBe(11);
    expect(result.data!.message).toBe('Value incremented');
  });

  it('should decrement numeric value', async () => {
    await cacheClientFunction.execute({
      operation: 'set',
      key: 'counter',
      value: 10,
    });

    const input: CacheClientInput = {
      operation: 'decrement',
      key: 'counter',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.value).toBe(9);
    expect(result.data!.message).toBe('Value decremented');
  });

  it('should handle invalid operations on non-numeric values', async () => {
    await cacheClientFunction.execute({
      operation: 'set',
      key: 'text:key',
      value: 'not a number',
    });

    const input: CacheClientInput = {
      operation: 'increment',
      key: 'text:key',
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle missing required parameters', async () => {
    const input: CacheClientInput = {
      operation: 'get',
      // Missing key
    };

    const result: FunctionResult<CacheClientOutput> = await cacheClientFunction.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should validate input correctly', () => {
    const validInput: CacheClientInput = {
      operation: 'set',
      key: 'test:key',
      value: 'test value',
    };
    const validResult = cacheClientFunction.validate!(validInput);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toEqual([]);

    const invalidInput: CacheClientInput = {
      operation: 'set',
      key: 'test:key',
      // Missing value
    };
    const invalidResult = cacheClientFunction.validate!(invalidInput);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('Key and value are required for set operation.');
  });

  it('should handle complex data types', async () => {
    const complexData = {
      user: { id: 1, name: 'John', roles: ['admin', 'user'] },
      settings: { theme: 'dark', notifications: true },
      metadata: { created: Date.now(), version: '1.0.0' },
    };

    const input: CacheClientInput = {
      operation: 'set',
      key: 'complex:data',
      value: complexData,
    };

    const setResult = await cacheClientFunction.execute(input);
    expect(setResult.success).toBe(true);

    const getResult = await cacheClientFunction.execute({
      operation: 'get',
      key: 'complex:data',
    });

    expect(getResult.success).toBe(true);
    expect(getResult.data!.value).toEqual(complexData);
  });
});
