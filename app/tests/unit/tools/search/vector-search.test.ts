/**
 * @jest-environment node
 * 
 * Vector Search 工具函数测试
 */

import { vectorSearchFunction, VectorSearchResult } from '../../../../packages/@agent-tools/search/vector-search';

describe('VectorSearchFunction', () => {
  it('应该成功执行向量搜索', async () => {
    const input = {
      queryVector: [0.1, 0.2, 0.3, 0.4, 0.5],
      maxResults: 3,
      similarityThreshold: 0.7,
    };
    
    const result = await vectorSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data!.length).toBeLessThanOrEqual(3);
    
    // 检查搜索结果结构
    if (result.data!.length > 0) {
      const searchResult = result.data![0];
      expect(searchResult).toHaveProperty('id');
      expect(searchResult).toHaveProperty('content');
      expect(searchResult).toHaveProperty('similarityScore');
      expect(searchResult).toHaveProperty('metadata');
      expect(typeof searchResult.id).toBe('string');
      expect(typeof searchResult.content).toBe('string');
      expect(typeof searchResult.similarityScore).toBe('number');
      expect(searchResult.similarityScore).toBeGreaterThanOrEqual(0);
      expect(searchResult.similarityScore).toBeLessThanOrEqual(1);
    }
  });

  it('应该处理无效的查询向量', async () => {
    const input = {
      queryVector: [], // 空向量
      maxResults: 5,
    };
    
    const result = await vectorSearchFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该验证输入schema', () => {
    const validInput = {
      queryVector: [0.1, 0.2, 0.3],
      maxResults: 10,
      similarityThreshold: 0.8,
    };
    
    const invalidInput = {
      queryVector: 'invalid', // 应该是数组
      maxResults: -1, // 应该是正数
      similarityThreshold: 1.5, // 应该是0-1之间
    } as any;
    
    if (vectorSearchFunction.validate) {
      const validResult = vectorSearchFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = vectorSearchFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该正确计算相似度分数', async () => {
    const input = {
      queryVector: [1, 0, 0], // 单位向量
      maxResults: 5,
      similarityThreshold: 0.5,
    };
    
    const result = await vectorSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // 检查相似度分数是否在合理范围内
    result.data!.forEach((item: VectorSearchResult) => {
      expect(item.similarityScore).toBeGreaterThanOrEqual(0);
      expect(item.similarityScore).toBeLessThanOrEqual(1);
    });
  });

  it('应该根据相似度阈值过滤结果', async () => {
    const input = {
      queryVector: [0.1, 0.2, 0.3],
      maxResults: 10,
      similarityThreshold: 0.8, // 高阈值
    };
    
    const result = await vectorSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // 所有结果的相似度都应该大于等于阈值
    result.data!.forEach((item: VectorSearchResult) => {
      expect(item.similarityScore).toBeGreaterThanOrEqual(0.8);
    });
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      queryVector: [0.1, 0.2, 0.3, 0.4],
      maxResults: 5,
      similarityThreshold: 0.6,
    };
    
    const result = await vectorSearchFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.vectorDimension).toBe(4);
    expect(result.metadata?.similarityThreshold).toBe(0.6);
    expect(result.metadata?.totalResults).toBeDefined();
    expect(result.metadata?.searchTime).toBeDefined();
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该处理不同维度的向量', async () => {
    const input = {
      queryVector: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
      maxResults: 3,
      similarityThreshold: 0.5,
    };
    
    const result = await vectorSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.metadata?.vectorDimension).toBe(8);
  });
});
