/**
 * @jest-environment node
 * 
 * JSON Parser 工具函数测试
 */

import { jsonParserFunction } from '../../../../packages/@agent-tools/data/json-parser';

describe('JsonParserFunction', () => {
  it('应该成功解析有效的JSON字符串', async () => {
    const input = {
      jsonString: '{"name": "test", "age": 25, "active": true}',
      operation: 'parse'
    };
    
    const result = await jsonParserFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.parsed).toEqual({
      name: 'test',
      age: 25,
      active: true
    });
  });

  it('应该成功验证JSON字符串', async () => {
    const input = {
      jsonString: '{"valid": "json"}',
      operation: 'validate'
    };
    
    const result = await jsonParserFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBe(true);
    expect(result.data?.errors).toBeUndefined();
  });

  it('应该成功格式化JSON字符串', async () => {
    const input = {
      jsonString: '{"name":"test","age":25}',
      operation: 'format'
    };
    
    const result = await jsonParserFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.formatted).toContain('"name": "test"');
    expect(result.data?.formatted).toContain('"age": 25');
  });

  it('应该处理无效的JSON字符串', async () => {
    const input = {
      jsonString: '{"invalid": json}',
      operation: 'parse'
    };
    
    const result = await jsonParserFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该处理空字符串', async () => {
    const input = {
      jsonString: '',
      operation: 'parse'
    };
    
    const result = await jsonParserFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该验证输入schema', () => {
    const validInput = {
      jsonString: '{"test": "value"}',
      operation: 'parse'
    };
    
    const invalidInput = {
      jsonString: 123, // 应该是字符串
      operation: 'invalid' // 无效操作
    } as any;
    
    if (jsonParserFunction.validate) {
      const validResult = jsonParserFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = jsonParserFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      jsonString: '{"test": "value"}',
      operation: 'parse'
    };
    
    const result = await jsonParserFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.operation).toBe('parse');
    expect(result.metadata?.stringLength).toBe(17);
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该支持复杂的JSON结构', async () => {
    const complexJson = {
      users: [
        { id: 1, name: 'Alice', profile: { age: 25, city: 'NYC' } },
        { id: 2, name: 'Bob', profile: { age: 30, city: 'LA' } }
      ],
      metadata: {
        total: 2,
        created: '2023-01-01T00:00:00Z'
      }
    };
    
    const input = {
      jsonString: JSON.stringify(complexJson),
      operation: 'parse'
    };
    
    const result = await jsonParserFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.parsed).toEqual(complexJson);
  });

  it('应该支持数据提取操作', async () => {
    const input = {
      jsonString: '{"user": {"name": "Alice", "age": 25}, "status": "active"}',
      operation: 'extract',
      path: 'user.name'
    };
    
    const result = await jsonParserFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.extracted).toBe('Alice');
  });

  it('应该处理数据提取路径不存在的情况', async () => {
    const input = {
      jsonString: '{"user": {"name": "Alice"}}',
      operation: 'extract',
      path: 'user.age'
    };
    
    const result = await jsonParserFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.extracted).toBeUndefined();
    expect(result.data?.found).toBe(false);
  });

  it('应该支持数据转换操作', async () => {
    const input = {
      jsonString: '{"name": "Alice", "age": "25"}',
      operation: 'transform',
      transformations: [
        { path: 'age', type: 'number' },
        { path: 'name', type: 'string' }
      ]
    };
    
    const result = await jsonParserFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.transformed.age).toBe(25);
    expect(typeof result.data?.transformed.age).toBe('number');
  });
});
