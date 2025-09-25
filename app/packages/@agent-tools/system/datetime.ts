/**
 * DateTime 工具函数
 * 提供日期时间处理功能：格式化、解析、计算、时区转换等
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';

// 输入接口
export interface DateTimeInput {
  operation: string;
  dateString?: string;
  format?: string;
  fromTimezone?: string;
  toTimezone?: string;
  amount?: number;
  unit?: string;
  startDate?: string;
  endDate?: string;
  options?: {
    locale?: string;
    strict?: boolean;
  };
}

// 输出接口
export interface DateTimeOutput {
  formatted?: string;
  parsed?: Date;
  timestamp?: number;
  difference?: number;
  result?: string;
  converted?: string;
  relative?: string;
  valid?: boolean;
  error?: string;
}

export const datetimeFunction: FunctionCall<DateTimeInput, DateTimeOutput> = {
  name: 'datetime',
  version: '1.0.0',
  description: '处理日期时间，包括格式化、解析、计算、时区转换等功能',
  category: 'system',
  tags: ['datetime', 'date', 'time', 'format', 'timezone'],
  
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: '操作类型',
        enum: ['format', 'parse', 'diff', 'add', 'subtract', 'convertTimezone', 'timestamp', 'relative', 'validate'],
      },
      dateString: {
        type: 'string',
        description: '日期时间字符串',
        maxLength: 100,
      },
      format: {
        type: 'string',
        description: '日期格式',
        default: 'YYYY-MM-DD HH:mm:ss',
      },
      fromTimezone: {
        type: 'string',
        description: '源时区',
      },
      toTimezone: {
        type: 'string',
        description: '目标时区',
      },
      amount: {
        type: 'number',
        description: '数量（用于add/subtract操作）',
        minimum: -999999,
        maximum: 999999,
      },
      unit: {
        type: 'string',
        description: '时间单位',
        enum: ['milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'],
      },
      startDate: {
        type: 'string',
        description: '开始日期（用于diff操作）',
      },
      endDate: {
        type: 'string',
        description: '结束日期（用于diff操作）',
      },
      options: {
        type: 'object',
        properties: {
          locale: { type: 'string', default: 'zh-CN' },
          strict: { type: 'boolean', default: false },
        },
        description: '选项',
      },
    },
    required: ['operation'],
  },
  
  outputSchema: {
    type: 'object',
    properties: {
      formatted: { type: 'string', description: '格式化的日期时间' },
      parsed: { type: 'object', description: '解析的日期对象' },
      timestamp: { type: 'number', description: '时间戳' },
      difference: { type: 'number', description: '时间差' },
      result: { type: 'string', description: '计算结果' },
      converted: { type: 'string', description: '转换后的日期时间' },
      relative: { type: 'string', description: '相对时间描述' },
      valid: { type: 'boolean', description: '是否有效' },
      error: { type: 'string', description: '错误信息' },
    },
  },
  
  validate: (input: DateTimeInput): ValidationResult => {
    const errors: string[] = [];
    
    if (!input.operation || typeof input.operation !== 'string') {
      errors.push('操作类型是必需的且必须是字符串');
    } else if (!['format', 'parse', 'diff', 'add', 'subtract', 'convertTimezone', 'timestamp', 'relative', 'validate'].includes(input.operation)) {
      errors.push('不支持的操作类型');
    }
    
    // 特定操作的验证
    if (['parse', 'add', 'subtract', 'convertTimezone', 'timestamp', 'relative', 'validate'].includes(input.operation)) {
      if (!input.dateString) {
        errors.push(`${input.operation}操作需要日期字符串`);
      }
    }
    
    if (['parse', 'add', 'subtract', 'convertTimezone', 'timestamp', 'validate'].includes(input.operation)) {
      if (!input.format) {
        errors.push(`${input.operation}操作需要格式`);
      }
    }
    
    if (['add', 'subtract'].includes(input.operation)) {
      if (input.amount === undefined || typeof input.amount !== 'number') {
        errors.push(`${input.operation}操作需要数量`);
      }
      if (!input.unit) {
        errors.push(`${input.operation}操作需要时间单位`);
      } else if (!['milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'].includes(input.unit)) {
        errors.push('不支持的时间单位');
      }
    }
    
    if (input.operation === 'diff') {
      if (!input.startDate || !input.endDate) {
        errors.push('diff操作需要开始日期和结束日期');
      }
      if (!input.unit) {
        errors.push('diff操作需要时间单位');
      }
    }
    
    if (input.operation === 'convertTimezone') {
      if (!input.fromTimezone || !input.toTimezone) {
        errors.push('convertTimezone操作需要源时区和目标时区');
      }
    }
    
    if (input.amount && (input.amount < -999999 || input.amount > 999999)) {
      errors.push('数量必须在-999999到999999之间');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  execute: async (
    input: DateTimeInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<DateTimeOutput>> => {
    const startTime = Date.now();
    
    try {
      // 验证输入
      if (datetimeFunction.validate) {
        const validation = datetimeFunction.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: '输入验证失败',
            metadata: { errors: validation.errors },
            executionTime: Date.now() - startTime,
          };
        }
      }
      
      // 执行日期时间操作
      const result = performDateTimeOperation(input);
      
      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          format: input.format,
          unit: input.unit,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `日期时间操作失败: ${error.message}`,
        metadata: {
          operation: input.operation,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  },
};

/**
 * 执行日期时间操作
 */
