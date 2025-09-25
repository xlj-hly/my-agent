/**
 * JSON Parser 工具函数
 * 提供JSON解析、验证、格式化等功能
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';

// 输入接口
export interface JsonParserInput {
  jsonString: string;
  operation: string;
  path?: string;
  transformations?: Array<{
    path: string;
    type: string;
  }>;
}

// 输出接口
export interface JsonParserOutput {
  parsed?: any;
  isValid?: boolean;
  errors?: string[];
  formatted?: string;
  extracted?: any;
  found?: boolean;
  transformed?: any;
}

export const jsonParserFunction: FunctionCall<JsonParserInput, JsonParserOutput> = {
  name: 'json-parser',
  version: '1.0.0',
  description: '解析、验证、格式化和操作JSON数据',
  category: 'data',
  tags: ['json', 'parser', 'validation', 'data'],
  
  inputSchema: {
    type: 'object',
    properties: {
      jsonString: {
        type: 'string',
        description: '要处理的JSON字符串',
        minLength: 1,
      },
      operation: {
        type: 'string',
        enum: ['parse', 'validate', 'format', 'extract', 'transform'],
        description: '要执行的操作',
      },
      path: {
        type: 'string',
        description: '数据提取路径（用于extract操作）',
      },
      transformations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            type: { type: 'string', enum: ['string', 'number', 'boolean', 'array', 'object'] },
          },
          required: ['path', 'type'],
        },
        description: '数据转换规则（用于transform操作）',
      },
    },
    required: ['jsonString', 'operation'],
  },
  
  outputSchema: {
    type: 'object',
    properties: {
      parsed: { description: '解析后的数据' },
      isValid: { type: 'boolean', description: 'JSON是否有效' },
      errors: { type: 'array', items: { type: 'string' }, description: '错误信息' },
      formatted: { type: 'string', description: '格式化后的JSON字符串' },
      extracted: { description: '提取的数据' },
      found: { type: 'boolean', description: '是否找到指定路径的数据' },
      transformed: { description: '转换后的数据' },
    },
  },
  
  validate: (input: JsonParserInput): ValidationResult => {
    const errors: string[] = [];
    
    if (!input.jsonString || typeof input.jsonString !== 'string') {
      errors.push('JSON字符串是必需的且必须是字符串');
    } else if (input.jsonString.trim().length === 0) {
      errors.push('JSON字符串不能为空');
    }
    
    if (!input.operation || typeof input.operation !== 'string') {
      errors.push('操作类型是必需的且必须是字符串');
    } else if (!['parse', 'validate', 'format', 'extract', 'transform'].includes(input.operation)) {
      errors.push('不支持的操作类型');
    }
    
    if (input.operation === 'extract' && !input.path) {
      errors.push('extract操作需要指定path参数');
    }
    
    if (input.operation === 'transform' && (!input.transformations || input.transformations.length === 0)) {
      errors.push('transform操作需要指定transformations参数');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  execute: async (
    input: JsonParserInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<JsonParserOutput>> => {
    const startTime = Date.now();
    
    try {
      // 验证输入
      if (jsonParserFunction.validate) {
        const validation = jsonParserFunction.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: '输入验证失败',
            metadata: { errors: validation.errors },
            executionTime: Date.now() - startTime,
          };
        }
      }
      
      // 执行JSON操作
      const result = performJsonOperation(input);
      
      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          stringLength: input.jsonString.length,
          path: input.path,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `JSON操作失败: ${error.message}`,
        metadata: {
          operation: input.operation,
          stringLength: input.jsonString?.length,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  },
};

/**
 * 执行JSON操作
 */
function performJsonOperation(input: JsonParserInput): JsonParserOutput {
  switch (input.operation) {
    case 'parse':
      return parseJson(input.jsonString);
    
    case 'validate':
      return validateJson(input.jsonString);
    
    case 'format':
      return formatJson(input.jsonString);
    
    case 'extract':
      return extractFromJson(input.jsonString, input.path!);
    
    case 'transform':
      return transformJson(input.jsonString, input.transformations!);
    
    default:
      throw new Error(`不支持的操作类型: ${input.operation}`);
  }
}

/**
 * 解析JSON字符串
 */
function parseJson(jsonString: string): JsonParserOutput {
  try {
    const parsed = JSON.parse(jsonString);
    return { parsed };
  } catch (error: any) {
    throw new Error(`JSON解析失败: ${error.message}`);
  }
}

/**
 * 验证JSON字符串
 */
function validateJson(jsonString: string): JsonParserOutput {
  try {
    JSON.parse(jsonString);
    return { isValid: true };
  } catch (error: any) {
    return {
      isValid: false,
      errors: [error.message],
    };
  }
}

/**
 * 格式化JSON字符串
 */
function formatJson(jsonString: string): JsonParserOutput {
  try {
    const parsed = JSON.parse(jsonString);
    const formatted = JSON.stringify(parsed, null, 2);
    return { formatted };
  } catch (error: any) {
    throw new Error(`JSON格式化失败: ${error.message}`);
  }
}

/**
 * 从JSON中提取数据
 */
function extractFromJson(jsonString: string, path: string): JsonParserOutput {
  try {
    const parsed = JSON.parse(jsonString);
    const extracted = getValueByPath(parsed, path);
    return {
      extracted,
      found: extracted !== undefined,
    };
  } catch (error: any) {
    throw new Error(`数据提取失败: ${error.message}`);
  }
}

/**
 * 转换JSON数据
 */
function transformJson(
  jsonString: string,
  transformations: Array<{ path: string; type: string }>
): JsonParserOutput {
  try {
    const parsed = JSON.parse(jsonString);
    const transformed = { ...parsed };
    
    for (const transform of transformations) {
      const value = getValueByPath(transformed, transform.path);
      if (value !== undefined) {
        const convertedValue = convertValue(value, transform.type);
        setValueByPath(transformed, transform.path, convertedValue);
      }
    }
    
    return { transformed };
  } catch (error: any) {
    throw new Error(`数据转换失败: ${error.message}`);
  }
}

/**
 * 根据路径获取值
 */
function getValueByPath(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * 根据路径设置值
 */
function setValueByPath(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

/**
 * 转换值类型
 */
function convertValue(value: any, type: string): any {
  switch (type) {
    case 'string':
      return String(value);
    case 'number': {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    }
    case 'array':
      return Array.isArray(value) ? value : [value];
    case 'object':
      return typeof value === 'object' && value !== null ? value : { value };
    default:
      return value;
  }
}
