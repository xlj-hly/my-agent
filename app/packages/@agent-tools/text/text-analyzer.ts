/**
 * Text Analyzer 工具函数
 * 提供文本分析功能：词频统计、关键词提取、情感分析等
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';

// 输入接口
export interface TextAnalyzerInput {
  text: string;
  analysisType: string;
  options?: {
    language?: string;
    maxKeywords?: number;
    minWordLength?: number;
  };
}

// 输出接口
export interface TextAnalyzerOutput {
  wordFrequency?: { [key: string]: number };
  keywords?: string[];
  sentiment?: {
    score: number;
    label: string;
  };
  statistics?: {
    charCount: number;
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
  };
}

export const textAnalyzerFunction: FunctionCall<TextAnalyzerInput, TextAnalyzerOutput> = {
  name: 'text-analyzer',
  version: '1.0.0',
  description: '分析文本内容，提供词频统计、关键词提取、情感分析等功能',
  category: 'text',
  tags: ['text', 'analyze', 'nlp', 'statistics'],
  
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: '要分析的文本内容',
        minLength: 1,
        maxLength: 100000,
      },
      analysisType: {
        type: 'string',
        description: '分析类型',
        enum: ['word-frequency', 'keywords', 'sentiment', 'statistics', 'comprehensive'],
      },
      options: {
        type: 'object',
        properties: {
          language: { type: 'string', default: 'zh-CN' },
          maxKeywords: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          minWordLength: { type: 'number', minimum: 1, maximum: 10, default: 2 },
        },
        description: '分析选项',
      },
    },
    required: ['text', 'analysisType'],
  },
  
  outputSchema: {
    type: 'object',
    properties: {
      wordFrequency: {
        type: 'object',
        additionalProperties: { type: 'number' },
        description: '词频统计结果',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '关键词列表',
      },
      sentiment: {
        type: 'object',
        properties: {
          score: { type: 'number', description: '情感得分 (-1 到 1)' },
          label: { type: 'string', description: '情感标签' },
        },
        description: '情感分析结果',
      },
      statistics: {
        type: 'object',
        properties: {
          charCount: { type: 'number', description: '字符数' },
          wordCount: { type: 'number', description: '词数' },
          sentenceCount: { type: 'number', description: '句子数' },
          paragraphCount: { type: 'number', description: '段落数' },
        },
        description: '文本统计信息',
      },
    },
  },
  
  validate: (input: TextAnalyzerInput): ValidationResult => {
    const errors: string[] = [];
    
    if (!input.text || typeof input.text !== 'string') {
      errors.push('文本内容是必需的且必须是字符串');
    } else if (input.text.trim().length === 0) {
      errors.push('文本内容不能为空');
    } else if (input.text.length > 100000) {
      errors.push('文本内容长度不能超过100000字符');
    }
    
    if (!input.analysisType || typeof input.analysisType !== 'string') {
      errors.push('分析类型是必需的且必须是字符串');
    } else if (!['word-frequency', 'keywords', 'sentiment', 'statistics', 'comprehensive'].includes(input.analysisType)) {
      errors.push('不支持的分析类型');
    }
    
    if (input.options) {
      if (input.options.maxKeywords && (input.options.maxKeywords < 1 || input.options.maxKeywords > 100)) {
        errors.push('最大关键词数量必须在1-100之间');
      }
      if (input.options.minWordLength && (input.options.minWordLength < 1 || input.options.minWordLength > 10)) {
        errors.push('最小词长度必须在1-10之间');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  execute: async (
    input: TextAnalyzerInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<TextAnalyzerOutput>> => {
    const startTime = Date.now();
    
    try {
      // 验证输入
      if (textAnalyzerFunction.validate) {
        const validation = textAnalyzerFunction.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: '输入验证失败',
            metadata: { errors: validation.errors },
            executionTime: Date.now() - startTime,
          };
        }
      }
      
      // 执行文本分析
      const result = analyzeText(input);
      
      return {
        success: true,
        data: result,
        metadata: {
          analysisType: input.analysisType,
          textLength: input.text.length,
          language: input.options?.language || 'zh-CN',
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `文本分析失败: ${error.message}`,
        metadata: {
          analysisType: input.analysisType,
          textLength: input.text?.length,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  },
};

/**
 * 执行文本分析
 */
