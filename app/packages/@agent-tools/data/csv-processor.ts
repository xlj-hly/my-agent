/**
 * CSV Processor 工具函数
 * 提供CSV解析、生成、过滤、排序等功能
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';

// 输入接口
export interface CsvProcessorInput {
  csvData?: string;
  data?: any[];
  operation: string;
  delimiter?: string;
  filters?: Array<{
    column: string;
    value: any;
    operator?: string;
  }>;
  sortBy?: string;
  sortOrder?: string;
  groupBy?: string;
  aggregations?: Array<{
    column: string;
    operation: string;
  }>;
  transformations?: Array<{
    column: string;
    operation: string;
  }>;
}

// 输出接口
export interface CsvProcessorOutput {
  parsed?: any[];
  csv?: string;
  filtered?: any[];
  sorted?: any[];
  aggregated?: { [key: string]: any };
  transformed?: any[];
  headers?: string[];
  rowCount?: number;
  columnCount?: number;
}

export const csvProcessorFunction: FunctionCall<CsvProcessorInput, CsvProcessorOutput> = {
  name: 'csv-processor',
  version: '1.0.0',
  description: '解析、生成、过滤、排序和处理CSV数据',
  category: 'data',
  tags: ['csv', 'parser', 'data', 'processing'],
  
  inputSchema: {
    type: 'object',
    properties: {
      csvData: {
        type: 'string',
        description: '要处理的CSV数据字符串',
      },
      data: {
        type: 'array',
        description: '要转换为CSV的数据数组',
      },
      operation: {
        type: 'string',
        enum: ['parse', 'generate', 'filter', 'sort', 'aggregate', 'transform'],
        description: '要执行的操作',
      },
      delimiter: {
        type: 'string',
        description: 'CSV分隔符',
        default: ',',
      },
      filters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            column: { type: 'string' },
            value: {},
            operator: { type: 'string', enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains'] },
          },
          required: ['column', 'value'],
        },
        description: '过滤条件',
      },
      sortBy: {
        type: 'string',
        description: '排序字段',
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: '排序顺序',
        default: 'asc',
      },
      groupBy: {
        type: 'string',
        description: '分组字段（用于聚合操作）',
      },
      aggregations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            column: { type: 'string' },
            operation: { type: 'string', enum: ['sum', 'avg', 'count', 'min', 'max'] },
          },
          required: ['column', 'operation'],
        },
        description: '聚合操作',
      },
      transformations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            column: { type: 'string' },
            operation: { type: 'string', enum: ['to_number', 'to_string', 'to_uppercase', 'to_lowercase'] },
          },
          required: ['column', 'operation'],
        },
        description: '数据转换规则',
      },
    },
    required: ['operation'],
  },
  
  outputSchema: {
    type: 'object',
    properties: {
      parsed: { type: 'array', description: '解析后的数据' },
      csv: { type: 'string', description: '生成的CSV字符串' },
      filtered: { type: 'array', description: '过滤后的数据' },
      sorted: { type: 'array', description: '排序后的数据' },
      aggregated: { type: 'object', description: '聚合结果' },
      transformed: { type: 'array', description: '转换后的数据' },
      headers: { type: 'array', items: { type: 'string' }, description: 'CSV头部' },
      rowCount: { type: 'number', description: '行数' },
      columnCount: { type: 'number', description: '列数' },
    },
  },
  
  validate: (input: CsvProcessorInput): ValidationResult => {
    const errors: string[] = [];
    
    if (!input.operation || typeof input.operation !== 'string') {
      errors.push('操作类型是必需的且必须是字符串');
    } else if (!['parse', 'generate', 'filter', 'sort', 'aggregate', 'transform'].includes(input.operation)) {
      errors.push('不支持的操作类型');
    }
    
    if (input.operation === 'parse' && !input.csvData) {
      errors.push('parse操作需要csvData参数');
    }
    
    if (input.operation === 'generate' && (!input.data || !Array.isArray(input.data))) {
      errors.push('generate操作需要data数组参数');
    }
    
    if ((input.operation === 'filter' || input.operation === 'sort' || input.operation === 'aggregate' || input.operation === 'transform') && !input.csvData) {
      errors.push(`${input.operation}操作需要csvData参数`);
    }
    
    if (input.operation === 'sort' && !input.sortBy) {
      errors.push('sort操作需要sortBy参数');
    }
    
    if (input.operation === 'aggregate' && !input.groupBy) {
      errors.push('aggregate操作需要groupBy参数');
    }
    
    if (input.operation === 'aggregate' && (!input.aggregations || input.aggregations.length === 0)) {
      errors.push('aggregate操作需要aggregations参数');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  execute: async (
    input: CsvProcessorInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<CsvProcessorOutput>> => {
    const startTime = Date.now();
    
    try {
      // 验证输入
      if (csvProcessorFunction.validate) {
        const validation = csvProcessorFunction.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: '输入验证失败',
            metadata: { errors: validation.errors },
            executionTime: Date.now() - startTime,
          };
        }
      }
      
      // 执行CSV操作
      const result = performCsvOperation(input);
      
      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          rowCount: result.rowCount,
          columnCount: result.columnCount,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `CSV操作失败: ${error.message}`,
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
 * 执行CSV操作
 */
