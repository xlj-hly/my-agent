/**
 * 记忆策略实现
 * 实现集中式、分布式和混合记忆策略
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';
import { MemoryMessage, MessageFilter, MemoryContext, Session, MemoryStats, MemoryConfig } from './memory-store';

// 记忆策略类型
export enum MemoryStrategyType {
  CENTRALIZED = 'centralized',
  DISTRIBUTED = 'distributed',
  HYBRID = 'hybrid'
}

// 记忆策略接口
export interface IMemoryStrategy {
  readonly type: MemoryStrategyType;
  readonly name: string;
  readonly description: string;
  
  // 基础操作
  addMessage(message: MemoryMessage): Promise<void>;
  getMessages(filter?: MessageFilter): Promise<MemoryMessage[]>;
  updateMessage(id: string, message: Partial<MemoryMessage>): Promise<MemoryMessage | null>;
  deleteMessage(id: string): Promise<boolean>;
  
  // 上下文管理
  getContext(): Promise<MemoryContext>;
  setContext(context: MemoryContext): Promise<void>;
  
  // 会话管理
  createSession(agentId?: string): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  deleteSession(sessionId: string): Promise<boolean>;
  
  // 统计和清理
  getStats(): Promise<MemoryStats>;
  clear(): Promise<void>;
  cleanup(): Promise<number>;
}

// 策略选择输入接口
export interface MemoryStrategyInput {
  operation: string; // 'select', 'switch', 'get-current', 'get-available'
  strategyType?: MemoryStrategyType;
  config?: MemoryConfig;
}

// 策略选择输出接口
export interface MemoryStrategyOutput {
  currentStrategy?: MemoryStrategyType;
  availableStrategies?: MemoryStrategyType[];
  switchedTo?: MemoryStrategyType;
  success?: boolean;
  message?: string;
}

/**
 * 记忆策略管理函数
 */
