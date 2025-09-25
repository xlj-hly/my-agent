/**
 * Text Summarizer 工具函数
 * 提供文本摘要功能：提取关键句、生成摘要等
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';

// 输入接口
export interface TextSummarizerInput {
  text: string;
  summaryLength: string;
  summaryType?: string;
  maxSentences?: number;
  maxWords?: number;
  options?: {
    preserveFormatting?: boolean;
    includeKeywords?: boolean;
  };
}

// 输出接口
export interface TextSummarizerOutput {
  summary: string;
  summaryType?: string;
  keySentences?: string[];
  keywords?: string[];
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  paragraphCount?: number;
}

export const textSummarizerFunction: FunctionCall<TextSummarizerInput, TextSummarizerOutput> = {
  name: 'text-summarizer',
  version: '1.0.0',
  description: '生成文本摘要，支持提取关键句和抽象摘要',
  category: 'text',
  tags: ['text', 'summarize', 'nlp', 'extract'],
  
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: '要摘要的文本内容',
        minLength: 1,
        maxLength: 100000,
      },
      summaryLength: {
        type: 'string',
        description: '摘要长度',
        enum: ['short', 'medium', 'long', 'custom'],
      },
      summaryType: {
        type: 'string',
        description: '摘要类型',
        enum: ['extractive', 'abstractive'],
        default: 'extractive',
      },
      maxSentences: {
        type: 'number',
        description: '最大句子数（custom模式）',
        minimum: 1,
        maximum: 50,
      },
      maxWords: {
        type: 'number',
        description: '最大词数（custom模式）',
        minimum: 10,
        maximum: 1000,
      },
      options: {
        type: 'object',
        properties: {
          preserveFormatting: { type: 'boolean', default: false },
          includeKeywords: { type: 'boolean', default: false },
        },
        description: '摘要选项',
      },
    },
    required: ['text', 'summaryLength'],
  },
  
  outputSchema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: '生成的摘要文本',
      },
      summaryType: {
        type: 'string',
        description: '使用的摘要类型',
      },
      keySentences: {
        type: 'array',
        items: { type: 'string' },
        description: '提取的关键句子',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '关键词列表',
      },
      originalLength: {
        type: 'number',
        description: '原文长度',
      },
      summaryLength: {
        type: 'number',
        description: '摘要长度',
      },
      compressionRatio: {
        type: 'number',
        description: '压缩比例',
      },
      paragraphCount: {
        type: 'number',
        description: '段落数量',
      },
    },
    required: ['summary', 'originalLength', 'summaryLength', 'compressionRatio'],
  },
  
  validate: (input: TextSummarizerInput): ValidationResult => {
    const errors: string[] = [];
    
    if (!input.text || typeof input.text !== 'string') {
      errors.push('文本内容是必需的且必须是字符串');
    } else if (input.text.trim().length === 0) {
      errors.push('文本内容不能为空');
    } else if (input.text.length > 100000) {
      errors.push('文本内容长度不能超过100000字符');
    }
    
    if (!input.summaryLength || typeof input.summaryLength !== 'string') {
      errors.push('摘要长度是必需的且必须是字符串');
    } else if (!['short', 'medium', 'long', 'custom'].includes(input.summaryLength)) {
      errors.push('不支持的摘要长度类型');
    }
    
    if (input.summaryLength === 'custom') {
      if (!input.maxSentences && !input.maxWords) {
        errors.push('自定义摘要长度需要指定maxSentences或maxWords');
      }
      if (input.maxSentences && (input.maxSentences < 1 || input.maxSentences > 50)) {
        errors.push('最大句子数必须在1-50之间');
      }
      if (input.maxWords && (input.maxWords < 10 || input.maxWords > 1000)) {
        errors.push('最大词数必须在10-1000之间');
      }
    }
    
    if (input.summaryType && !['extractive', 'abstractive'].includes(input.summaryType)) {
      errors.push('不支持的摘要类型');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  execute: async (
    input: TextSummarizerInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<TextSummarizerOutput>> => {
    const startTime = Date.now();
    
    try {
      // 验证输入
      if (textSummarizerFunction.validate) {
        const validation = textSummarizerFunction.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: '输入验证失败',
            metadata: { errors: validation.errors },
            executionTime: Date.now() - startTime,
          };
        }
      }
      
      // 执行文本摘要
      const result = summarizeText(input);
      
      return {
        success: true,
        data: result,
        metadata: {
          summaryLength: input.summaryLength,
          summaryType: input.summaryType || 'extractive',
          originalLength: input.text.length,
          compressionRatio: result.compressionRatio,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `文本摘要失败: ${error.message}`,
        metadata: {
          summaryLength: input.summaryLength,
          originalLength: input.text?.length,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  },
};

/**
 * 执行文本摘要
 */