function analyzeText(input: TextAnalyzerInput): TextAnalyzerOutput {
  const { text, analysisType } = input;
  const options = input.options || {};
  
  const result: TextAnalyzerOutput = {};
  
  switch (analysisType) {
    case 'word-frequency':
      result.wordFrequency = calculateWordFrequency(text, options);
      break;
      
    case 'keywords':
      result.keywords = extractKeywords(text, options);
      break;
      
    case 'sentiment':
      result.sentiment = analyzeSentiment(text);
      break;
      
    case 'statistics':
      result.statistics = calculateStatistics(text);
      break;
      
    case 'comprehensive':
      result.wordFrequency = calculateWordFrequency(text, options);
      result.keywords = extractKeywords(text, options);
      result.sentiment = analyzeSentiment(text);
      result.statistics = calculateStatistics(text);
      break;
  }
  
  return result;
}

/**
 * 计算词频
 */
function calculateWordFrequency(text: string, options: any): { [key: string]: number } {
  const words = extractWords(text, options.minWordLength || 2);
  const frequency: { [key: string]: number } = {};
  
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }
  
  return frequency;
}

/**
 * 提取关键词
 */
function extractKeywords(text: string, options: any): string[] {
  const maxKeywords = options.maxKeywords || 10;
  const wordFrequency = calculateWordFrequency(text, options);
  
  // 按频率排序并提取关键词
  const sortedWords = Object.entries(wordFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
  
  return sortedWords;
}

/**
 * 分析情感
 */
function analyzeSentiment(text: string): { score: number; label: string } {
  // 简化的情感分析实现
  const positiveWords = ['好', '棒', '优秀', '完美', '喜欢', '爱', '开心', '高兴', '满意', '赞'];
  const negativeWords = ['坏', '差', '糟糕', '讨厌', '恨', '难过', '伤心', '失望', '愤怒', '糟糕'];
  
  const words = extractWords(text, 1);
  let score = 0;
  
  for (const word of words) {
    if (positiveWords.includes(word)) {
      score += 1;
    } else if (negativeWords.includes(word)) {
      score -= 1;
    }
  }
  
  // 归一化到 -1 到 1
  const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(1, words.length)));
  
  let label = 'neutral';
  if (normalizedScore > 0.2) {
    label = 'positive';
  } else if (normalizedScore < -0.2) {
    label = 'negative';
  }
  
  return { score: normalizedScore, label };
}

/**
 * 计算文本统计信息
 */
function calculateStatistics(text: string): {
  charCount: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
} {
  const charCount = text.length;
  const words = extractWords(text, 1);
  const wordCount = words.length;
  const sentenceCount = (text.match(/[.!?。！？]/g) || []).length || 1;
  const paragraphCount = text.split(/\n\s*\n/).length || 1;
  
  return {
    charCount,
    wordCount,
    sentenceCount,
    paragraphCount,
  };
}

/**
 * 提取词语
 */
function extractWords(text: string, minLength: number): string[] {
  // 简化的中文分词实现
  // 先按标点符号分割，然后按字符分割
  const words: string[] = [];
  
  // 移除标点符号，保留中文、英文、数字和空格
  const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');
  
  // 按空格分割
  const spaceWords = cleanText.split(/\s+/).filter(word => word.length >= minLength);
  
  // 对中文文本进行字符级分割（简化实现）
  for (const word of spaceWords) {
    if (/[\u4e00-\u9fa5]/.test(word)) {
      // 中文文本，按字符分割
      const chars = word.split('');
      for (let i = 0; i < chars.length - 1; i++) {
        const twoChar = chars[i] + chars[i + 1];
        if (twoChar.length >= minLength) {
          words.push(twoChar);
        }
      }
    } else {
      // 英文或数字，直接添加
      words.push(word);
    }
  }
  
  return words.filter(word => word.length >= minLength && /[\u4e00-\u9fa5a-zA-Z]/.test(word));
}