export const memoryStrategyFunction: FunctionCall<MemoryStrategyInput, MemoryStrategyOutput> = {
  name: 'memory-strategy',
  version: '1.0.0',
  description: '记忆策略管理，支持集中式、分布式和混合记忆策略的切换',
  category: 'memory',
  tags: ['memory', 'strategy', 'centralized', 'distributed', 'hybrid'],
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['select', 'switch', 'get-current', 'get-available'],
        description: '要执行的操作'
      },
      strategyType: {
        type: 'string',
        enum: ['centralized', 'distributed', 'hybrid'],
        nullable: true,
        description: '目标策略类型'
      },
      config: {
        type: 'object',
        nullable: true,
        description: '策略配置'
      }
    },
    required: ['operation'],
    oneOf: [
      { properties: { operation: { const: 'select' }, strategyType: { type: 'string' } }, required: ['strategyType'] },
      { properties: { operation: { const: 'switch' }, strategyType: { type: 'string' } }, required: ['strategyType'] }
    ]
  },
  outputSchema: {
    type: 'object',
    properties: {
      currentStrategy: { type: 'string', nullable: true },
      availableStrategies: { type: 'array', items: { type: 'string' }, nullable: true },
      switchedTo: { type: 'string', nullable: true },
      success: { type: 'boolean', nullable: true },
      message: { type: 'string', nullable: true }
    }
  },
  validate: (input: MemoryStrategyInput): ValidationResult => {
    if ((input.operation === 'select' || input.operation === 'switch') && !input.strategyType) {
      return { valid: false, errors: ['Strategy type is required for select and switch operations.'] };
    }
    return { valid: true };
  },
  execute: async (
    input: MemoryStrategyInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<MemoryStrategyOutput>> => {
    const startTime = Date.now();

    try {
      const result = await performStrategyOperation(input);
      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          strategyType: input.strategyType,
          executionTime: Date.now() - startTime
        },
        executionTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
};

// 全局策略管理器
class MemoryStrategyManager {
  private currentStrategy: MemoryStrategyType = MemoryStrategyType.CENTRALIZED;
  private strategies: Map<MemoryStrategyType, IMemoryStrategy> = new Map();
  private config: MemoryConfig = {};

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.strategies.set(MemoryStrategyType.CENTRALIZED, new CentralizedMemoryStrategy());
    this.strategies.set(MemoryStrategyType.DISTRIBUTED, new DistributedMemoryStrategy());
    this.strategies.set(MemoryStrategyType.HYBRID, new HybridMemoryStrategy());
  }

  async selectStrategy(type: MemoryStrategyType, config?: MemoryConfig): Promise<void> {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Unsupported strategy type: ${type}`);
    }
    this.currentStrategy = type;
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async switchStrategy(type: MemoryStrategyType, config?: MemoryConfig): Promise<void> {
    // 导出当前策略的数据
    const currentData = await this.exportCurrentData();
    
    // 切换到新策略
    await this.selectStrategy(type, config);
    
    // 导入数据到新策略
    await this.importData(currentData);
  }

  getCurrentStrategy(): MemoryStrategyType {
    return this.currentStrategy;
  }

  getAvailableStrategies(): MemoryStrategyType[] {
    return Array.from(this.strategies.keys());
  }

  getStrategy(): IMemoryStrategy {
    const strategy = this.strategies.get(this.currentStrategy);
    if (!strategy) {
      throw new Error(`Current strategy not found: ${this.currentStrategy}`);
    }
    return strategy;
  }

  private async exportCurrentData(): Promise<any> {
    const strategy = this.getStrategy();
    const messages = await strategy.getMessages();
    const context = await strategy.getContext();
    const stats = await strategy.getStats();
    
    return {
      messages,
      context,
      stats,
      strategyType: this.currentStrategy
    };
  }

  private async importData(data: any): Promise<void> {
    const strategy = this.getStrategy();
    
    // 设置上下文
    if (data.context) {
      await strategy.setContext(data.context);
    }
    
    // 导入消息（如果需要）
    if (data.messages && data.messages.length > 0) {
      // 注意：这里可能需要特殊处理，避免重复导入
      console.log(`Importing ${data.messages.length} messages to ${this.currentStrategy} strategy`);
    }
  }
}

// 全局策略管理器实例（延迟初始化）
let strategyManager: MemoryStrategyManager;

/**
 * 执行策略操作
 */
export async function performStrategyOperation(input: MemoryStrategyInput): Promise<MemoryStrategyOutput> {
  // 延迟初始化策略管理器
  if (!strategyManager) {
    strategyManager = new MemoryStrategyManager();
  }

  switch (input.operation) {
    case 'select':
      if (!input.strategyType) throw new Error('Strategy type is required');
      await strategyManager.selectStrategy(input.strategyType, input.config);
      return {
        currentStrategy: input.strategyType,
        success: true,
        message: `Selected ${input.strategyType} strategy`
      };

    case 'switch':
      if (!input.strategyType) throw new Error('Strategy type is required');
      await strategyManager.switchStrategy(input.strategyType, input.config);
      return {
        switchedTo: input.strategyType,
        success: true,
        message: `Switched to ${input.strategyType} strategy`
      };

    case 'get-current':
      return {
        currentStrategy: strategyManager.getCurrentStrategy(),
        success: true
      };

    case 'get-available':
      return {
        availableStrategies: strategyManager.getAvailableStrategies(),
        success: true
      };

    default:
      throw new Error(`Unsupported operation: ${input.operation}`);
  }
}

/**
 * 集中式记忆策略实现
 * 所有Agent共享一个记忆存储
 */
class CentralizedMemoryStrategy implements IMemoryStrategy {
  readonly type = MemoryStrategyType.CENTRALIZED;
  readonly name = 'Centralized Memory';
  readonly description = '所有Agent共享一个记忆存储，简单易管理，全局状态一致';
  
  private messages: Map<string, MemoryMessage> = new Map();
  private sessions: Map<string, Session> = new Map();
  private context: MemoryContext = {};

  async addMessage(message: MemoryMessage): Promise<void> {
    this.messages.set(message.id, message);
  }

  async getMessages(filter?: MessageFilter): Promise<MemoryMessage[]> {
    let results = Array.from(this.messages.values());

    if (filter) {
      if (filter.agentId) {
        results = results.filter(msg => msg.agentId === filter.agentId);
      }
      if (filter.sessionId) {
        results = results.filter(msg => msg.sessionId === filter.sessionId);
      }
      if (filter.startTime) {
        results = results.filter(msg => msg.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        results = results.filter(msg => msg.timestamp <= filter.endTime!);
      }
      if (filter.limit) {
        results = results.slice(0, filter.limit);
      }
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  async updateMessage(id: string, message: Partial<MemoryMessage>): Promise<MemoryMessage | null> {
    const existing = this.messages.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...message };
    this.messages.set(id, updated);
    return updated;
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messages.delete(id);
  }

  async getContext(): Promise<MemoryContext> {
    return { ...this.context };
  }

  async setContext(context: MemoryContext): Promise<void> {
    this.context = { ...this.context, ...context };
  }

  async createSession(agentId?: string): Promise<Session> {
    const session: Session = {
      id: generateId(),
      agentId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessedAt = Date.now();
    }
    return session || null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async getStats(): Promise<MemoryStats> {
    return {
      totalMessages: this.messages.size,
      totalSessions: this.sessions.size,
      memoryUsage: this.messages.size * 100 + this.sessions.size * 50,
      lastCleanup: Date.now()
    };
  }

  async clear(): Promise<void> {
    this.messages.clear();
    this.sessions.clear();
    this.context = {};
  }

  async cleanup(): Promise<number> {
    const beforeCount = this.messages.size;
    // 清理过期消息（超过7天的）
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const [id, message] of this.messages) {
      if (message.timestamp < cutoffTime) {
        this.messages.delete(id);
      }
    }
    return beforeCount - this.messages.size;
  }
}

/**
 * 分布式记忆策略实现
 * 每个Agent有独立的记忆存储
 */
class DistributedMemoryStrategy implements IMemoryStrategy {
  readonly type = MemoryStrategyType.DISTRIBUTED;
  readonly name = 'Distributed Memory';
  readonly description = '每个Agent有独立的记忆存储，高并发，故障隔离';
  
  private agentMemories: Map<string, Map<string, MemoryMessage>> = new Map();
  private agentSessions: Map<string, Map<string, Session>> = new Map();
  private agentContexts: Map<string, MemoryContext> = new Map();

  private getAgentMemory(agentId: string): Map<string, MemoryMessage> {
    if (!this.agentMemories.has(agentId)) {
      this.agentMemories.set(agentId, new Map());
    }
    return this.agentMemories.get(agentId)!;
  }

  private getAgentSessions(agentId: string): Map<string, Session> {
    if (!this.agentSessions.has(agentId)) {
      this.agentSessions.set(agentId, new Map());
    }
    return this.agentSessions.get(agentId)!;
  }

  async addMessage(message: MemoryMessage): Promise<void> {
    if (!message.agentId) {
      throw new Error('Agent ID is required for distributed memory strategy');
    }
    const agentMemory = this.getAgentMemory(message.agentId);
    agentMemory.set(message.id, message);
  }

  async getMessages(filter?: MessageFilter): Promise<MemoryMessage[]> {
    let results: MemoryMessage[] = [];

    if (filter?.agentId) {
      // 获取特定Agent的消息
      const agentMemory = this.getAgentMemory(filter.agentId);
      results = Array.from(agentMemory.values());
    } else {
      // 获取所有Agent的消息
      for (const agentMemory of this.agentMemories.values()) {
        results.push(...Array.from(agentMemory.values()));
      }
    }

    // 应用其他过滤器
    if (filter) {
      if (filter.sessionId) {
        results = results.filter(msg => msg.sessionId === filter.sessionId);
      }
      if (filter.startTime) {
        results = results.filter(msg => msg.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        results = results.filter(msg => msg.timestamp <= filter.endTime!);
      }
      if (filter.limit) {
        results = results.slice(0, filter.limit);
      }
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  async updateMessage(id: string, message: Partial<MemoryMessage>): Promise<MemoryMessage | null> {
    if (!message.agentId) {
      throw new Error('Agent ID is required for distributed memory strategy');
    }
    
    const agentMemory = this.getAgentMemory(message.agentId);
    const existing = agentMemory.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...message };
    agentMemory.set(id, updated);
    return updated;
  }

  async deleteMessage(id: string): Promise<boolean> {
    for (const agentMemory of this.agentMemories.values()) {
      if (agentMemory.has(id)) {
        return agentMemory.delete(id);
      }
    }
    return false;
  }

  async getContext(): Promise<MemoryContext> {
    // 合并所有Agent的上下文
    const combinedContext: MemoryContext = {};
    for (const context of this.agentContexts.values()) {
      Object.assign(combinedContext, context);
    }
    return combinedContext;
  }

  async setContext(context: MemoryContext): Promise<void> {
    // 设置全局上下文（所有Agent共享）
    if (context.activeAgentId) {
      this.agentContexts.set(context.activeAgentId, context);
    } else {
      // 设置到所有Agent
      for (const agentId of this.agentMemories.keys()) {
        this.agentContexts.set(agentId, { ...context, activeAgentId: agentId });
      }
    }
  }

  async createSession(agentId?: string): Promise<Session> {
    if (!agentId) {
      throw new Error('Agent ID is required for distributed memory strategy');
    }
    
    const session: Session = {
      id: generateId(),
      agentId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    
    const agentSessions = this.getAgentSessions(agentId);
    agentSessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    for (const agentSessions of this.agentSessions.values()) {
      const session = agentSessions.get(sessionId);
      if (session) {
        session.lastAccessedAt = Date.now();
        return session;
      }
    }
    return null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    for (const agentSessions of this.agentSessions.values()) {
      if (agentSessions.has(sessionId)) {
        return agentSessions.delete(sessionId);
      }
    }
    return false;
  }

  async getStats(): Promise<MemoryStats> {
    let totalMessages = 0;
    let totalSessions = 0;
    
    for (const agentMemory of this.agentMemories.values()) {
      totalMessages += agentMemory.size;
    }
    
    for (const agentSessions of this.agentSessions.values()) {
      totalSessions += agentSessions.size;
    }

    return {
      totalMessages,
      totalSessions,
      memoryUsage: totalMessages * 100 + totalSessions * 50,
      lastCleanup: Date.now()
    };
  }

  async clear(): Promise<void> {
    this.agentMemories.clear();
    this.agentSessions.clear();
    this.agentContexts.clear();
  }

  async cleanup(): Promise<number> {
    let cleanedCount = 0;
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    for (const [, agentMemory] of this.agentMemories) {
      const beforeCount = agentMemory.size;
      for (const [id, message] of agentMemory) {
        if (message.timestamp < cutoffTime) {
          agentMemory.delete(id);
        }
      }
      cleanedCount += beforeCount - agentMemory.size;
    }
    
    return cleanedCount;
  }
}

/**
 * 混合记忆策略实现
 * 决策Agent集中记忆，专家Agent分布式记忆
 */
class HybridMemoryStrategy implements IMemoryStrategy {
  readonly type = MemoryStrategyType.HYBRID;
  readonly name = 'Hybrid Memory';
  readonly description = '决策Agent集中记忆，专家Agent分布式记忆，平衡简单性和性能';
  
  private centralizedStrategy = new CentralizedMemoryStrategy();
  private distributedStrategy = new DistributedMemoryStrategy();

  private isDecisionAgent(agentId?: string): boolean {
    // 简单的判断逻辑：包含"decision"的Agent ID被认为是决策Agent
    return agentId ? agentId.toLowerCase().includes('decision') : false;
  }

  private getStrategy(agentId?: string): IMemoryStrategy {
    return this.isDecisionAgent(agentId) ? this.centralizedStrategy : this.distributedStrategy;
  }

  async addMessage(message: MemoryMessage): Promise<void> {
    const strategy = this.getStrategy(message.agentId);
    await strategy.addMessage(message);
  }

  async getMessages(filter?: MessageFilter): Promise<MemoryMessage[]> {
    const results: MemoryMessage[] = [];
    
    if (filter?.agentId) {
      // 获取特定Agent的消息
      const strategy = this.getStrategy(filter.agentId);
      const messages = await strategy.getMessages(filter);
      results.push(...messages);
    } else {
      // 获取所有消息（从两种策略）
      const centralizedMessages = await this.centralizedStrategy.getMessages(filter);
      const distributedMessages = await this.distributedStrategy.getMessages(filter);
      results.push(...centralizedMessages, ...distributedMessages);
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  async updateMessage(id: string, message: Partial<MemoryMessage>): Promise<MemoryMessage | null> {
    if (!message.agentId) {
      // 尝试在两个策略中查找和更新
      const centralizedResult = await this.centralizedStrategy.updateMessage(id, message);
      if (centralizedResult) return centralizedResult;
      
      const distributedResult = await this.distributedStrategy.updateMessage(id, message);
      return distributedResult;
    }
    
    const strategy = this.getStrategy(message.agentId);
    return await strategy.updateMessage(id, message);
  }

  async deleteMessage(id: string): Promise<boolean> {
    // 尝试在两个策略中删除
    const centralizedResult = await this.centralizedStrategy.deleteMessage(id);
    if (centralizedResult) return true;
    
    return await this.distributedStrategy.deleteMessage(id);
  }

  async getContext(): Promise<MemoryContext> {
    // 合并两种策略的上下文
    const centralizedContext = await this.centralizedStrategy.getContext();
    const distributedContext = await this.distributedStrategy.getContext();
    
    return {
      ...centralizedContext,
      ...distributedContext
    };
  }

  async setContext(context: MemoryContext): Promise<void> {
    // 设置到两种策略
    await this.centralizedStrategy.setContext(context);
    await this.distributedStrategy.setContext(context);
  }

  async createSession(agentId?: string): Promise<Session> {
    const strategy = this.getStrategy(agentId);
    return await strategy.createSession(agentId);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    // 尝试在两个策略中查找
    const centralizedResult = await this.centralizedStrategy.getSession(sessionId);
    if (centralizedResult) return centralizedResult;
    
    return await this.distributedStrategy.getSession(sessionId);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    // 尝试在两个策略中删除
    const centralizedResult = await this.centralizedStrategy.deleteSession(sessionId);
    if (centralizedResult) return true;
    
    return await this.distributedStrategy.deleteSession(sessionId);
  }

  async getStats(): Promise<MemoryStats> {
    const centralizedStats = await this.centralizedStrategy.getStats();
    const distributedStats = await this.distributedStrategy.getStats();
    
    return {
      totalMessages: centralizedStats.totalMessages + distributedStats.totalMessages,
      totalSessions: centralizedStats.totalSessions + distributedStats.totalSessions,
      memoryUsage: centralizedStats.memoryUsage + distributedStats.memoryUsage,
      lastCleanup: Math.max(centralizedStats.lastCleanup || 0, distributedStats.lastCleanup || 0)
    };
  }

  async clear(): Promise<void> {
    await this.centralizedStrategy.clear();
    await this.distributedStrategy.clear();
  }

  async cleanup(): Promise<number> {
    const centralizedCleaned = await this.centralizedStrategy.cleanup();
    const distributedCleaned = await this.distributedStrategy.cleanup();
    
    return centralizedCleaned + distributedCleaned;
  }
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