function performDateTimeOperation(input: DateTimeInput): DateTimeOutput {
  const { operation } = input;
  
  switch (operation) {
    case 'format':
      return formatDateTime(input);
      
    case 'parse':
      return parseDateTime(input);
      
    case 'diff':
      return calculateDifference(input);
      
    case 'add':
      return addTime(input);
      
    case 'subtract':
      return subtractTime(input);
      
    case 'convertTimezone':
      return convertTimezone(input);
      
    case 'timestamp':
      return getTimestamp(input);
      
    case 'relative':
      return getRelativeTime(input);
      
    case 'validate':
      return validateDateTime(input);
      
    default:
      throw new Error(`不支持的操作: ${operation}`);
  }
}

/**
 * 格式化日期时间
 */
function formatDateTime(input: DateTimeInput): DateTimeOutput {
  const format = input.format || 'YYYY-MM-DD HH:mm:ss';
  const date = input.dateString ? parseDate(input.dateString, format) : new Date();
  
  return {
    formatted: formatDate(date, format),
  };
}

/**
 * 解析日期时间
 */
function parseDateTime(input: DateTimeInput): DateTimeOutput {
  const { dateString, format } = input;
  if (!dateString || !format) throw new Error('需要日期字符串和格式');
  
  const parsed = parseDate(dateString, format);
  
  return {
    parsed,
    timestamp: parsed.getTime(),
  };
}

/**
 * 计算时间差
 */
function calculateDifference(input: DateTimeInput): DateTimeOutput {
  const { startDate, endDate, format, unit } = input;
  if (!startDate || !endDate || !format || !unit) {
    throw new Error('需要开始日期、结束日期、格式和时间单位');
  }
  
  const start = parseDate(startDate, format);
  const end = parseDate(endDate, format);
  const diff = end.getTime() - start.getTime();
  
  const difference = convertTimeDifference(diff, unit);
  
  return { difference };
}

/**
 * 添加时间
 */
function addTime(input: DateTimeInput): DateTimeOutput {
  const { dateString, format, amount, unit } = input;
  if (!dateString || !format || amount === undefined || !unit) {
    throw new Error('需要日期字符串、格式、数量和单位');
  }
  
  const date = parseDate(dateString, format);
  const newDate = addTimeToDate(date, amount, unit);
  
  return {
    result: formatDate(newDate, format),
  };
}

/**
 * 减去时间
 */
