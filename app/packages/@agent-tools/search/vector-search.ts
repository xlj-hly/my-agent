/**
 * Vector Search 工具函数
 * 提供向量相似度搜索功能（基于内存的模拟实现）
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';

// 输入接口
export interface VectorSearchInput {
  queryVector: number[];
  maxResults?: number;
  similarityThreshold?: number;
  vectorSpace?: string;
}

// 输出接口
export interface VectorSearchResult {
  id: string;
  content: string;
  vector: number[];
  similarityScore: number;
  metadata?: Record<string, any>;
}

export const vectorSearchFunction: FunctionCall<VectorSearchInput, VectorSearchResult[]> = {
  name: 'vector-search',
  version: '1.0.0',
  description: '基于向量相似度的搜索功能',
  category: 'search',
  tags: ['search', 'vector', 'similarity', 'embedding'],
  
  inputSchema: {
    type: 'object',
    properties: {
      queryVector: {
        type: 'array',
        items: { type: 'number' },
        description: '查询向量',
        minItems: 1,
        maxItems: 2048,
      },
      maxResults: {
        type: 'number',
        description: '最大结果数量',
        minimum: 1,
        maximum: 100,
        default: 10,
      },
      similarityThreshold: {
        type: 'number',
        description: '相似度阈值',
        minimum: 0,
        maximum: 1,
        default: 0.5,
      },
      vectorSpace: {
        type: 'string',
        description: '向量空间标识',
        default: 'default',
      },
    },
    required: ['queryVector'],
  },
  
  outputSchema: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '文档唯一标识',
        },
        content: {
          type: 'string',
          description: '文档内容',
        },
        vector: {
          type: 'array',
          items: { type: 'number' },
          description: '文档向量',
        },
        similarityScore: {
          type: 'number',
          description: '相似度分数（0-1）',
          minimum: 0,
          maximum: 1,
        },
        metadata: {
          type: 'object',
          description: '额外元数据',
        },
      },
      required: ['id', 'content', 'vector', 'similarityScore'],
    },
  },
  
  validate: (input: VectorSearchInput): ValidationResult => {
    const errors: string[] = [];
    
    if (!Array.isArray(input.queryVector)) {
      errors.push('查询向量必须是数组');
    } else if (input.queryVector.length === 0) {
      errors.push('查询向量不能为空');
    } else if (input.queryVector.length > 2048) {
      errors.push('查询向量维度不能超过2048');
    } else if (!input.queryVector.every(v => typeof v === 'number' && !isNaN(v))) {
      errors.push('查询向量中的所有元素必须是有效数字');
    }
    
    if (input.maxResults !== undefined) {
      if (typeof input.maxResults !== 'number' || input.maxResults < 1 || input.maxResults > 100) {
        errors.push('最大结果数量必须是1-100之间的数字');
      }
    }
    
    if (input.similarityThreshold !== undefined) {
      if (typeof input.similarityThreshold !== 'number' || 
          input.similarityThreshold < 0 || 
          input.similarityThreshold > 1) {
        errors.push('相似度阈值必须是0-1之间的数字');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  execute: async (
    input: VectorSearchInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<VectorSearchResult[]>> => {
    const startTime = Date.now();
    
    try {
      // 验证输入
      if (vectorSearchFunction.validate) {
        const validation = vectorSearchFunction.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: '输入验证失败',
            metadata: { errors: validation.errors },
            executionTime: Date.now() - startTime,
          };
        }
      }
      
      // 执行向量搜索
      const results = await performVectorSearch(input);
      
      return {
        success: true,
        data: results,
        metadata: {
          vectorDimension: input.queryVector.length,
          similarityThreshold: input.similarityThreshold || 0.5,
          maxResults: input.maxResults || 10,
          totalResults: results.length,
          vectorSpace: input.vectorSpace || 'default',
          searchTime: Date.now() - startTime,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `向量搜索失败: ${error.message}`,
        metadata: {
          vectorDimension: input.queryVector?.length,
          errorType: error.name,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  },
};

/**
 * 执行向量搜索（模拟实现）
 */
async function performVectorSearch(input: VectorSearchInput): Promise<VectorSearchResult[]> {
  const maxResults = Math.min(input.maxResults || 10, 100);
  const similarityThreshold = input.similarityThreshold || 0.5;
  const queryVector = input.queryVector;
  
  // 模拟搜索延迟
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
  
  // 生成模拟的文档向量数据库
  const mockDocuments = generateMockDocuments(queryVector.length, 50);
  
  // 计算每个文档与查询向量的相似度
  const scoredResults: VectorSearchResult[] = [];
  
  for (const doc of mockDocuments) {
    const similarity = calculateCosineSimilarity(queryVector, doc.vector);
    
    if (similarity >= similarityThreshold) {
      scoredResults.push({
        ...doc,
        similarityScore: similarity,
      });
    }
  }
  
  // 按相似度分数降序排序
  scoredResults.sort((a, b) => b.similarityScore - a.similarityScore);
  
  // 返回前N个结果
  return scoredResults.slice(0, maxResults);
}

/**
 * 计算余弦相似度
 */
function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('向量维度不匹配');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * 生成模拟文档向量数据库
 */
function generateMockDocuments(vectorDimension: number, count: number): Omit<VectorSearchResult, 'similarityScore'>[] {
  const documents: Omit<VectorSearchResult, 'similarityScore'>[] = [];
  
  const contentTemplates = [
    '人工智能和机器学习的最新发展',
    '深度学习的神经网络架构',
    '自然语言处理的技术应用',
    '计算机视觉和图像识别',
    '数据科学和统计分析',
    '云计算和分布式系统',
    '区块链和加密货币技术',
    '物联网和智能设备',
    '软件开发最佳实践',
    '数据库设计和优化',
    '网络安全和信息保护',
    '移动应用开发技术',
    'Web前端开发框架',
    '后端API设计模式',
    '微服务架构设计',
  ];
  
  for (let i = 0; i < count; i++) {
    const content = contentTemplates[i % contentTemplates.length];
    const vector = generateRandomVector(vectorDimension);
    
    documents.push({
      id: `doc_${i + 1}`,
      content: `${content} - 文档 ${i + 1}`,
      vector,
      metadata: {
        category: `category_${(i % 5) + 1}`,
        tags: [`tag_${i % 3 + 1}`, `tag_${(i + 1) % 3 + 1}`],
        createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }
  
  return documents;
}

/**
 * 生成随机向量
 */
function generateRandomVector(dimension: number): number[] {
  const vector: number[] = [];
  let norm = 0;
  
  // 生成随机向量
  for (let i = 0; i < dimension; i++) {
    vector[i] = (Math.random() - 0.5) * 2; // -1 到 1 之间的随机数
    norm += vector[i] * vector[i];
  }
  
  // 归一化向量
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimension; i++) {
      vector[i] = vector[i] / norm;
    }
  }
  
  return vector;
}
