import type { FunctionCall, FunctionResult, ExecutionContext } from '../../@agent-core';
import { ERROR_CODES, getErrorMessage } from '../../@agent-core/constants/errors';

// Anthropic输入接口
export interface AnthropicChatInput {
  prompt: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  system_message?: string;
}

// Anthropic输出接口
export interface AnthropicChatOutput {
  generated_text: string;
  model_used: string;
  usage_stats: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  stop_reason: string;
  timestamp: number;
}

// 模拟Anthropic API调用
async function callAnthropic(input: AnthropicChatInput): Promise<AnthropicChatOutput> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 150));

  // 模拟响应生成
  const model = input.model || 'claude-3-sonnet-20240229';
  // 注意：maxTokens和temperature参数在模拟实现中暂未使用，但保留用于未来扩展
  // const _maxTokens = input.max_tokens || 1000;
  // const _temperature = input.temperature || 1.0;

  // 根据提示生成模拟响应
  let generatedText = '';
  if (input.prompt.includes('你好') || input.prompt.includes('hello')) {
    generatedText = '您好！我是Anthropic的Claude模型，很高兴与您对话。我致力于提供有帮助、无害且诚实的回答。';
  } else if (input.prompt.includes('代码') || input.prompt.includes('code')) {
    generatedText = '这是一个示例代码片段：\n\n```python\ndef hello_world():\n    print("Hello, World!")\n    return "greeting_complete"\n\nif __name__ == "__main__":\n    hello_world()\n```\n\n这段代码定义了一个简单的函数，用于输出问候语。';
  } else if (input.prompt.includes('翻译') || input.prompt.includes('translate')) {
    generatedText = '这是一个翻译示例：英文 "Good morning" 翻译为中文是 "早上好"。\n\n我还可以帮助您进行其他语言的翻译，请告诉我您需要翻译什么内容。';
  } else if (input.prompt.includes('分析') || input.prompt.includes('analyze')) {
    generatedText = '基于您提供的内容，我来为您分析一下：\n\n1. 这是一个模拟的Claude分析响应\n2. 我会从多个角度考虑问题\n3. 提供客观、平衡的观点\n\n请注意，这是演示用的模拟响应。';
  } else {
    generatedText = `基于您的提示 "${input.prompt}"，我生成了这个响应。这是一个模拟的Anthropic Claude响应，用于演示目的。我会尽力提供有用、准确且符合道德标准的信息。`;
  }

  // 模拟token使用统计
  const inputTokens = Math.ceil(input.prompt.length / 4);
  const outputTokens = Math.ceil(generatedText.length / 4);
  const totalTokens = inputTokens + outputTokens;

  return {
    generated_text: generatedText,
    model_used: model,
    usage_stats: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
    },
    stop_reason: 'end_turn',
    timestamp: Date.now(),
  };
}

// Anthropic聊天函数
export const anthropicChatFunction: FunctionCall<AnthropicChatInput, AnthropicChatOutput> = {
  name: 'anthropic-chat',
  version: '1.0.0',
  description: '调用Anthropic Claude模型进行文本生成和对话',
  category: 'llm',
  tags: ['anthropic', 'claude', 'chat', 'text-generation'],
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: '用户输入的提示文本',
        minLength: 1,
        maxLength: 100000,
      },
      model: {
        type: 'string',
        description: '使用的Claude模型',
        default: 'claude-3-sonnet-20240229',
        enum: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      },
      max_tokens: {
        type: 'number',
        description: '生成的最大token数',
        minimum: 1,
        maximum: 4096,
        default: 1000,
      },
      temperature: {
        type: 'number',
        description: '生成文本的随机性，0-1之间',
        minimum: 0,
        maximum: 1,
        default: 1,
      },
      top_p: {
        type: 'number',
        description: '核采样参数，0-1之间',
        minimum: 0,
        maximum: 1,
        default: 1,
      },
      top_k: {
        type: 'number',
        description: 'Top-K采样参数',
        minimum: 1,
        default: 40,
      },
      stop_sequences: {
        type: 'array',
        description: '停止序列列表',
        items: {
          type: 'string',
        },
        maxItems: 5,
      },
      system_message: {
        type: 'string',
        description: '系统消息，用于设定AI的角色和行为',
        maxLength: 2000,
      },
    },
    required: ['prompt'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      generated_text: {
        type: 'string',
        description: '生成的文本内容',
      },
      model_used: {
        type: 'string',
        description: '实际使用的模型名称',
      },
      usage_stats: {
        type: 'object',
        properties: {
          input_tokens: {
            type: 'number',
            description: '输入token数量',
          },
          output_tokens: {
            type: 'number',
            description: '输出token数量',
          },
          total_tokens: {
            type: 'number',
            description: '总token数量',
          },
        },
        required: ['input_tokens', 'output_tokens', 'total_tokens'],
      },
      stop_reason: {
        type: 'string',
        description: '停止原因',
        enum: ['end_turn', 'max_tokens', 'stop_sequence'],
      },
      timestamp: {
        type: 'number',
        description: '生成时间戳',
      },
    },
    required: ['generated_text', 'model_used', 'usage_stats', 'stop_reason', 'timestamp'],
  },
  async execute(input: AnthropicChatInput, _context?: ExecutionContext): Promise<FunctionResult<AnthropicChatOutput>> {
    const startTime = Date.now();

    try {
      // 输入验证
      if (!input.prompt || input.prompt.trim().length === 0) {
        return {
          success: false,
          error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
          executionTime: Date.now() - startTime,
        };
      }

      // 调用Anthropic API
      const result = await callAnthropic(input);

      return {
        success: true,
        data: result,
        metadata: {
          model: result.model_used,
          tokens_used: result.usage_stats.total_tokens,
          stop_reason: result.stop_reason,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : getErrorMessage(ERROR_CODES.UNKNOWN_ERROR),
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  },
  validate(input: AnthropicChatInput) {
    const errors: string[] = [];

    if (!input.prompt || input.prompt.trim().length === 0) {
      errors.push('提示文本不能为空');
    }

    if (input.prompt && input.prompt.length > 100000) {
      errors.push('提示文本长度不能超过100000字符');
    }

    if (input.temperature !== undefined && (input.temperature < 0 || input.temperature > 1)) {
      errors.push('temperature参数必须在0-1之间');
    }

    if (input.max_tokens !== undefined && (input.max_tokens < 1 || input.max_tokens > 4096)) {
      errors.push('max_tokens参数必须在1-4096之间');
    }

    if (input.stop_sequences && input.stop_sequences.length > 5) {
      errors.push('停止序列数量不能超过5个');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