function subtractTime(input: DateTimeInput): DateTimeOutput {
  const { dateString, format, amount, unit } = input;
  if (!dateString || !format || amount === undefined || !unit) {
    throw new Error('需要日期字符串、格式、数量和单位');
  }
  
  const date = parseDate(dateString, format);
  const newDate = addTimeToDate(date, -amount, unit);
  
  return {
    result: formatDate(newDate, format),
  };
}

/**
 * 转换时区
 */
function convertTimezone(input: DateTimeInput): DateTimeOutput {
  const { dateString, format, fromTimezone, toTimezone } = input;
  if (!dateString || !format || !fromTimezone || !toTimezone) {
    throw new Error('需要日期字符串、格式、源时区和目标时区');
  }
  
  // 简化的时区转换实现
  const date = parseDate(dateString, format);
  const converted = convertTimezoneOffset(date, fromTimezone, toTimezone);
  
  return {
    converted: formatDate(converted, format),
  };
}

/**
 * 获取时间戳
 */
function getTimestamp(input: DateTimeInput): DateTimeOutput {
  const { dateString, format } = input;
  if (!dateString || !format) throw new Error('需要日期字符串和格式');
  
  const date = parseDate(dateString, format);
  
  return {
    timestamp: date.getTime(),
  };
}

/**
 * 获取相对时间
 */
function getRelativeTime(input: DateTimeInput): DateTimeOutput {
  const { dateString, format } = input;
  if (!dateString || !format) throw new Error('需要日期字符串和格式');
  
  const date = parseDate(dateString, format);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const relative = getRelativeTimeString(diff);
  
  return { relative };
}

/**
 * 验证日期时间
 */
function validateDateTime(input: DateTimeInput): DateTimeOutput {
  const { dateString, format } = input;
  if (!dateString || !format) throw new Error('需要日期字符串和格式');
  
  try {
    const date = parseDate(dateString, format);
    // 额外验证：检查解析出的日期是否合理
    if (date.getFullYear() < 1900 || date.getFullYear() > 2100) {
      return { valid: false };
    }
    return { valid: true };
  } catch {
    return { valid: false };
  }
}

/**
 * 解析日期字符串
 */
function parseDate(dateString: string, format: string): Date {
  // 简化的日期解析实现
  const formatMap: { [key: string]: string } = {
    'YYYY-MM-DD': '\\d{4}-\\d{2}-\\d{2}',
    'YYYY-MM-DD HH:mm:ss': '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}',
    'MM/DD/YYYY': '\\d{2}/\\d{2}/\\d{4}',
    'DD-MM-YYYY': '\\d{2}-\\d{2}-\\d{4}',
  };
  
  const pattern = formatMap[format];
  if (!pattern) {
    throw new Error(`不支持的格式: ${format}`);
  }
  
  const regex = new RegExp(`^${pattern}$`);
  if (!regex.test(dateString)) {
    throw new Error(`日期格式不匹配: ${dateString} 与 ${format}`);
  }
  
  // 简化的解析逻辑
  let date: Date;
  
  if (format === 'YYYY-MM-DD') {
    const [year, month, day] = dateString.split('-').map(Number);
    // 验证日期有效性
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`无效的日期: ${dateString}`);
    }
    date = new Date(year, month - 1, day);
  } else if (format === 'YYYY-MM-DD HH:mm:ss') {
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    // 验证日期和时间有效性
    if (month < 1 || month > 12 || day < 1 || day > 31 || 
        hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
      throw new Error(`无效的日期时间: ${dateString}`);
    }
    date = new Date(year, month - 1, day, hour, minute, second);
  } else if (format === 'MM/DD/YYYY') {
    const [month, day, year] = dateString.split('/').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`无效的日期: ${dateString}`);
    }
    date = new Date(year, month - 1, day);
  } else if (format === 'DD-MM-YYYY') {
    const [day, month, year] = dateString.split('-').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`无效的日期: ${dateString}`);
    }
    date = new Date(year, month - 1, day);
  } else {
    // 尝试使用原生解析
    date = new Date(dateString);
  }
  
  if (isNaN(date.getTime())) {
    throw new Error(`无效的日期: ${dateString}`);
  }
  
  return date;
}

