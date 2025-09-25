/**
 * Jest测试环境设置
 * 用于配置全局测试设置和模拟
 */

// 设置测试超时时间
jest.setTimeout(10000);

// 全局测试工具函数
(global as any).testUtils = {
  // 创建模拟函数
  createMockFunction: (name: string, result: any) => ({
    name,
    version: '1.0.0',
    description: `Mock function: ${name}`,
    category: 'test',
    tags: ['mock', 'test'],
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    async execute() {
      return { success: true, data: result };
    },
  }),

  // 创建模拟Agent
  createMockAgent: (name: string) => ({
    name,
    version: '1.0.0',
    description: `Mock agent: ${name}`,
    type: 'expert',
    capabilities: ['test'],
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    async process() {
      return { success: true, data: 'mock result' };
    },
  }),

  // 等待异步操作
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// 模拟控制台输出以避免测试时的噪音
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 清理模拟
afterEach(() => {
  jest.clearAllMocks();
});
