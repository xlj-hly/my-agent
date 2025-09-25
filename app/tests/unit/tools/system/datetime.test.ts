/**
 * @jest-environment node
 * 
 * DateTime 工具函数测试
 */

import { datetimeFunction } from '../../../../packages/@agent-tools/system/datetime';

describe('DateTimeFunction', () => {
  it('应该成功格式化当前时间', async () => {
    const input = {
      operation: 'format',
      format: 'YYYY-MM-DD HH:mm:ss'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.formatted).toBeDefined();
    expect(typeof result.data?.formatted).toBe('string');
    expect(result.data?.formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('应该成功解析时间字符串', async () => {
    const input = {
      operation: 'parse',
      dateString: '2024-01-15 14:30:00',
      format: 'YYYY-MM-DD HH:mm:ss'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.timestamp).toBeDefined();
    expect(typeof result.data?.timestamp).toBe('number');
    expect(result.data?.parsed).toBeDefined();
  });

  it('应该成功计算时间差', async () => {
    const input = {
      operation: 'diff',
      startDate: '2024-01-01 00:00:00',
      endDate: '2024-01-02 12:30:00',
      format: 'YYYY-MM-DD HH:mm:ss',
      unit: 'hours'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.difference).toBeDefined();
    expect(typeof result.data?.difference).toBe('number');
    expect(result.data?.difference).toBe(36.5); // 1天12小时30分钟 = 36.5小时
  });

  it('应该成功添加时间', async () => {
    const input = {
      operation: 'add',
      dateString: '2024-01-01 12:00:00',
      format: 'YYYY-MM-DD HH:mm:ss',
      amount: 7,
      unit: 'days'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.result).toBeDefined();
    expect(typeof result.data?.result).toBe('string');
  });

  it('应该成功减去时间', async () => {
    const input = {
      operation: 'subtract',
      dateString: '2024-01-08 12:00:00',
      format: 'YYYY-MM-DD HH:mm:ss',
      amount: 7,
      unit: 'days'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.result).toBeDefined();
    expect(typeof result.data?.result).toBe('string');
  });

  it('应该成功转换时区', async () => {
    const input = {
      operation: 'convertTimezone',
      dateString: '2024-01-01 12:00:00',
      fromTimezone: 'UTC',
      toTimezone: 'Asia/Shanghai',
      format: 'YYYY-MM-DD HH:mm:ss'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.converted).toBeDefined();
    expect(typeof result.data?.converted).toBe('string');
  });

  it('应该成功获取时间戳', async () => {
    const input = {
      operation: 'timestamp',
      dateString: '2024-01-01 00:00:00',
      format: 'YYYY-MM-DD HH:mm:ss'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.timestamp).toBeDefined();
    expect(typeof result.data?.timestamp).toBe('number');
  });

  it('应该成功获取相对时间', async () => {
    const input = {
      operation: 'relative',
      dateString: '2024-01-01 00:00:00',
      format: 'YYYY-MM-DD HH:mm:ss'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.relative).toBeDefined();
    expect(typeof result.data?.relative).toBe('string');
  });

  it('应该成功验证日期格式', async () => {
    const input = {
      operation: 'validate',
      dateString: '2024-01-01',
      format: 'YYYY-MM-DD'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.valid).toBeDefined();
    expect(typeof result.data?.valid).toBe('boolean');
    expect(result.data?.valid).toBe(true);
  });

  it('应该处理无效日期', async () => {
    const input = {
      operation: 'validate',
      dateString: '2024-13-01',
      format: 'YYYY-MM-DD'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.valid).toBeDefined();
    expect(result.data?.valid).toBe(false);
  });

  it('应该验证输入schema', () => {
    const validInput = {
      operation: 'format',
      format: 'YYYY-MM-DD'
    };
    
    const invalidInput = {
      operation: 'invalid', // 无效操作
      format: 123 // 应该是字符串
    } as any;
    
    if (datetimeFunction.validate) {
      const validResult = datetimeFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = datetimeFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      operation: 'format',
      format: 'YYYY-MM-DD HH:mm:ss'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.operation).toBe('format');
    expect(result.metadata?.format).toBe('YYYY-MM-DD HH:mm:ss');
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该支持多种时间单位', async () => {
    const baseDate = '2024-01-01 12:00:00';
    const format = 'YYYY-MM-DD HH:mm:ss';
    
    const units = ['milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'];
    
    for (const unit of units) {
      const input = {
        operation: 'add',
        dateString: baseDate,
        format,
        amount: 1,
        unit
      };
      
      const result = await datetimeFunction.execute(input);
      
      expect(result.success).toBe(true);
      expect(result.data?.result).toBeDefined();
    }
  });

  it('应该支持多种日期格式', async () => {
    const formats = [
      'YYYY-MM-DD',
      'YYYY-MM-DD HH:mm:ss',
      'MM/DD/YYYY',
      'DD-MM-YYYY',
      'YYYY年MM月DD日'
    ];
    
    for (const format of formats) {
      const input = {
        operation: 'format',
        format
      };
      
      const result = await datetimeFunction.execute(input);
      
      expect(result.success).toBe(true);
      expect(result.data?.formatted).toBeDefined();
    }
  });

  it('应该处理边界日期', async () => {
    const input = {
      operation: 'validate',
      dateString: '2000-02-29', // 闰年
      format: 'YYYY-MM-DD'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.valid).toBe(true);
  });

  it('应该处理跨年计算', async () => {
    const input = {
      operation: 'diff',
      startDate: '2023-12-31 23:00:00',
      endDate: '2024-01-01 01:00:00',
      format: 'YYYY-MM-DD HH:mm:ss',
      unit: 'hours'
    };
    
    const result = await datetimeFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.difference).toBe(2); // 2小时
  });
});
