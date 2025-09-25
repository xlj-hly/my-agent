import type { FunctionCall, FunctionResult, ExecutionContext } from '../../@agent-core';
import { ERROR_CODES, getErrorMessage } from '../../@agent-core/constants/errors';

// 发布订阅消息接口
export interface PubSubMessage {
  id: string;
  topic: string;
  content: any;
  timestamp: number;
  publisher: string;
  metadata?: Record<string, any>;
}

// 订阅者接口
export interface Subscriber {
  id: string;
  topic: string;
  callback: string; // 存储回调函数标识
  timestamp: number;
  active: boolean;
}

// 发布订阅输入接口
export interface PubSubInput {
  operation: 'publish' | 'subscribe' | 'unsubscribe' | 'publishToTopic' | 'getSubscribers' | 'getTopics' | 'stats' | 'clear';
  topic?: string;
  content?: any;
  publisher?: string;
  subscriber_id?: string;
  callback?: string;
  metadata?: Record<string, any>;
}

// 发布订阅输出接口
export interface PubSubOutput {
  message?: PubSubMessage;
  message_id?: string;
  subscriber?: Subscriber;
  subscriber_id?: string;
  subscribers?: Subscriber[];
  topics?: string[];
  stats?: {
    total_topics: number;
    total_subscribers: number;
    total_messages: number;
    subscribers_by_topic: Record<string, number>;
    messages_by_topic: Record<string, number>;
  };
}

// 内存发布订阅存储
class PubSubStore {
  private messages: Map<string, PubSubMessage> = new Map();
  private subscribers: Map<string, Subscriber> = new Map();
  private subscribersByTopic: Map<string, Set<string>> = new Map();
  private messagesByTopic: Map<string, PubSubMessage[]> = new Map();
  private messageCounter = 0;
  private subscriberCounter = 0;

  generateMessageId(): string {
    return `msg_${++this.messageCounter}_${Date.now()}`;
  }

  generateSubscriberId(): string {
    return `sub_${++this.subscriberCounter}_${Date.now()}`;
  }

  publish(topic: string, content: any, publisher: string, metadata?: Record<string, any>): PubSubMessage {
    const message: PubSubMessage = {
      id: this.generateMessageId(),
      topic,
      content,
      timestamp: Date.now(),
      publisher,
      metadata,
    };

    this.messages.set(message.id, message);

    // 按主题存储消息
    if (!this.messagesByTopic.has(topic)) {
      this.messagesByTopic.set(topic, []);
    }
    this.messagesByTopic.get(topic)!.push(message);

    return message;
  }

  subscribe(topic: string, callback: string): Subscriber {
    const subscriber: Subscriber = {
      id: this.generateSubscriberId(),
      topic,
      callback,
      timestamp: Date.now(),
      active: true,
    };

    this.subscribers.set(subscriber.id, subscriber);

    // 按主题存储订阅者
    if (!this.subscribersByTopic.has(topic)) {
      this.subscribersByTopic.set(topic, new Set());
    }
    this.subscribersByTopic.get(topic)!.add(subscriber.id);

    return subscriber;
  }

  unsubscribe(subscriberId: string): Subscriber | undefined {
    const subscriber = this.subscribers.get(subscriberId);
    if (subscriber) {
      this.subscribers.delete(subscriberId);
      const topicSubscribers = this.subscribersByTopic.get(subscriber.topic);
      if (topicSubscribers) {
        topicSubscribers.delete(subscriberId);
        if (topicSubscribers.size === 0) {
          this.subscribersByTopic.delete(subscriber.topic);
        }
      }
    }
    return subscriber;
  }

  getSubscribersForTopic(topic: string): Subscriber[] {
    const subscriberIds = this.subscribersByTopic.get(topic);
    if (!subscriberIds) {
      return [];
    }

    return Array.from(subscriberIds)
      .map(id => this.subscribers.get(id))
      .filter((subscriber): subscriber is Subscriber => subscriber !== undefined && subscriber.active);
  }

  getTopics(): string[] {
    return Array.from(this.subscribersByTopic.keys());
  }

  getMessagesForTopic(topic: string, limit?: number): PubSubMessage[] {
    const messages = this.messagesByTopic.get(topic) || [];
    if (limit && limit > 0) {
      return messages.slice(-limit);
    }
    return messages;
  }

  getAllSubscribers(): Subscriber[] {
    return Array.from(this.subscribers.values()).filter(sub => sub.active);
  }

  getStats() {
    const totalTopics = this.subscribersByTopic.size;
    const totalSubscribers = this.subscribers.size;
    const totalMessages = this.messages.size;

    const subscribersByTopic: Record<string, number> = {};
    Array.from(this.subscribersByTopic.entries()).forEach(([topic, subscriberIds]) => {
      subscribersByTopic[topic] = subscriberIds.size;
    });

    const messagesByTopic: Record<string, number> = {};
    Array.from(this.messagesByTopic.entries()).forEach(([topic, messages]) => {
      messagesByTopic[topic] = messages.length;
    });

    return {
      total_topics: totalTopics,
      total_subscribers: totalSubscribers,
      total_messages: totalMessages,
      subscribers_by_topic: subscribersByTopic,
      messages_by_topic: messagesByTopic,
    };
  }

