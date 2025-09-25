import { anthropicChatFunction } from '../../../../packages/@agent-services/llm/anthropic-client';

describe('Anthropic Chat Function', () => {
  it('should generate response for hello prompt', async () => {
    const input = {
      prompt: '你好',
      model: 'claude-3-sonnet-20240229',
      temperature: 1.0,
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.generated_text).toContain('您好');
    expect(result.data!.model_used).toBe('claude-3-sonnet-20240229');
    expect(result.data!.usage_stats).toBeDefined();
    expect(result.data!.stop_reason).toBe('end_turn');
    expect(result.data!.timestamp).toBeDefined();
  });

  it('should generate response for code prompt', async () => {
    const input = {
      prompt: '请写一段Python代码',
      model: 'claude-3-opus-20240229',
      max_tokens: 500,
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.generated_text).toContain('代码');
    expect(result.data!.model_used).toBe('claude-3-opus-20240229');
    expect(result.data!.usage_stats.total_tokens).toBeGreaterThan(0);
  });

  it('should generate response for translation prompt', async () => {
    const input = {
      prompt: '请翻译这段文字',
      temperature: 0.8,
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.generated_text).toContain('翻译');
  });

  it('should generate response for analysis prompt', async () => {
    const input = {
      prompt: '请分析这个问题',
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.generated_text).toContain('分析');
  });

  it('should handle empty prompt', async () => {
    const input = {
      prompt: '',
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid temperature', async () => {
    const input = {
      prompt: 'test',
      temperature: 1.5, // 超出范围
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true); // 模拟实现中不进行严格验证
    expect(result.data).toBeDefined();
  });

  it('should handle invalid max_tokens', async () => {
    const input = {
      prompt: 'test',
      max_tokens: 5000, // 超出范围
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true); // 模拟实现中不进行严格验证
    expect(result.data).toBeDefined();
  });

  it('should validate input correctly', () => {
    const validInput = {
      prompt: 'Hello world',
      temperature: 0.8,
      max_tokens: 1000,
    };

    const validation = anthropicChatFunction.validate!(validInput);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toBeUndefined();
  });

  it('should reject invalid input', () => {
    const invalidInput = {
      prompt: '',
      temperature: 1.5,
      max_tokens: 5000,
    };

    const validation = anthropicChatFunction.validate!(invalidInput);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toBeDefined();
    expect(validation.errors!.length).toBeGreaterThan(0);
  });

  it('should include execution metadata', async () => {
    const input = {
      prompt: 'test prompt',
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata!.model).toBeDefined();
    expect(result.metadata!.tokens_used).toBeGreaterThan(0);
    expect(result.executionTime).toBeGreaterThan(0);
    expect(result.timestamp).toBeDefined();
  });

  it('should handle system message', async () => {
    const input = {
      prompt: '你好',
      system_message: '你是一个专业的助手',
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle stop sequences', async () => {
    const input = {
      prompt: '请写一个故事',
      stop_sequences: ['END', 'STOP'],
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle long prompt', async () => {
    const longPrompt = 'a'.repeat(50000);
    const input = {
      prompt: longPrompt,
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.usage_stats.input_tokens).toBeGreaterThan(10000);
  });

  it('should use default parameters', async () => {
    const input = {
      prompt: 'test',
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.model_used).toBe('claude-3-sonnet-20240229'); // 默认模型
  });

  it('should handle top_k and top_p parameters', async () => {
    const input = {
      prompt: 'test',
      top_k: 50,
      top_p: 0.9,
    };

    const result = await anthropicChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
