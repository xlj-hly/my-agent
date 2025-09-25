/**
 * @jest-environment node
 * 
 * Text Summarizer 工具函数测试
 */

import { textSummarizerFunction } from '../../../../packages/@agent-tools/text/text-summarizer';

describe('TextSummarizerFunction', () => {
  it('应该成功生成文本摘要', async () => {
    const input = {
      text: '人工智能是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。人工智能包括机器学习、深度学习、自然语言处理等技术。这些技术正在改变我们的生活方式，从智能手机到自动驾驶汽车，从医疗诊断到金融服务，AI技术无处不在。',
      summaryLength: 'medium'
    };
    
    const result = await textSummarizerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.summary).toBeDefined();
    expect(typeof result.data?.summary).toBe('string');
    expect(result.data?.summary.length).toBeGreaterThan(0);
    expect(result.data?.summary.length).toBeLessThan(input.text.length);
  });

  it('应该支持不同长度的摘要', async () => {
    const longText = '这是一段很长的文本。'.repeat(50);
    
    // 短摘要
    let result = await textSummarizerFunction.execute({
      text: longText,
      summaryLength: 'short'
    });
    
    expect(result.success).toBe(true);
    expect(result.data?.summary).toBeDefined();
    
    // 长摘要
    result = await textSummarizerFunction.execute({
      text: longText,
      summaryLength: 'long'
    });
    
    expect(result.success).toBe(true);
    expect(result.data?.summary).toBeDefined();
  });

  it('应该支持自定义摘要长度', async () => {
    const input = {
      text: '这是一个测试文本，包含多个句子。第二句话在这里。第三句话也很重要。第四句话提供了更多信息。',
      summaryLength: 'custom',
      maxSentences: 2
    };
    
    const result = await textSummarizerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.summary).toBeDefined();
    expect(result.data?.originalLength).toBe(input.text.length);
    expect(result.data?.summaryLength).toBeDefined();
  });

  it('应该提取关键句', async () => {
    const input = {
      text: '人工智能技术正在快速发展。机器学习是AI的核心技术之一。深度学习在图像识别方面取得了突破。自然语言处理技术让计算机能够理解人类语言。这些技术的发展将改变未来。',
      summaryLength: 'medium',
      summaryType: 'extractive'
    };
    
    const result = await textSummarizerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.summary).toBeDefined();
    expect(result.data?.keySentences).toBeDefined();
    expect(Array.isArray(result.data?.keySentences)).toBe(true);
    expect(result.data?.keySentences!.length).toBeGreaterThan(0);
  });

  it('应该处理空文本', async () => {
    const input = {
      text: '',
      summaryLength: 'medium'
    };
    
    const result = await textSummarizerFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该处理过短的文本', async () => {
    const input = {
      text: '短文本',
      summaryLength: 'medium'
    };
    
    const result = await textSummarizerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.summary).toBeDefined();
    // 对于过短文本，摘要可能与原文相同或相近
  });

  it('应该验证输入schema', () => {
    const validInput = {
      text: '这是一个测试文本',
      summaryLength: 'medium'
    };
    
    const invalidInput = {
      text: 123, // 应该是字符串
      summaryLength: 'invalid' // 无效长度类型
    } as any;
    
    if (textSummarizerFunction.validate) {
      const validResult = textSummarizerFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = textSummarizerFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      text: '这是一个用于测试摘要功能的文本。它包含多个句子，用于验证摘要生成的准确性。',
      summaryLength: 'medium'
    };
    
    const result = await textSummarizerFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.summaryLength).toBe('medium');
    expect(result.metadata?.originalLength).toBe(input.text.length);
    expect(result.metadata?.compressionRatio).toBeDefined();
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该支持抽象摘要', async () => {
    const input = {
      text: '今天天气很好，阳光明媚。我去了公园散步，看到了很多美丽的花朵。公园里有很多人在锻炼身体，气氛很活跃。',
      summaryLength: 'medium',
      summaryType: 'abstractive'
    };
    
    const result = await textSummarizerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.summary).toBeDefined();
    expect(result.data?.summaryType).toBe('abstractive');
  });

  it('应该处理包含特殊字符的文本', async () => {
    const input = {
      text: '这是一个包含特殊字符的文本：@#$%^&*()。还有emoji表情：😊🎉🚀。以及各种标点符号！？。',
      summaryLength: 'medium'
    };
    
    const result = await textSummarizerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.summary).toBeDefined();
  });

  it('应该处理多段落文本', async () => {
    const input = {
      text: `第一段：人工智能技术正在快速发展。

第二段：机器学习是AI的核心技术之一。

第三段：深度学习在图像识别方面取得了突破。`,
      summaryLength: 'medium'
    };
    
    const result = await textSummarizerFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.summary).toBeDefined();
    expect(result.data?.paragraphCount).toBeDefined();
  });
});
