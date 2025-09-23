import { resetMCPAgent } from '../../adapters/MCPAdapter.js';

export async function handleAgentReset(): Promise<string> {
  try {
    await resetMCPAgent();
    return 'Agent会话已成功重置';
  } catch (error) {
    const errorMessage = `重置Agent失败: ${error instanceof Error ? error.message : '未知错误'}`;
    console.error(errorMessage);
    return errorMessage;
  }
}
