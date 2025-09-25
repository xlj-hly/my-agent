/**
 * AgentRegistry 实现测试（Week 3）
 */

import { AgentRegistry } from '../../../registry/agent-registry';
import {
  AgentDefinition,
  AgentType,
  ERROR_CODES,
  getErrorMessage,
} from '../../../packages/@agent-core';

describe('AgentRegistry 实现', () => {
  let registry: AgentRegistry;

  const agentA: AgentDefinition = {
    name: 'agent-a',
    version: '1.0.0',
    description: 'A',
    type: AgentType.EXPERT,
    capabilities: ['analyze', 'test'],
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    async process() {
      return { success: true };
    },
  };

  const agentB: AgentDefinition = {
    name: 'agent-b',
    version: '1.0.0',
    description: 'B',
    type: AgentType.TOOL,
    capabilities: ['tool'],
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    async process() {
      return { success: true };
    },
  };

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  it('应能注册与查询Agent', async () => {
    await registry.registerAgent(agentA);
    expect(registry.isRegistered('agent-a')).toBe(true);
    expect(registry.getAgent('agent-a')?.type).toBe(AgentType.EXPERT);
  });

  it('应能按 type 与 capability 筛选', async () => {
    await registry.registerAgent(agentA);
    await registry.registerAgent(agentB);
    expect(registry.getAgentsByType(AgentType.EXPERT).length).toBe(1);
    expect(registry.getAgentsByCapability('tool').length).toBe(1);
  });

  it('重复注册抛出 RESOURCE_ALREADY_EXISTS', async () => {
    await registry.registerAgent(agentA);
    await expect(registry.registerAgent(agentA)).rejects.toThrow(
      getErrorMessage(ERROR_CODES.RESOURCE_ALREADY_EXISTS)
    );
  });

  it('未注册卸载抛出 AGENT_NOT_FOUND', async () => {
    await expect(registry.unregisterAgent('none')).rejects.toThrow(
      getErrorMessage(ERROR_CODES.AGENT_NOT_FOUND)
    );
  });

  it('卸载后不可再获取', async () => {
    await registry.registerAgent(agentB);
    await registry.unregisterAgent('agent-b');
    expect(registry.getAgent('agent-b')).toBeUndefined();
  });
});