/**
 * 格式化日期
 */
function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'YYYY年MM月DD日':
      return `${year}年${month}月${day}日`;
    default:
      return date.toISOString();
  }
}

/**
 * 转换时间差
 */
function convertTimeDifference(diffMs: number, unit: string): number {
  switch (unit) {
    case 'milliseconds':
      return diffMs;
    case 'seconds':
      return diffMs / 1000;
    case 'minutes':
      return diffMs / (1000 * 60);
    case 'hours':
      return diffMs / (1000 * 60 * 60);
    case 'days':
      return diffMs / (1000 * 60 * 60 * 24);
    case 'weeks':
      return diffMs / (1000 * 60 * 60 * 24 * 7);
    case 'months':
      return diffMs / (1000 * 60 * 60 * 24 * 30); // 近似值
    case 'years':
      return diffMs / (1000 * 60 * 60 * 24 * 365); // 近似值
    default:
      return diffMs;
  }
}

/**
 * 添加时间到日期
 */
function addTimeToDate(date: Date, amount: number, unit: string): Date {
  const newDate = new Date(date);
  
  switch (unit) {
    case 'milliseconds':
      newDate.setMilliseconds(newDate.getMilliseconds() + amount);
      break;
    case 'seconds':
      newDate.setSeconds(newDate.getSeconds() + amount);
      break;
    case 'minutes':
      newDate.setMinutes(newDate.getMinutes() + amount);
      break;
    case 'hours':
      newDate.setHours(newDate.getHours() + amount);
      break;
    case 'days':
      newDate.setDate(newDate.getDate() + amount);
      break;
    case 'weeks':
      newDate.setDate(newDate.getDate() + amount * 7);
      break;
    case 'months':
      newDate.setMonth(newDate.getMonth() + amount);
      break;
    case 'years':
      newDate.setFullYear(newDate.getFullYear() + amount);
      break;
  }
  
  return newDate;
}

/**
 * 转换时区偏移
 */
function convertTimezoneOffset(date: Date, fromTimezone: string, toTimezone: string): Date {
  // 简化的时区转换实现
  const timezoneOffsets: { [key: string]: number } = {
    'UTC': 0,
    'Asia/Shanghai': 8 * 60, // UTC+8
    'America/New_York': -5 * 60, // UTC-5
    'Europe/London': 0, // UTC+0
    'Asia/Tokyo': 9 * 60, // UTC+9
  };
  
  const fromOffset = timezoneOffsets[fromTimezone] || 0;
  const toOffset = timezoneOffsets[toTimezone] || 0;
  const offsetDiff = toOffset - fromOffset;
  
  return new Date(date.getTime() + offsetDiff * 60 * 1000);
}

/**
 * 获取相对时间字符串
 */
function getRelativeTimeString(diffMs: number): string {
  const diffSeconds = Math.abs(diffMs) / 1000;
  const diffMinutes = diffSeconds / 60;
  const diffHours = diffMinutes / 60;
  const diffDays = diffHours / 24;
  
  const isPast = diffMs > 0;
  const prefix = isPast ? '' : '';
  
  if (diffSeconds < 60) {
    return `${prefix}${Math.floor(diffSeconds)}秒${isPast ? '前' : '后'}`;
  } else if (diffMinutes < 60) {
    return `${prefix}${Math.floor(diffMinutes)}分钟${isPast ? '前' : '后'}`;
  } else if (diffHours < 24) {
    return `${prefix}${Math.floor(diffHours)}小时${isPast ? '前' : '后'}`;
  } else if (diffDays < 30) {
    return `${prefix}${Math.floor(diffDays)}天${isPast ? '前' : '后'}`;
  } else {
    return `${prefix}${Math.floor(diffDays / 30)}个月${isPast ? '前' : '后'}`;
  }
}
