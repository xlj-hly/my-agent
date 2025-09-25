import { openaiChatFunction } from '../../../../packages/@agent-services/llm/openai-client';

describe('OpenAI Chat Function', () => {
  it('should generate response for hello prompt', async () => {
    const input = {
      prompt: '你好',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
    };

    const result = await openaiChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.generated_text).toContain('你好');
    expect(result.data!.model_used).toBe('gpt-3.5-turbo');
    expect(result.data!.usage_stats).toBeDefined();
    expect(result.data!.finish_reason).toBe('stop');
    expect(result.data!.timestamp).toBeDefined();
  });

  it('should generate response for code prompt', async () => {
    const input = {
      prompt: '请写一段代码',
      model: 'gpt-4',
      max_tokens: 500,
    };

    const result = await openaiChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.generated_text).toContain('代码');
    expect(result.data!.model_used).toBe('gpt-4');
    expect(result.data!.usage_stats.total_tokens).toBeGreaterThan(0);
  });

  it('should generate response for translation prompt', async () => {
    const input = {
      prompt: '请翻译这句话',
      temperature: 0.5,
    };

    const result = await openaiChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.generated_text).toContain('翻译');
    expect(result.data!.model_used).toBeDefined(); // 输出中包含模型信息
  });

  it('should handle empty prompt', async () => {
    const input = {
      prompt: '',
    };

    const result = await openaiChatFunction.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid temperature', async () => {
    const input = {
      prompt: 'test',
      temperature: 3.0, // 超出范围
    };

    const result = await openaiChatFunction.execute(input);

    expect(result.success).toBe(true); // 模拟实现中不进行严格验证
    expect(result.data).toBeDefined();
  });

  it('should handle invalid max_tokens', async () => {
    const input = {
      prompt: 'test',
      max_tokens: 5000, // 超出范围
    };

    const result = await openaiChatFunction.execute(input);

    expect(result.success).toBe(true); // 模拟实现中不进行严格验证
    expect(result.data).toBeDefined();
  });

  it('should validate input correctly', () => {
    const validInput = {
      prompt: 'Hello world',
      temperature: 0.7,
      max_tokens: 1000,
    };

    const validation = openaiChatFunction.validate!(validInput);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toBeUndefined();
  });

  it('should reject invalid input', () => {
    const invalidInput = {
      prompt: '',
      temperature: 3.0,
      max_tokens: 5000,
    };

    const validation = openaiChatFunction.validate!(invalidInput);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toBeDefined();
    expect(validation.errors!.length).toBeGreaterThan(0);
  });

  it('should include execution metadata', async () => {
    const input = {
      prompt: 'test prompt',
    };

    const result = await openaiChatFunction.execute(input);

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
      system_message: '你是一个友好的助手',
    };

    const result = await openaiChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle long prompt', async () => {
    const longPrompt = 'a'.repeat(5000);
    const input = {
      prompt: longPrompt,
    };

    const result = await openaiChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.usage_stats.prompt_tokens).toBeGreaterThan(1000);
  });

  it('should use default parameters', async () => {
    const input = {
      prompt: 'test',
    };

    const result = await openaiChatFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.model_used).toBe('gpt-3.5-turbo'); // 默认模型
  });
});
