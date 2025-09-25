/**
 * Semantic Search 工具函数
 * 提供基于语义理解的搜索功能（基于关键词匹配的模拟实现）
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';

// 输入接口
export interface SemanticSearchInput {
  query: string;
  maxResults?: number;
  semanticThreshold?: number;
  language?: string;
  includeMetadata?: boolean;
}

// 输出接口
export interface SemanticSearchResult {
  id: string;
  content: string;
  semanticScore: number;
  keywords: string[];
  metadata?: Record<string, any>;
}

export const semanticSearchFunction: FunctionCall<SemanticSearchInput, SemanticSearchResult[]> = {
  name: 'semantic-search',
  version: '1.0.0',
  description: '基于语义理解的智能搜索功能',
  category: 'search',
  tags: ['search', 'semantic', 'nlp', 'intelligence'],
  
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索查询文本',
        minLength: 1,
        maxLength: 500,
      },
      maxResults: {
        type: 'number',
        description: '最大结果数量',
        minimum: 1,
        maximum: 100,
        default: 10,
      },
      semanticThreshold: {
        type: 'number',
        description: '语义相似度阈值',
        minimum: 0,
        maximum: 1,
        default: 0.5,
      },
      language: {
        type: 'string',
        description: '查询语言',
        default: 'zh-CN',
        enum: ['zh-CN', 'en-US', 'ja-JP'],
      },
      includeMetadata: {
        type: 'boolean',
        description: '是否包含详细元数据',
        default: true,
      },
    },
    required: ['query'],
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
        semanticScore: {
          type: 'number',
          description: '语义相似度分数（0-1）',
          minimum: 0,
          maximum: 1,
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: '提取的关键词',
        },
        metadata: {
          type: 'object',
          description: '额外元数据',
        },
      },
      required: ['id', 'content', 'semanticScore', 'keywords'],
    },
  },
  
  validate: (input: SemanticSearchInput): ValidationResult => {
    const errors: string[] = [];
    
    if (!input.query || typeof input.query !== 'string') {
      errors.push('查询文本是必需的且必须是字符串');
    } else if (input.query.trim().length === 0) {
      errors.push('查询文本不能为空');
    } else if (input.query.length > 500) {
      errors.push('查询文本长度不能超过500个字符');
    }
    
    if (input.maxResults !== undefined) {
      if (typeof input.maxResults !== 'number' || input.maxResults < 1 || input.maxResults > 100) {
        errors.push('最大结果数量必须是1-100之间的数字');
      }
    }
    
    if (input.semanticThreshold !== undefined) {
      if (typeof input.semanticThreshold !== 'number' || 
          input.semanticThreshold < 0 || 
          input.semanticThreshold > 1) {
        errors.push('语义相似度阈值必须是0-1之间的数字');
      }
    }
    
    if (input.language && !['zh-CN', 'en-US', 'ja-JP'].includes(input.language)) {
      errors.push('不支持的语言类型');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  execute: async (
    input: SemanticSearchInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<SemanticSearchResult[]>> => {
    const startTime = Date.now();
    
    try {
      // 验证输入
      if (semanticSearchFunction.validate) {
        const validation = semanticSearchFunction.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: '输入验证失败',
            metadata: { errors: validation.errors },
            executionTime: Date.now() - startTime,
          };
        }
      }
      
      // 执行语义搜索
      const results = await performSemanticSearch(input);
      
      return {
        success: true,
        data: results,
        metadata: {
          query: input.query,
          semanticThreshold: input.semanticThreshold || 0.5,
          maxResults: input.maxResults || 10,
          language: input.language || 'zh-CN',
          totalResults: results.length,
          searchTime: Date.now() - startTime,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `语义搜索失败: ${error.message}`,
        metadata: {
          query: input.query,
          errorType: error.name,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  },
};

/**
 * 执行语义搜索（模拟实现）
 */
async function performSemanticSearch(input: SemanticSearchInput): Promise<SemanticSearchResult[]> {
  const maxResults = Math.min(input.maxResults || 10, 100);
  const semanticThreshold = input.semanticThreshold || 0.5;
  const query = input.query.toLowerCase();
  
  // 模拟搜索延迟
  await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
  
  // 提取查询关键词
  const queryKeywords = extractKeywords(query);
  
  // 生成模拟的文档数据库
  const mockDocuments = generateMockDocuments(50);
  
  // 计算每个文档的语义相似度
  const scoredResults: SemanticSearchResult[] = [];
  
  for (const doc of mockDocuments) {
    const semanticScore = calculateSemanticSimilarity(queryKeywords, doc.keywords);
    
    if (semanticScore >= semanticThreshold) {
      scoredResults.push({
        ...doc,
        semanticScore,
      });
    }
  }
  
  // 按语义分数降序排序
  scoredResults.sort((a, b) => b.semanticScore - a.semanticScore);
  
  // 返回前N个结果
  return scoredResults.slice(0, maxResults);
}

