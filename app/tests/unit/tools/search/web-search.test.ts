/**
 * @jest-environment node
 * 
 * Web Search 工具函数测试
 */

import { webSearchFunction } from '../../../../packages/@agent-tools/search/web-search';

describe('WebSearchFunction', () => {
  it('应该成功执行网络搜索', async () => {
    const input = {
      query: 'AI发展',
      maxResults: 5,
    };
    
    const result = await webSearchFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data!.length).toBeLessThanOrEqual(5);
    
    // 检查搜索结果结构
    if (result.data!.length > 0) {
      const searchResult = result.data![0];
      expect(searchResult).toHaveProperty('title');
      expect(searchResult).toHaveProperty('url');
      expect(searchResult).toHaveProperty('snippet');
      expect(typeof searchResult.title).toBe('string');
      expect(typeof searchResult.url).toBe('string');
      expect(typeof searchResult.snippet).toBe('string');
    }
  });

  it('应该处理无效输入', async () => {
    const input = {
      query: '',
      maxResults: -1,
    };
    
    const result = await webSearchFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该验证输入schema', () => {
    const validInput = {
      query: 'test query',
      maxResults: 10,
    };
    
    const invalidInput = {
      query: 123, // 应该是字符串
      maxResults: 'invalid', // 应该是数字
    } as any;
    
    if (webSearchFunction.validate) {
      const validResult = webSearchFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = webSearchFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      query: 'TypeScript教程',
      maxResults: 3,
    };
    
    const result = await webSearchFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.query).toBe('TypeScript教程');
    expect(result.metadata?.resultCount).toBeDefined();
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该处理搜索超时', async () => {
    const input = {
      query: 'very long query that might cause timeout',
      maxResults: 1000, // 超过最大限制，应该触发验证错误
    };
    
    const result = await webSearchFunction.execute(input);
    
    // 应该返回结构化的错误结果
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(false);
    expect(result).toHaveProperty('error');
    expect(result.error).toBeDefined();
  });
});
