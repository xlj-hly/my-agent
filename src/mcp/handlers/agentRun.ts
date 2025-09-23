// MCP处理器 - 使用新架构适配器
import { getMCPAdapter, resetMCPAgent } from '../../adapters/MCPAdapter.js';

// 使用新架构的适配器
export async function getAgentRunner(): Promise<any> {
  return await getMCPAdapter();
}

export async function resetAgent(): Promise<void> {
  await resetMCPAgent();
}
