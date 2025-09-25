/**
 * @jest-environment node
 * 
 * Text Analyzer 工具函数测试
 */

import { textAnalyzerFunction } from '../../../../packages/@agent-tools/text/text-analyzer';

describe('TextAnalyzerFunction', () => {
  it('应该成功分析文本词频', async () => {
    const input = {
      text: '这是一个测试文本。这是一个很好的测试。',
      analysisType: 'word-frequency'
    };
    
    const result = await textAnalyzerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.wordFrequency).toBeDefined();
    expect(result.data?.wordFrequency!['这是']).toBe(2);
    expect(result.data?.wordFrequency!['一个']).toBe(2);
  });

  it('应该成功提取关键词', async () => {
    const input = {
      text: '人工智能是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。',
      analysisType: 'keywords'
    };
    
    const result = await textAnalyzerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.keywords).toBeDefined();
    expect(Array.isArray(result.data?.keywords)).toBe(true);
    expect(result.data?.keywords!.length).toBeGreaterThan(0);
  });

  it('应该成功分析文本情感', async () => {
    const input = {
      text: '今天天气真好，心情很愉快！',
      analysisType: 'sentiment'
    };
    
    const result = await textAnalyzerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.sentiment).toBeDefined();
    expect(result.data?.sentiment!.score).toBeDefined();
    expect(typeof result.data?.sentiment!.score).toBe('number');
  });

  it('应该成功统计文本基本信息', async () => {
    const input = {
      text: 'Hello World! 这是一个测试。',
      analysisType: 'statistics'
    };
    
    const result = await textAnalyzerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.statistics).toBeDefined();
    expect(result.data?.statistics!.charCount).toBeDefined();
    expect(result.data?.statistics!.wordCount).toBeDefined();
    expect(result.data?.statistics!.sentenceCount).toBeDefined();
  });

  it('应该处理无效输入', async () => {
    const input = {
      text: '',
      analysisType: 'word-frequency'
    };
    
    const result = await textAnalyzerFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该验证输入schema', () => {
    const validInput = {
      text: '测试文本',
      analysisType: 'word-frequency'
    };
    
    const invalidInput = {
      text: 123, // 应该是字符串
      analysisType: 'invalid' // 无效分析类型
    } as any;
    
    if (textAnalyzerFunction.validate) {
      const validResult = textAnalyzerFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = textAnalyzerFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      text: '这是一个测试文本',
      analysisType: 'word-frequency'
    };
    
    const result = await textAnalyzerFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.analysisType).toBe('word-frequency');
    expect(result.metadata?.textLength).toBe(8);
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该支持多种分析类型组合', async () => {
    const input = {
      text: '人工智能技术正在快速发展，为我们的生活带来便利。',
      analysisType: 'comprehensive'
    };
    
    const result = await textAnalyzerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.wordFrequency).toBeDefined();
    expect(result.data?.keywords).toBeDefined();
    expect(result.data?.sentiment).toBeDefined();
    expect(result.data?.statistics).toBeDefined();
  });

  it('应该处理长文本', async () => {
    const longText = '这是一个很长的测试文本。'.repeat(100);
    const input = {
      text: longText,
      analysisType: 'word-frequency'
    };
    
    const result = await textAnalyzerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.wordFrequency).toBeDefined();
  });
});
