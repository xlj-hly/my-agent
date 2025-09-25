// LLM服务导出
export { openaiChatFunction, type OpenAIChatInput, type OpenAIChatOutput } from './openai-client';
export { anthropicChatFunction, type AnthropicChatInput, type AnthropicChatOutput } from './anthropic-client';

// LLM服务函数列表
export const llmFunctions = [
  openaiChatFunction,
  anthropicChatFunction,
];