  clear(): void {
    this.messages.clear();
    this.subscribers.clear();
    this.subscribersByTopic.clear();
    this.messagesByTopic.clear();
    this.messageCounter = 0;
    this.subscriberCounter = 0;
  }
}

// 全局发布订阅存储实例
const pubSubStore = new PubSubStore();

// 发布订阅函数
export const pubSubFunction: FunctionCall<PubSubInput, PubSubOutput> = {
  name: 'pub-sub',
  version: '1.0.0',
  description: '发布订阅消息传递服务',
  category: 'communication',
  tags: ['pub-sub', 'publish', 'subscribe', 'topic', 'message'],
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: '操作类型',
        enum: ['publish', 'subscribe', 'unsubscribe', 'publishToTopic', 'getSubscribers', 'getTopics', 'stats', 'clear'],
      },
      topic: {
        type: 'string',
        description: '主题名称',
      },
      content: {
        description: '发布的内容',
      },
      publisher: {
        type: 'string',
        description: '发布者标识',
      },
      subscriber_id: {
        type: 'string',
        description: '订阅者ID',
      },
      callback: {
        type: 'string',
        description: '回调函数标识',
      },
      metadata: {
        type: 'object',
        description: '消息元数据',
      },
    },
    required: ['operation'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'object',
        description: '发布的消息对象',
      },
      message_id: {
        type: 'string',
        description: '消息ID',
      },
      subscriber: {
        type: 'object',
        description: '订阅者对象',
      },
      subscriber_id: {
        type: 'string',
        description: '订阅者ID',
      },
      subscribers: {
        type: 'array',
        description: '订阅者列表',
        items: {
          type: 'object',
        },
      },
      topics: {
        type: 'array',
        description: '主题列表',
        items: {
          type: 'string',
        },
      },
      stats: {
        type: 'object',
        description: '发布订阅统计信息',
        properties: {
          total_topics: { type: 'number' },
          total_subscribers: { type: 'number' },
          total_messages: { type: 'number' },
          subscribers_by_topic: { type: 'object' },
          messages_by_topic: { type: 'object' },
        },
      },
    },
  },
  async execute(input: PubSubInput, _context?: ExecutionContext): Promise<FunctionResult<PubSubOutput>> {
    const startTime = Date.now();

    try {
      switch (input.operation) {
        case 'publish':
        case 'publishToTopic': {
          if (!input.topic || !input.publisher) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const message = pubSubStore.publish(
            input.topic,
            input.content,
            input.publisher,
            input.metadata
          );

          // 获取该主题的所有订阅者
          const subscribers = pubSubStore.getSubscribersForTopic(input.topic);

          return {
            success: true,
            data: {
              message,
              message_id: message.id,
            },
            metadata: {
              subscribers_notified: subscribers.length,
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'subscribe': {
          if (!input.topic || !input.callback) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const subscriber = pubSubStore.subscribe(input.topic, input.callback);

          return {
            success: true,
            data: {
              subscriber,
              subscriber_id: subscriber.id,
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'unsubscribe': {
          if (!input.subscriber_id) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const removedSubscriber = pubSubStore.unsubscribe(input.subscriber_id);

          return {
            success: true,
            data: {
              subscriber: removedSubscriber,
              subscriber_id: input.subscriber_id,
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'getSubscribers': {
          if (!input.topic) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const subscribers = pubSubStore.getSubscribersForTopic(input.topic);

          return {
            success: true,
            data: { subscribers },
            executionTime: Date.now() - startTime,
          };
        }

        case 'getTopics': {
          const topics = pubSubStore.getTopics();

          return {
            success: true,
            data: { topics },
            executionTime: Date.now() - startTime,
          };
        }

        case 'stats': {
          const stats = pubSubStore.getStats();

          return {
            success: true,
            data: { stats },
            executionTime: Date.now() - startTime,
          };
        }

        case 'clear': {
          pubSubStore.clear();

          return {
            success: true,
            data: {
              stats: pubSubStore.getStats(),
            },
            executionTime: Date.now() - startTime,
          };
        }

        default:
          return {
            success: false,
            error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
            executionTime: Date.now() - startTime,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : getErrorMessage(ERROR_CODES.UNKNOWN_ERROR),
        executionTime: Date.now() - startTime,
      };
    }
  },
  validate(input: PubSubInput) {
    const errors: string[] = [];

    if (!input.operation) {
      errors.push('操作类型不能为空');
    }

    if ((input.operation === 'publish' || input.operation === 'publishToTopic') && (!input.topic || !input.publisher)) {
      errors.push('发布消息时主题和发布者不能为空');
    }

    if (input.operation === 'subscribe' && (!input.topic || !input.callback)) {
      errors.push('订阅时主题和回调函数不能为空');
    }

    if (input.operation === 'unsubscribe' && !input.subscriber_id) {
      errors.push('取消订阅时订阅者ID不能为空');
    }

    if (input.operation === 'getSubscribers' && !input.topic) {
      errors.push('获取订阅者时主题不能为空');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
