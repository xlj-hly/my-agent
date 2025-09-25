/**
 * @jest-environment node
 * 
 * CSV Processor 工具函数测试
 */

import { csvProcessorFunction } from '../../../../packages/@agent-tools/data/csv-processor';

describe('CsvProcessorFunction', () => {
  it('应该成功解析CSV数据', async () => {
    const input = {
      csvData: 'name,age,city\nAlice,25,NYC\nBob,30,LA',
      operation: 'parse'
    };
    
    const result = await csvProcessorFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.parsed).toBeDefined();
    expect(result.data?.parsed!.length).toBe(2);
    expect(result.data?.parsed![0]).toEqual({
      name: 'Alice',
      age: '25',
      city: 'NYC'
    });
  });

  it('应该成功生成CSV数据', async () => {
    const input = {
      data: [
        { name: 'Alice', age: 25, city: 'NYC' },
        { name: 'Bob', age: 30, city: 'LA' }
      ],
      operation: 'generate'
    };
    
    const result = await csvProcessorFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.csv).toContain('name,age,city');
    expect(result.data?.csv).toContain('Alice,25,NYC');
    expect(result.data?.csv).toContain('Bob,30,LA');
  });

  it('应该成功过滤CSV数据', async () => {
    const input = {
      csvData: 'name,age,city\nAlice,25,NYC\nBob,30,LA\nCharlie,35,NYC',
      operation: 'filter',
      filters: [
        { column: 'city', value: 'NYC' }
      ]
    };
    
    const result = await csvProcessorFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.filtered).toBeDefined();
    expect(result.data?.filtered!.length).toBe(2);
    expect(result.data?.filtered!.every((row: any) => row.city === 'NYC')).toBe(true);
  });

  it('应该成功排序CSV数据', async () => {
    const input = {
      csvData: 'name,age,city\nBob,30,LA\nAlice,25,NYC\nCharlie,35,NYC',
      operation: 'sort',
      sortBy: 'age',
      sortOrder: 'asc'
    };
    
    const result = await csvProcessorFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.sorted).toBeDefined();
    expect(result.data?.sorted![0].name).toBe('Alice');
    expect(result.data?.sorted![1].name).toBe('Bob');
    expect(result.data?.sorted![2].name).toBe('Charlie');
  });

  it('应该处理无效的CSV数据', async () => {
    const input = {
      csvData: 'invalid,csv,data\nmissing,columns',
      operation: 'parse'
    };
    
    const result = await csvProcessorFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该验证输入schema', () => {
    const validInput = {
      csvData: 'name,age\nAlice,25',
      operation: 'parse'
    };
    
    const invalidInput = {
      csvData: 123, // 应该是字符串
      operation: 'invalid' // 无效操作
    } as any;
    
    if (csvProcessorFunction.validate) {
      const validResult = csvProcessorFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = csvProcessorFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      csvData: 'name,age\nAlice,25\nBob,30',
      operation: 'parse'
    };
    
    const result = await csvProcessorFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.operation).toBe('parse');
    expect(result.metadata?.rowCount).toBe(2);
    expect(result.metadata?.columnCount).toBe(2);
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该支持聚合操作', async () => {
    const input = {
      csvData: 'name,age,city\nAlice,25,NYC\nBob,30,LA\nCharlie,35,NYC',
      operation: 'aggregate',
      groupBy: 'city',
      aggregations: [
        { column: 'age', operation: 'avg' },
        { column: 'age', operation: 'count' }
      ]
    };
    
    const result = await csvProcessorFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.aggregated).toBeDefined();
    expect(result.data?.aggregated!.NYC).toBeDefined();
    expect(result.data?.aggregated!.LA).toBeDefined();
  });

  it('应该处理空CSV数据', async () => {
    const input = {
      csvData: '',
      operation: 'parse'
    };
    
    const result = await csvProcessorFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该支持自定义分隔符', async () => {
    const input = {
      csvData: 'name;age;city\nAlice;25;NYC\nBob;30;LA',
      operation: 'parse',
      delimiter: ';'
    };
    
    const result = await csvProcessorFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.parsed).toBeDefined();
    expect(result.data?.parsed!.length).toBe(2);
  });

  it('应该支持数据转换', async () => {
    const input = {
      csvData: 'name,age,city\nAlice,25,NYC\nBob,30,LA',
      operation: 'transform',
      transformations: [
        { column: 'age', operation: 'to_number' },
        { column: 'name', operation: 'to_uppercase' }
      ]
    };
    
    const result = await csvProcessorFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.transformed).toBeDefined();
    expect(typeof result.data?.transformed![0].age).toBe('number');
    expect(result.data?.transformed![0].name).toBe('ALICE');
  });
});
