import type { FunctionCall, FunctionResult, ExecutionContext } from '../../@agent-core';
import { ERROR_CODES, getErrorMessage } from '../../@agent-core/constants/errors';

// OpenAI输入接口
export interface OpenAIChatInput {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  system_message?: string;
}

// OpenAI输出接口
export interface OpenAIChatOutput {
  generated_text: string;
  model_used: string;
  usage_stats: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason: string;
  timestamp: number;
}

// 模拟OpenAI API调用
async function callOpenAI(input: OpenAIChatInput): Promise<OpenAIChatOutput> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 100));

  // 模拟响应生成
  const model = input.model || 'gpt-3.5-turbo';
  // 注意：temperature和maxTokens参数在模拟实现中暂未使用，但保留用于未来扩展
  // const _temperature = input.temperature || 0.7;
  // const _maxTokens = input.max_tokens || 1000;

  // 根据提示生成模拟响应
  let generatedText = '';
  if (input.prompt.includes('你好') || input.prompt.includes('hello')) {
    generatedText = '你好！我是OpenAI的GPT模型，很高兴为您服务。';
  } else if (input.prompt.includes('代码') || input.prompt.includes('code')) {
    generatedText = '这是一个示例代码片段：\n\n```javascript\nfunction hello() {\n  console.log("Hello, World!");\n}\n```';
  } else if (input.prompt.includes('翻译') || input.prompt.includes('translate')) {
    generatedText = '这是一个翻译示例：英文 "Hello" 翻译为中文是 "你好"。';
  } else {
    generatedText = `基于您的提示 "${input.prompt}"，我生成了这个响应。这是一个模拟的OpenAI GPT响应，用于演示目的。`;
  }

  // 模拟token使用统计
  const promptTokens = Math.ceil(input.prompt.length / 4);
  const completionTokens = Math.ceil(generatedText.length / 4);
  const totalTokens = promptTokens + completionTokens;

  return {
    generated_text: generatedText,
    model_used: model,
    usage_stats: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    },
    finish_reason: 'stop',
    timestamp: Date.now(),
  };
}

// OpenAI聊天函数
export const openaiChatFunction: FunctionCall<OpenAIChatInput, OpenAIChatOutput> = {
  name: 'openai-chat',
  version: '1.0.0',
  description: '调用OpenAI GPT模型进行文本生成和对话',
  category: 'llm',
  tags: ['openai', 'gpt', 'chat', 'text-generation'],
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: '用户输入的提示文本',
        minLength: 1,
        maxLength: 10000,
      },
      model: {
        type: 'string',
        description: '使用的GPT模型',
        default: 'gpt-3.5-turbo',
        enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      },
      temperature: {
        type: 'number',
        description: '生成文本的随机性，0-2之间',
        minimum: 0,
        maximum: 2,
        default: 0.7,
      },
      max_tokens: {
        type: 'number',
        description: '生成的最大token数',
        minimum: 1,
        maximum: 4000,
        default: 1000,
      },
      top_p: {
        type: 'number',
        description: '核采样参数，0-1之间',
        minimum: 0,
        maximum: 1,
        default: 1,
      },
      frequency_penalty: {
        type: 'number',
        description: '频率惩罚，-2到2之间',
        minimum: -2,
        maximum: 2,
        default: 0,
      },
      presence_penalty: {
        type: 'number',
        description: '存在惩罚，-2到2之间',
        minimum: -2,
        maximum: 2,
        default: 0,
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
          prompt_tokens: {
            type: 'number',
            description: '输入token数量',
          },
          completion_tokens: {
            type: 'number',
            description: '输出token数量',
          },
          total_tokens: {
            type: 'number',
            description: '总token数量',
          },
        },
        required: ['prompt_tokens', 'completion_tokens', 'total_tokens'],
      },
      finish_reason: {
        type: 'string',
        description: '完成原因',
        enum: ['stop', 'length', 'content_filter'],
      },
      timestamp: {
        type: 'number',
        description: '生成时间戳',
      },
    },
    required: ['generated_text', 'model_used', 'usage_stats', 'finish_reason', 'timestamp'],
  },
  async execute(input: OpenAIChatInput, _context?: ExecutionContext): Promise<FunctionResult<OpenAIChatOutput>> {
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

      // 调用OpenAI API
      const result = await callOpenAI(input);

      return {
        success: true,
        data: result,
        metadata: {
          model: result.model_used,
          tokens_used: result.usage_stats.total_tokens,
          finish_reason: result.finish_reason,
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
  validate(input: OpenAIChatInput) {
    const errors: string[] = [];

    if (!input.prompt || input.prompt.trim().length === 0) {
      errors.push('提示文本不能为空');
    }

    if (input.prompt && input.prompt.length > 10000) {
      errors.push('提示文本长度不能超过10000字符');
    }

    if (input.temperature !== undefined && (input.temperature < 0 || input.temperature > 2)) {
      errors.push('temperature参数必须在0-2之间');
    }

    if (input.max_tokens !== undefined && (input.max_tokens < 1 || input.max_tokens > 4000)) {
      errors.push('max_tokens参数必须在1-4000之间');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