function summarizeText(input: TextSummarizerInput): TextSummarizerOutput {
  const { text, summaryLength, summaryType = 'extractive', options } = input;
  
  // 计算段落数
  const paragraphCount = text.split(/\n\s*\n/).length || 1;
  
  // 根据摘要类型执行不同策略
  let result: TextSummarizerOutput;
  
  if (summaryType === 'extractive') {
    result = extractiveSummarize(text, summaryLength, input);
  } else {
    result = abstractiveSummarize(text, summaryLength, input);
  }
  
  // 添加统计信息
  result.originalLength = text.length;
  result.summaryLength = result.summary.length;
  result.compressionRatio = result.summaryLength / text.length;
  result.paragraphCount = paragraphCount;
  
  // 添加关键词（如果启用）
  if (options?.includeKeywords) {
    result.keywords = extractKeywords(text);
  }
  
  return result;
}

/**
 * 提取式摘要
 */
function extractiveSummarize(
  text: string,
  summaryLength: string,
  input: TextSummarizerInput
): TextSummarizerOutput {
  const sentences = splitIntoSentences(text);
  const keySentences = selectKeySentences(sentences, summaryLength, input);
  
  return {
    summary: keySentences.join(''),
    summaryType: 'extractive',
    keySentences,
    originalLength: 0, // 将在上层设置
    summaryLength: 0, // 将在上层设置
    compressionRatio: 0, // 将在上层设置
  };
}

/**
 * 抽象式摘要
 */
function abstractiveSummarize(
  text: string,
  summaryLength: string,
  input: TextSummarizerInput
): TextSummarizerOutput {
  // 简化的抽象摘要实现
  const sentences = splitIntoSentences(text);
  const keySentences = selectKeySentences(sentences, summaryLength, input);
  
  // 重新组织句子，使其更连贯
  const abstractedSummary = reorganizeSentences(keySentences);
  
  return {
    summary: abstractedSummary,
    summaryType: 'abstractive',
    keySentences,
    originalLength: 0, // 将在上层设置
    summaryLength: 0, // 将在上层设置
    compressionRatio: 0, // 将在上层设置
  };
}

/**
 * 分割成句子
 */
function splitIntoSentences(text: string): string[] {
  // 简化的句子分割
  return text
    .split(/[.!?。！？]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s + (s.match(/[.!?。！？]$/) ? '' : '。'));
}

/**
 * 选择关键句子
 */
function selectKeySentences(
  sentences: string[],
  summaryLength: string,
  input: TextSummarizerInput
): string[] {
  if (sentences.length <= 1) {
    return sentences;
  }
  
  let maxSentences: number;
  
  switch (summaryLength) {
    case 'short':
      maxSentences = Math.max(1, Math.floor(sentences.length * 0.2));
      break;
    case 'medium':
      maxSentences = Math.max(1, Math.floor(sentences.length * 0.4));
      break;
    case 'long':
      maxSentences = Math.max(1, Math.floor(sentences.length * 0.6));
      break;
    case 'custom':
      maxSentences = input.maxSentences || Math.max(1, Math.floor(sentences.length * 0.3));
      break;
    default:
      maxSentences = Math.max(1, Math.floor(sentences.length * 0.3));
  }
  
  // 简化的关键句选择：选择较长的句子
  return sentences
    .sort((a, b) => b.length - a.length)
    .slice(0, maxSentences)
    .sort((a, b) => sentences.indexOf(a) - sentences.indexOf(b)); // 保持原文顺序
}

/**
 * 重新组织句子
 */
function reorganizeSentences(sentences: string[]): string {
  // 简化实现：直接连接句子
  return sentences.join('');
}

/**
 * 提取关键词
 */
function extractKeywords(text: string): string[] {
  const words = text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2 && /[\u4e00-\u9fa5a-zA-Z]/.test(word));
  
  const frequency: { [key: string]: number } = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }
  
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}