/**
 * 提取关键词（简化实现）
 */
function extractKeywords(text: string): string[] {
  // 简单的关键词提取，实际应用中应使用更复杂的NLP技术
  const stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
  ]);
  
  return text
    .split(/[\s,，。！？；：""''（）【】]/)
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 1 && !stopWords.has(word))
    .slice(0, 10); // 最多提取10个关键词
}

/**
 * 计算语义相似度（基于关键词重叠）
 */
function calculateSemanticSimilarity(queryKeywords: string[], documentKeywords: string[]): number {
  if (queryKeywords.length === 0 || documentKeywords.length === 0) {
    return 0;
  }
  
  // 计算关键词重叠度
  const querySet = new Set(queryKeywords);
  const docSet = new Set(documentKeywords);
  
  const intersection = new Set([...querySet].filter(x => docSet.has(x)));
  const union = new Set([...querySet, ...docSet]);
  
  // Jaccard相似度
  const jaccardSimilarity = intersection.size / union.size;
  
  // 添加一些随机性以模拟更复杂的语义理解
  const randomFactor = Math.random() * 0.2 + 0.8; // 0.8-1.0
  
  return Math.min(jaccardSimilarity * randomFactor, 1);
}

/**
 * 生成模拟文档数据库
 */
function generateMockDocuments(count: number): Omit<SemanticSearchResult, 'semanticScore'>[] {
  const documents: Omit<SemanticSearchResult, 'semanticScore'>[] = [];
  
  const contentTemplates = [
    {
      content: '人工智能技术在医疗诊断中的应用越来越广泛',
      keywords: ['人工智能', '医疗', '诊断', '技术', '应用'],
    },
    {
      content: '机器学习算法在数据分析中发挥着重要作用',
      keywords: ['机器学习', '算法', '数据', '分析', '作用'],
    },
    {
      content: '深度学习神经网络模型训练需要大量计算资源',
      keywords: ['深度学习', '神经网络', '模型', '训练', '计算'],
    },
    {
      content: '自然语言处理技术在文本分析中应用广泛',
      keywords: ['自然语言', '处理', '文本', '分析', '技术'],
    },
    {
      content: '计算机视觉技术在图像识别领域取得重大突破',
      keywords: ['计算机视觉', '图像', '识别', '技术', '突破'],
    },
    {
      content: '区块链技术在金融领域的应用前景广阔',
      keywords: ['区块链', '金融', '应用', '技术', '前景'],
    },
    {
      content: '云计算服务为企业数字化转型提供支撑',
      keywords: ['云计算', '服务', '企业', '数字化', '转型'],
    },
    {
      content: '物联网设备连接数量呈指数级增长',
      keywords: ['物联网', '设备', '连接', '数量', '增长'],
    },
    {
      content: '大数据分析帮助企业做出更明智的决策',
      keywords: ['大数据', '分析', '企业', '决策', '帮助'],
    },
    {
      content: '网络安全防护措施需要不断更新升级',
      keywords: ['网络安全', '防护', '措施', '更新', '升级'],
    },
  ];
  
  const additionalKeywords = [
    '创新', '发展', '趋势', '未来', '挑战', '机遇', '解决方案', '优化', '效率', '质量',
    '用户', '体验', '产品', '服务', '市场', '需求', '竞争', '合作', '生态', '平台'
  ];
  
  for (let i = 0; i < count; i++) {
    const template = contentTemplates[i % contentTemplates.length];
    const additionalKeywordCount = Math.floor(Math.random() * 3) + 1;
    const randomKeywords = additionalKeywords
      .sort(() => Math.random() - 0.5)
      .slice(0, additionalKeywordCount);
    
    documents.push({
      id: `semantic_doc_${i + 1}`,
      content: `${template.content} - 文档 ${i + 1}`,
      keywords: [...template.keywords, ...randomKeywords],
      metadata: {
        category: `category_${(i % 8) + 1}`,
        tags: [`tag_${i % 4 + 1}`, `tag_${(i + 1) % 4 + 1}`],
        createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        wordCount: template.content.length + Math.floor(Math.random() * 200),
      },
    });
  }
  
  return documents;
}
