/**
 * @jest-environment node
 * 
 * Semantic Search 工具函数测试
 */

import { semanticSearchFunction, SemanticSearchResult } from '../../../../packages/@agent-tools/search/semantic-search';

describe('SemanticSearchFunction', () => {
  it('应该成功执行语义搜索', async () => {
    const input = {
      query: '人工智能的发展趋势',
      maxResults: 5,
      semanticThreshold: 0.6,
    };
    
    const result = await semanticSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data!.length).toBeLessThanOrEqual(5);
    
    // 检查搜索结果结构
    if (result.data!.length > 0) {
      const searchResult = result.data![0];
      expect(searchResult).toHaveProperty('id');
      expect(searchResult).toHaveProperty('content');
      expect(searchResult).toHaveProperty('semanticScore');
      expect(searchResult).toHaveProperty('keywords');
      expect(searchResult).toHaveProperty('metadata');
      expect(typeof searchResult.id).toBe('string');
      expect(typeof searchResult.content).toBe('string');
      expect(typeof searchResult.semanticScore).toBe('number');
      expect(Array.isArray(searchResult.keywords)).toBe(true);
      expect(searchResult.semanticScore).toBeGreaterThanOrEqual(0);
      expect(searchResult.semanticScore).toBeLessThanOrEqual(1);
    }
  });

  it('应该处理无效的查询文本', async () => {
    const input = {
      query: '', // 空查询
      maxResults: 5,
    };
    
    const result = await semanticSearchFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该验证输入schema', () => {
    const validInput = {
      query: '机器学习算法',
      maxResults: 10,
      semanticThreshold: 0.7,
      language: 'zh-CN',
    };
    
    const invalidInput = {
      query: 123, // 应该是字符串
      maxResults: -1, // 应该是正数
      semanticThreshold: 1.5, // 应该是0-1之间
    } as any;
    
    if (semanticSearchFunction.validate) {
      const validResult = semanticSearchFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = semanticSearchFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该根据语义阈值过滤结果', async () => {
    const input = {
      query: '深度学习神经网络',
      maxResults: 10,
      semanticThreshold: 0.8, // 高阈值
    };
    
    const result = await semanticSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // 所有结果的语义分数都应该大于等于阈值
    result.data!.forEach((item: SemanticSearchResult) => {
      expect(item.semanticScore).toBeGreaterThanOrEqual(0.8);
    });
  });

  it('应该提取关键词', async () => {
    const input = {
      query: '区块链技术应用',
      maxResults: 5,
    };
    
    const result = await semanticSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // 检查关键词提取
    result.data!.forEach((item: SemanticSearchResult) => {
      expect(Array.isArray(item.keywords)).toBe(true);
      expect(item.keywords.length).toBeGreaterThan(0);
      item.keywords.forEach((keyword: string) => {
        expect(typeof keyword).toBe('string');
        expect(keyword.length).toBeGreaterThan(0);
      });
    });
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      query: '云计算服务',
      maxResults: 5,
      semanticThreshold: 0.6,
      language: 'zh-CN',
    };
    
    const result = await semanticSearchFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.query).toBe('云计算服务');
    expect(result.metadata?.semanticThreshold).toBe(0.6);
    expect(result.metadata?.language).toBe('zh-CN');
    expect(result.metadata?.totalResults).toBeDefined();
    expect(result.metadata?.searchTime).toBeDefined();
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该支持多语言查询', async () => {
    const input = {
      query: 'machine learning algorithms',
      maxResults: 3,
      language: 'en-US',
    };
    
    const result = await semanticSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.metadata?.language).toBe('en-US');
  });

  it('应该处理长查询文本', async () => {
    const input = {
      query: '这是一个非常长的查询文本，用来测试系统对长文本的处理能力，包含多个关键词和概念',
      maxResults: 5,
    };
    
    const result = await semanticSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('应该返回按语义分数排序的结果', async () => {
    const input = {
      query: '人工智能',
      maxResults: 10,
    };
    
    const result = await semanticSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // 检查结果是否按语义分数降序排列
    for (let i = 1; i < result.data!.length; i++) {
      expect(result.data![i-1].semanticScore).toBeGreaterThanOrEqual(result.data![i].semanticScore);
    }
  });
});
