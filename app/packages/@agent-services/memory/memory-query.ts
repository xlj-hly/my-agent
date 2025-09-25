/**
 * 记忆查询服务实现
 * 提供高级记忆查询和检索功能
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';
import { MemoryMessage, MessageFilter } from './memory-store';

// 查询输入接口
export interface MemoryQueryInput {
  operation: string; // 'search', 'find-similar', 'get-context', 'get-history', 'get-summary'
  query?: string;
  agentId?: string;
  sessionId?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  limit?: number;
  similarityThreshold?: number;
  contextWindow?: number;
}

// 查询输出接口
export interface MemoryQueryOutput {
  messages?: MemoryMessage[];
  context?: string;
  summary?: string;
  similarMessages?: MemoryMessage[];
  history?: MemoryMessage[];
  relevance?: number;
  count?: number;
}

/**
 * 记忆查询函数
 * 提供高级查询功能，包括语义搜索、相似性查找、上下文获取等
 */
export const memoryQueryFunction: FunctionCall<MemoryQueryInput, MemoryQueryOutput> = {
  name: 'memory-query',
  version: '1.0.0',
  description: '记忆查询服务，提供高级记忆查询和检索功能',
  category: 'memory',
  tags: ['memory', 'query', 'search', 'context'],
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['search', 'find-similar', 'get-context', 'get-history', 'get-summary'],
        description: '要执行的查询操作'
      },
      query: {
        type: 'string',
        nullable: true,
        description: '查询文本（用于search和find-similar操作）'
      },
      agentId: {
        type: 'string',
        nullable: true,
        description: 'Agent ID过滤'
      },
      sessionId: {
        type: 'string',
        nullable: true,
        description: '会话ID过滤'
      },
      timeRange: {
        type: 'object',
        properties: {
          start: { type: 'number' },
          end: { type: 'number' }
        },
        nullable: true,
        description: '时间范围过滤'
      },
      limit: {
        type: 'number',
        default: 10,
        description: '结果数量限制'
      },
      similarityThreshold: {
        type: 'number',
        default: 0.7,
        description: '相似性阈值（0-1）'
      },
      contextWindow: {
        type: 'number',
        default: 5,
        description: '上下文窗口大小'
      }
    },
    required: ['operation'],
    oneOf: [
      { properties: { operation: { const: 'search' }, query: { type: 'string' } }, required: ['query'] },
      { properties: { operation: { const: 'find-similar' }, query: { type: 'string' } }, required: ['query'] }
    ]
  },
  outputSchema: {
    type: 'object',
    properties: {
      messages: {
        type: 'array',
        items: { type: 'object' },
        nullable: true
      },
      context: {
        type: 'string',
        nullable: true
      },
      summary: {
        type: 'string',
        nullable: true
      },
      similarMessages: {
        type: 'array',
        items: { type: 'object' },
        nullable: true
      },
      history: {
        type: 'array',
        items: { type: 'object' },
        nullable: true
      },
      relevance: {
        type: 'number',
        nullable: true
      },
      count: {
        type: 'number',
        nullable: true
      }
    }
  },
  validate: (input: MemoryQueryInput): ValidationResult => {
    if ((input.operation === 'search' || input.operation === 'find-similar') && !input.query) {
      return { valid: false, errors: ['Query is required for search and find-similar operations.'] };
    }
    if (input.similarityThreshold && (input.similarityThreshold < 0 || input.similarityThreshold > 1)) {
      return { valid: false, errors: ['Similarity threshold must be between 0 and 1.'] };
    }
    return { valid: true };
  },
  execute: async (
    input: MemoryQueryInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<MemoryQueryOutput>> => {
    const startTime = Date.now();

    try {
      const result = await performMemoryQuery(input);
      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          query: input.query,
          executionTime: Date.now() - startTime
        },
        executionTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
};

/**
 * 执行记忆查询操作
 */
async function performMemoryQuery(input: MemoryQueryInput): Promise<MemoryQueryOutput> {
  switch (input.operation) {
    case 'search':
      if (!input.query) throw new Error('Query is required for search operation');
      return await searchMessages(input);

    case 'find-similar':
      if (!input.query) throw new Error('Query is required for find-similar operation');
      return await findSimilarMessages(input);

    case 'get-context':
      return await getContextualMessages(input);

    case 'get-history':
      return await getHistoricalMessages(input);

    case 'get-summary':
      return await getConversationSummary(input);

    default:
      throw new Error(`Unsupported query operation: ${input.operation}`);
  }
}

/**
 * 搜索消息
 */
async function searchMessages(input: MemoryQueryInput): Promise<MemoryQueryOutput> {
  // 模拟搜索实现 - 实际应用中可以使用更复杂的搜索算法
  const filter: MessageFilter = {
    agentId: input.agentId,
    sessionId: input.sessionId,
    limit: input.limit || 10
  };

  if (input.timeRange) {
    filter.startTime = input.timeRange.start;
    filter.endTime = input.timeRange.end;
  }

  // 这里应该调用实际的存储服务来获取消息
  // 为了演示，我们返回模拟数据
  const messages = await mockGetMessages(filter);
  
  // 简单的文本匹配搜索
  const query = input.query!.toLowerCase();
  const matchingMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(query)
  );

  return {
    messages: matchingMessages,
    count: matchingMessages.length
  };
}