function performCsvOperation(input: CsvProcessorInput): CsvProcessorOutput {
  const delimiter = input.delimiter || ',';
  
  switch (input.operation) {
    case 'parse':
      return parseCsv(input.csvData!, delimiter);
    
    case 'generate':
      return generateCsv(input.data!, delimiter);
    
    case 'filter':
      const parsed = parseCsv(input.csvData!, delimiter);
      return filterCsv(parsed.parsed!, input.filters!);
    
    case 'sort':
      const parsedForSort = parseCsv(input.csvData!, delimiter);
      return sortCsv(parsedForSort.parsed!, input.sortBy!, input.sortOrder || 'asc');
    
    case 'aggregate':
      const parsedForAgg = parseCsv(input.csvData!, delimiter);
      return aggregateCsv(parsedForAgg.parsed!, input.groupBy!, input.aggregations!);
    
    case 'transform':
      const parsedForTransform = parseCsv(input.csvData!, delimiter);
      return transformCsv(parsedForTransform.parsed!, input.transformations!);
    
    default:
      throw new Error(`不支持的操作类型: ${input.operation}`);
  }
}

/**
 * 解析CSV字符串
 */
function parseCsv(csvData: string, delimiter: string): CsvProcessorOutput {
  if (!csvData.trim()) {
    throw new Error('CSV数据不能为空');
  }
  
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV数据格式无效');
  }
  
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const rows: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim());
    if (values.length !== headers.length) {
      throw new Error(`第${i + 1}行数据列数不匹配`);
    }
    
    const row: any = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }
    rows.push(row);
  }
  
  return {
    parsed: rows,
    headers,
    rowCount: rows.length,
    columnCount: headers.length,
  };
}

/**
 * 生成CSV字符串
 */
function generateCsv(data: any[], delimiter: string): CsvProcessorOutput {
  if (!data || data.length === 0) {
    throw new Error('数据数组不能为空');
  }
  
  const headers = Object.keys(data[0]);
  const csvLines = [headers.join(delimiter)];
  
  for (const row of data) {
    const values = headers.map(header => String(row[header] || ''));
    csvLines.push(values.join(delimiter));
  }
  
  return {
    csv: csvLines.join('\n'),
    headers,
    rowCount: data.length,
    columnCount: headers.length,
  };
}

/**
 * 过滤CSV数据
 */
function filterCsv(data: any[], filters: Array<{ column: string; value: any; operator?: string }>): CsvProcessorOutput {
  let filtered = [...data];
  
  for (const filter of filters) {
    const operator = filter.operator || 'eq';
    filtered = filtered.filter(row => {
      const value = row[filter.column];
      switch (operator) {
        case 'eq': return value == filter.value;
        case 'ne': return value != filter.value;
        case 'gt': return Number(value) > Number(filter.value);
        case 'lt': return Number(value) < Number(filter.value);
        case 'gte': return Number(value) >= Number(filter.value);
        case 'lte': return Number(value) <= Number(filter.value);
        case 'contains': return String(value).includes(String(filter.value));
        default: return value == filter.value;
      }
    });
  }
  
  return {
    filtered,
    rowCount: filtered.length,
  };
}

/**
 * 排序CSV数据
 */
function sortCsv(data: any[], sortBy: string, sortOrder: string): CsvProcessorOutput {
  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    let comparison = 0;
    if (aVal < bVal) comparison = -1;
    else if (aVal > bVal) comparison = 1;
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return {
    sorted,
    rowCount: sorted.length,
  };
}

/**
 * 聚合CSV数据
 */
function aggregateCsv(data: any[], groupBy: string, aggregations: Array<{ column: string; operation: string }>): CsvProcessorOutput {
  const groups: { [key: string]: any[] } = {};
  
  // 分组
  for (const row of data) {
    const groupValue = row[groupBy];
    if (!groups[groupValue]) {
      groups[groupValue] = [];
    }
    groups[groupValue].push(row);
  }
  
  // 聚合
  const aggregated: { [key: string]: any } = {};
  for (const [groupValue, rows] of Object.entries(groups)) {
    aggregated[groupValue] = {};
    
    for (const agg of aggregations) {
      const values = rows.map(row => Number(row[agg.column])).filter(v => !isNaN(v));
      
      switch (agg.operation) {
        case 'sum':
          aggregated[groupValue][`${agg.column}_sum`] = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          aggregated[groupValue][`${agg.column}_avg`] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
          break;
        case 'count':
          aggregated[groupValue][`${agg.column}_count`] = values.length;
          break;
        case 'min':
          aggregated[groupValue][`${agg.column}_min`] = values.length > 0 ? Math.min(...values) : 0;
          break;
        case 'max':
          aggregated[groupValue][`${agg.column}_max`] = values.length > 0 ? Math.max(...values) : 0;
          break;
      }
    }
  }
  
  return {
    aggregated,
  };
}

/**
 * 转换CSV数据
 */
function transformCsv(data: any[], transformations: Array<{ column: string; operation: string }>): CsvProcessorOutput {
  const transformed = data.map(row => {
    const newRow = { ...row };
    
    for (const transform of transformations) {
      const value = newRow[transform.column];
      if (value !== undefined) {
        switch (transform.operation) {
          case 'to_number':
            newRow[transform.column] = Number(value);
            break;
          case 'to_string':
            newRow[transform.column] = String(value);
            break;
          case 'to_uppercase':
            newRow[transform.column] = String(value).toUpperCase();
            break;
          case 'to_lowercase':
            newRow[transform.column] = String(value).toLowerCase();
            break;
        }
      }
    }
    
    return newRow;
  });
  
  return {
    transformed,
    rowCount: transformed.length,
  };
}
