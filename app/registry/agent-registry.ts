/**
 * AgentRegistry 内存实现（Week 3）
 * 严格遵循 @agent-core/interfaces/registry.interface.ts
 */

import {
  AgentDefinition,
  IAgentRegistry,
  ERROR_CODES,
  getErrorMessage,
} from '../packages/@agent-core';

export class AgentRegistry implements IAgentRegistry {
  private readonly nameToAgent: Map<string, AgentDefinition> = new Map();

  async registerAgent(agent: AgentDefinition): Promise<void> {
    if (!agent?.name) {
      throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
    }
    if (this.nameToAgent.has(agent.name)) {
      throw new Error(getErrorMessage(ERROR_CODES.RESOURCE_ALREADY_EXISTS));
    }
    this.nameToAgent.set(agent.name, agent);
  }

  async unregisterAgent(agentName: string): Promise<void> {
    if (!this.nameToAgent.has(agentName)) {
      throw new Error(getErrorMessage(ERROR_CODES.AGENT_NOT_FOUND));
    }
    this.nameToAgent.delete(agentName);
  }

  getAgent(agentName: string): AgentDefinition | undefined {
    return this.nameToAgent.get(agentName);
  }

  getAllAgents(): AgentDefinition[] {
    return Array.from(this.nameToAgent.values());
  }

  getAgentsByType(type: string): AgentDefinition[] {
    return Array.from(this.nameToAgent.values()).filter(
      (a) => a.type === (type as any)
    );
  }

  getAgentsByCapability(capability: string): AgentDefinition[] {
    return Array.from(this.nameToAgent.values()).filter(
      (a) =>
        Array.isArray(a.capabilities) && a.capabilities.includes(capability)
    );
  }

  isRegistered(agentName: string): boolean {
    return this.nameToAgent.has(agentName);
  }

  getAvailableAgents(): AgentDefinition[] {
    // 最小实现：全部作为可用，后续可接入健康/状态
    return this.getAllAgents();
  }
}

export default AgentRegistry;
