import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';

// 导入模块化组件
import {
  AsciiArt,
  WelcomeTips,
  ChatMessage,
  WarningBox,
  InputArea,
  StatusBar,
} from './components/index.js';

// 导入Agent服务
import { CLIAdapter } from './adapters/CLIAdapter.js';

interface ChatItem {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}
interface AppProps {
  name?: string;
}

export const App: FC<AppProps> = ({ name = 'AI助手' }) => {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentService] = useState(() => CLIAdapter.getInstance());
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [, setInitError] = useState<string | null>(null);
  const { exit } = useApp();

  // 检查服务可用性
  useEffect(() => {
    const availability = CLIAdapter.checkAvailability();
    if (!availability.available) {
      setServiceAvailable(false);
      setInitError(availability.error || '服务不可用');
      setMessages([
        {
          id: 1,
          role: 'assistant',
          content: `抱歉，AI服务暂时不可用：${availability.error}\n\n请检查环境变量配置：\n- SILICONFLOW_API_KEY\n- SILICONFLOW_MODEL\n- SILICONFLOW_BASE_URL`,
        },
      ]);
    } else {
      setMessages([
        {
          id: 1,
          role: 'assistant',
          content: '你好！我是阿冬，你的AI助手。有什么可以帮助你的吗？',
        },
      ]);
    }
  }, []);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') exit();
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    // 如果服务不可用，不处理输入
    if (!serviceAvailable) {
      return;
    }

    const userMsg: ChatItem = { id: Date.now(), role: 'user', content: value };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 调用Agent服务
      const response = await agentService.chat(value);

      const aiMsg: ChatItem = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.content,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // 如果使用了工具，在控制台显示（可选：也可以在UI中显示）
      if (response.toolsUsed && response.toolsUsed.length > 0) {
        console.log('🔧 使用的工具:', response.toolsUsed.join(', '));
      }

      // 如果有错误，在控制台显示但不影响用户体验
      if (!response.success && response.error) {
        console.warn('Agent响应警告:', response.error);
      }
    } catch (error) {
      console.error('处理用户输入时出错:', error);
      const errorMsg: ChatItem = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '抱歉，我现在遇到了一些问题，请稍后再试。',
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
    setIsLoading(false);
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* ASCII 艺术标题 */}
      <AsciiArt name={name} />

      {/* 欢迎提示 */}
      <WelcomeTips name={name} />

      {/* 对话历史 */}
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {messages.map((msg) => (
          <Box key={msg.id} marginBottom={2}>
            <ChatMessage message={msg} />
          </Box>
        ))}

        {/* 思考状态 */}
        {isLoading && (
          <Box marginBottom={2}>
            <Text color="cyan">✦ 思考中...</Text>
          </Box>
        )}

        {/* 警告信息 */}
        <WarningBox name={name} show={messages.length > 1} />
      </Box>

      {/* 输入区域 */}
      <InputArea
        value={input}
        onChange={setInput}
        onSubmit={() => handleSubmit(input)}
      />

      {/* 状态栏 */}
      <StatusBar name={name} />
    </Box>
  );
};
