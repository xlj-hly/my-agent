/**
 * Statistics 工具函数
 * 提供统计计算功能
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';

// 输入接口
export interface StatisticsInput {
  data: number[];
  operations: string[];
  percentile?: number;
}

// 输出接口
export interface StatisticsOutput {
  mean?: number;
  median?: number;
  mode?: number;
  variance?: number;
  stddev?: number;
  min?: number;
  max?: number;
  range?: number;
  percentile25?: number;
  percentile50?: number;
  percentile75?: number;
  percentile90?: number;
  percentile95?: number;
  percentile99?: number;
}

export const statisticsFunction: FunctionCall<StatisticsInput, StatisticsOutput> = {
  name: 'statistics',
  version: '1.0.0',
  description: '计算统计指标',
  category: 'calculation',
  tags: ['statistics', 'math', 'analysis'],
  
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { type: 'number' },
        description: '要分析的数据数组',
        minItems: 1,
        maxItems: 10000,
      },
      operations: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['mean', 'median', 'mode', 'variance', 'stddev', 'min', 'max', 'range', 'percentile']
        },
        description: '要执行的统计运算',
        minItems: 1,
      },
      percentile: {
        type: 'number',
        description: '百分位数（0-100）',
        minimum: 0,
        maximum: 100,
        default: 50,
      },
    },
    required: ['data', 'operations'],
  },
  
  outputSchema: {
    type: 'object',
    properties: {
      mean: { type: 'number', description: '平均值' },
      median: { type: 'number', description: '中位数' },
      mode: { type: 'number', description: '众数' },
      variance: { type: 'number', description: '方差' },
      stddev: { type: 'number', description: '标准差' },
      min: { type: 'number', description: '最小值' },
      max: { type: 'number', description: '最大值' },
      range: { type: 'number', description: '极差' },
      percentile25: { type: 'number', description: '25%分位数' },
      percentile50: { type: 'number', description: '50%分位数' },
      percentile75: { type: 'number', description: '75%分位数' },
      percentile90: { type: 'number', description: '90%分位数' },
      percentile95: { type: 'number', description: '95%分位数' },
      percentile99: { type: 'number', description: '99%分位数' },
    },
  },
  
  validate: (input: StatisticsInput): ValidationResult => {
    const errors: string[] = [];
    
    if (!Array.isArray(input.data)) {
      errors.push('数据必须是数组');
    } else if (input.data.length === 0) {
      errors.push('数据数组不能为空');
    } else if (input.data.length > 10000) {
      errors.push('数据数组长度不能超过10000');
    } else if (!input.data.every(n => typeof n === 'number' && !isNaN(n))) {
      errors.push('数据数组中的所有元素必须是有效数字');
    }
    
    if (!Array.isArray(input.operations)) {
      errors.push('运算列表必须是数组');
    } else if (input.operations.length === 0) {
      errors.push('运算列表不能为空');
    } else {
      const validOperations = ['mean', 'median', 'mode', 'variance', 'stddev', 'min', 'max', 'range', 'percentile'];
      const invalidOps = input.operations.filter(op => !validOperations.includes(op));
      if (invalidOps.length > 0) {
        errors.push(`不支持的运算类型: ${invalidOps.join(', ')}`);
      }
    }
    
    if (input.percentile !== undefined) {
      if (typeof input.percentile !== 'number' || input.percentile < 0 || input.percentile > 100) {
        errors.push('百分位数必须是0-100之间的数字');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  execute: async (
    input: StatisticsInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<StatisticsOutput>> => {
    const startTime = Date.now();
    
    try {
      // 验证输入
      if (statisticsFunction.validate) {
        const validation = statisticsFunction.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: '输入验证失败',
            metadata: { errors: validation.errors },
            executionTime: Date.now() - startTime,
          };
        }
      }
      
      // 执行统计计算
      const result = calculateStatistics(input.data, input.operations, input.percentile);
      
      return {
        success: true,
        data: result,
        metadata: {
          dataLength: input.data.length,
          operations: input.operations,
          percentile: input.percentile,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `统计计算失败: ${error.message}`,
        metadata: {
          dataLength: input.data?.length,
          operations: input.operations,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  },
};

/**
 * 计算统计指标
 */
function calculateStatistics(
  data: number[],
  operations: string[],
  percentile?: number
): StatisticsOutput {
  const result: StatisticsOutput = {};
  const sortedData = [...data].sort((a, b) => a - b);
  
  for (const operation of operations) {
    switch (operation) {
      case 'mean':
        result.mean = data.reduce((sum, num) => sum + num, 0) / data.length;
        break;
        
      case 'median':
        result.median = calculateMedian(sortedData);
        break;
        
      case 'mode':
        result.mode = calculateMode(data);
        break;
        
      case 'variance':
        const mean = result.mean || calculateMean(data);
        result.variance = data.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / data.length;
        break;
        
      case 'stddev':
        const variance = result.variance || calculateVariance(data);
        result.stddev = Math.sqrt(variance);
        break;
        
      case 'min':
        result.min = Math.min(...data);
        break;
        
      case 'max':
        result.max = Math.max(...data);
        break;
        
      case 'range':
        result.range = Math.max(...data) - Math.min(...data);
        break;
        
      case 'percentile':
        const p = percentile || 50;
        if (p === 25) result.percentile25 = calculatePercentile(sortedData, 25);
        else if (p === 50) result.percentile50 = calculatePercentile(sortedData, 50);
        else if (p === 75) result.percentile75 = calculatePercentile(sortedData, 75);
        else if (p === 90) result.percentile90 = calculatePercentile(sortedData, 90);
        else if (p === 95) result.percentile95 = calculatePercentile(sortedData, 95);
        else if (p === 99) result.percentile99 = calculatePercentile(sortedData, 99);
        break;
    }
  }
  
  return result;
}

/**
 * 计算平均值
 */
function calculateMean(data: number[]): number {
  return data.reduce((sum, num) => sum + num, 0) / data.length;
}

/**
 * 计算中位数
 */
function calculateMedian(sortedData: number[]): number {
  const len = sortedData.length;
  if (len % 2 === 0) {
    return (sortedData[len / 2 - 1] + sortedData[len / 2]) / 2;
  } else {
    return sortedData[Math.floor(len / 2)];
  }
}

/**
 * 计算众数
 */
function calculateMode(data: number[]): number {
  const frequency: { [key: number]: number } = {};
  
  for (const num of data) {
    frequency[num] = (frequency[num] || 0) + 1;
  }
  
  let maxFreq = 0;
  let mode = data[0];
  
  for (const [num, freq] of Object.entries(frequency)) {
    if (freq > maxFreq) {
      maxFreq = freq;
      mode = Number(num);
    }
  }
  
  return mode;
}

/**
 * 计算方差
 */
function calculateVariance(data: number[]): number {
  const mean = calculateMean(data);
  return data.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / data.length;
}

/**
 * 计算百分位数
 */
function calculatePercentile(sortedData: number[], percentile: number): number {
  const index = (percentile / 100) * (sortedData.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  
  if (upper >= sortedData.length) {
    return sortedData[sortedData.length - 1];
  }
  
  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}