/**
 * 查找相似消息
 */
async function findSimilarMessages(input: MemoryQueryInput): Promise<MemoryQueryOutput> {
  const filter: MessageFilter = {
    agentId: input.agentId,
    sessionId: input.sessionId,
    limit: input.limit || 10
  };

  const messages = await mockGetMessages(filter);
  
  // 简单的相似性计算（基于词汇重叠）
  const query = input.query!.toLowerCase();
  const queryWords = new Set(query.split(/\s+/));
  
  const similarMessages = messages
    .map(msg => ({
      message: msg,
      similarity: calculateSimilarity(queryWords, new Set(msg.content.toLowerCase().split(/\s+/)))
    }))
    .filter(item => item.similarity >= (input.similarityThreshold || 0.7))
    .sort((a, b) => b.similarity - a.similarity)
    .map(item => item.message);

  return {
    similarMessages,
    count: similarMessages.length,
    relevance: similarMessages.length > 0 ? 0.8 : 0
  };
}

/**
 * 获取上下文消息
 */
async function getContextualMessages(input: MemoryQueryInput): Promise<MemoryQueryOutput> {
  const contextWindow = input.contextWindow || 5;
  const filter: MessageFilter = {
    agentId: input.agentId,
    sessionId: input.sessionId,
    limit: contextWindow
  };

  const messages = await mockGetMessages(filter);
  
  // 构建上下文字符串
  const context = messages
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(msg => `[${new Date(msg.timestamp).toLocaleString()}] ${msg.content}`)
    .join('\n');

  return {
    context,
    messages,
    count: messages.length
  };
}

/**
 * 获取历史消息
 */
async function getHistoricalMessages(input: MemoryQueryInput): Promise<MemoryQueryOutput> {
  const filter: MessageFilter = {
    agentId: input.agentId,
    sessionId: input.sessionId,
    limit: input.limit || 20
  };

  if (input.timeRange) {
    filter.startTime = input.timeRange.start;
    filter.endTime = input.timeRange.end;
  }

  const messages = await mockGetMessages(filter);
  
  return {
    history: messages,
    count: messages.length
  };
}

/**
 * 获取对话摘要
 */
async function getConversationSummary(input: MemoryQueryInput): Promise<MemoryQueryOutput> {
  const filter: MessageFilter = {
    agentId: input.agentId,
    sessionId: input.sessionId,
    limit: 100 // 获取更多消息用于摘要
  };

  const messages = await mockGetMessages(filter);
  
  if (messages.length === 0) {
    return { summary: 'No messages found.' };
  }

  // 简单的摘要生成（提取关键词和主题）
  const allContent = messages.map(msg => msg.content).join(' ');
  const words = allContent.split(/\s+/).filter(word => word.length > 2);
  const wordCounts: { [key: string]: number } = {};
  
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const topWords = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  const summary = `对话摘要：涉及 ${messages.length} 条消息，主要话题包括：${topWords.join('、')}。`;
  
  return {
    summary,
    count: messages.length
  };
}

/**
 * 计算相似性（基于词汇重叠）
 */
function calculateSimilarity(words1: Set<string>, words2: Set<string>): number {
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

/**
 * 模拟获取消息（实际应用中应该调用真实的存储服务）
 */
async function mockGetMessages(filter: MessageFilter): Promise<MemoryMessage[]> {
  // 返回模拟数据
  const mockMessages: MemoryMessage[] = [
    {
      id: '1',
      content: 'Hello, how can I help you today?',
      timestamp: Date.now() - 3600000,
      agentId: filter.agentId,
      sessionId: filter.sessionId
    },
    {
      id: '2',
      content: 'I need help with my project.',
      timestamp: Date.now() - 1800000,
      agentId: filter.agentId,
      sessionId: filter.sessionId
    },
    {
      id: '3',
      content: 'What kind of project are you working on?',
      timestamp: Date.now() - 900000,
      agentId: filter.agentId,
      sessionId: filter.sessionId
    }
  ];

  return mockMessages.slice(0, filter.limit || 10);
}

