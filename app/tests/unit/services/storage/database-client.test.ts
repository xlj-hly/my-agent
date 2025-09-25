import { databaseClientFunction, DatabaseClientInput, DatabaseClientOutput } from '../../../../packages/@agent-services/storage/database-client';
import { FunctionResult } from '../../../../packages/@agent-core';

describe('Database Client Function', () => {
  beforeEach(async () => {
    // 清理数据库状态
    await databaseClientFunction.execute({ operation: 'status' });
  });

  it('should connect to database successfully', async () => {
    const input: DatabaseClientInput = {
      operation: 'connect',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      },
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.connectionId).toBeDefined();
    expect(result.data!.message).toBe('Database connected successfully');
  });

  it('should execute SELECT query successfully', async () => {
    // First connect
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

    const connectionId = connectResult.data!.connectionId!;

    // Insert test data
    await databaseClientFunction.execute({
      operation: 'insert',
      connectionId,
      table: 'users',
      data: { name: 'John', email: 'john@example.com' },
    });

    const input: DatabaseClientInput = {
      operation: 'query',
      connectionId,
      query: 'SELECT * FROM users',
      table: 'users',
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.result).toBeDefined();
    expect(result.data!.result!.rows).toHaveLength(1);
    expect(result.data!.result!.rows[0].name).toBe('John');
  });

  it('should insert data successfully', async () => {
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

    const connectionId = connectResult.data!.connectionId!;

    const input: DatabaseClientInput = {
      operation: 'insert',
      connectionId,
      table: 'products',
      data: { name: 'Laptop', price: 999.99, category: 'Electronics' },
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.affectedRows).toBe(1);
    expect(result.data!.lastInsertId).toBeDefined();
    expect(result.data!.message).toBe('Data inserted successfully');
  });

  it('should update data successfully', async () => {
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

    const connectionId = connectResult.data!.connectionId!;

    // Insert test data
    const insertResult = await databaseClientFunction.execute({
      operation: 'insert',
      connectionId,
      table: 'products',
      data: { name: 'Phone', price: 599.99, category: 'Electronics' },
    });

    const productId = insertResult.data!.lastInsertId!;

    const input: DatabaseClientInput = {
      operation: 'update',
      connectionId,
      table: 'products',
      data: { price: 549.99 },
      where: { id: productId },
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.affectedRows).toBe(1);
    expect(result.data!.message).toBe('Data updated successfully');
  });

  it('should delete data successfully', async () => {
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

    const connectionId = connectResult.data!.connectionId!;

    // Insert test data
    const insertResult = await databaseClientFunction.execute({
      operation: 'insert',
      connectionId,
      table: 'orders',
      data: { customer: 'Alice', amount: 150.00, status: 'pending' },
    });

    const orderId = insertResult.data!.lastInsertId!;

    const input: DatabaseClientInput = {
      operation: 'delete',
      connectionId,
      table: 'orders',
      where: { id: orderId },
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.affectedRows).toBe(1);
    expect(result.data!.message).toBe('Data deleted successfully');
  });

  it('should start transaction successfully', async () => {
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

    const connectionId = connectResult.data!.connectionId!;

    const input: DatabaseClientInput = {
      operation: 'transaction',
      connectionId,
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.message).toBe('Transaction started successfully');
  });

  it('should disconnect from database successfully', async () => {
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

    const connectionId = connectResult.data!.connectionId!;

    const input: DatabaseClientInput = {
      operation: 'disconnect',
      connectionId,
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.message).toBe('Database disconnected successfully');
  });

  it('should return database status', async () => {
    const input: DatabaseClientInput = {
      operation: 'status',
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.message).toBeDefined();
    expect(result.data!.message).toContain('Database status:');
  });

  it('should handle invalid connection for query', async () => {
    const input: DatabaseClientInput = {
      operation: 'query',
      connectionId: 'invalid_connection',
      query: 'SELECT * FROM users',
      table: 'users',
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle missing required parameters', async () => {
    const input: DatabaseClientInput = {
      operation: 'insert',
      table: 'users',
      // Missing connectionId and data
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid operation', async () => {
    const input: DatabaseClientInput = {
      operation: 'invalid_operation',
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should validate input correctly', () => {
    const validInput: DatabaseClientInput = {
      operation: 'connect',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      },
    };
    const validResult = databaseClientFunction.validate!(validInput);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toEqual([]);

    const invalidInput: DatabaseClientInput = {
      operation: 'connect',
      // Missing config
    };
    const invalidResult = databaseClientFunction.validate!(invalidInput);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('Config is required for connect operation.');
  });

  it('should handle complex query with parameters', async () => {
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

    const connectionId = connectResult.data!.connectionId!;

    // Insert multiple test records
    await databaseClientFunction.execute({
      operation: 'insert',
      connectionId,
      table: 'users',
      data: { name: 'Alice', age: 25, city: 'New York' },
    });
    await databaseClientFunction.execute({
      operation: 'insert',
      connectionId,
      table: 'users',
      data: { name: 'Bob', age: 30, city: 'Los Angeles' },
    });

    const input: DatabaseClientInput = {
      operation: 'query',
      connectionId,
      query: 'SELECT * FROM users WHERE age > ?',
      table: 'users',
      params: { age: 25 },
    };

    const result: FunctionResult<DatabaseClientOutput> = await databaseClientFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.result).toBeDefined();
    expect(result.data!.result!.rows.length).toBeGreaterThan(0);
  });
});
