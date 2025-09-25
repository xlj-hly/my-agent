import type { FunctionCall, FunctionResult, ExecutionContext } from '../../@agent-core';
import { ERROR_CODES, getErrorMessage } from '../../@agent-core/constants/errors';

// 消息接口
export interface Message {
  id: string;
  content: string;
  sender: string;
  recipient: string;
  timestamp: number;
  type: string;
  metadata?: Record<string, any>;
}

// 消息总线输入接口
export interface MessageBusInput {
  operation: 'send' | 'receive' | 'queue' | 'dequeue' | 'status' | 'clear';
  message?: Partial<Message>; // 允许部分消息对象，用于发送和队列操作
  recipient?: string;
  sender?: string;
  message_id?: string;
  queue_name?: string;
}

// 消息总线输出接口
export interface MessageBusOutput {
  message?: Message;
  messages?: Message[];
  delivery_status?: string;
  message_id?: string;
  queue_size?: number;
  status?: {
    total_messages: number;
    pending_messages: number;
    delivered_messages: number;
    failed_messages: number;
  };
}

// 内存消息存储
class MessageStore {
  private messages: Map<string, Message> = new Map();
  private queues: Map<string, Message[]> = new Map();
  private deliveryStatus: Map<string, string> = new Map();
  private messageCounter = 0;

  generateId(): string {
    return `msg_${++this.messageCounter}_${Date.now()}`;
  }

  addMessage(message: Message): void {
    this.messages.set(message.id, message);
    this.deliveryStatus.set(message.id, 'pending');
  }

  getMessage(id: string): Message | undefined {
    return this.messages.get(id);
  }

  getMessagesByRecipient(recipient: string): Message[] {
    return Array.from(this.messages.values()).filter(msg => msg.recipient === recipient);
  }

  getMessagesBySender(sender: string): Message[] {
    return Array.from(this.messages.values()).filter(msg => msg.sender === sender);
  }

  updateDeliveryStatus(messageId: string, status: string): void {
    this.deliveryStatus.set(messageId, status);
  }

  getDeliveryStatus(messageId: string): string {
    return this.deliveryStatus.get(messageId) || 'unknown';
  }

  enqueue(queueName: string, message: Message): void {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    this.queues.get(queueName)!.push(message);
  }

  dequeue(queueName: string): Message | undefined {
    const queue = this.queues.get(queueName);
    if (!queue || queue.length === 0) {
      return undefined;
    }
    return queue.shift();
  }

  getQueueSize(queueName: string): number {
    const queue = this.queues.get(queueName);
    return queue ? queue.length : 0;
  }

  getAllMessages(): Message[] {
    return Array.from(this.messages.values());
  }

  clear(): void {
    this.messages.clear();
    this.queues.clear();
    this.deliveryStatus.clear();
  }

  getStats() {
    const totalMessages = this.messages.size;
    const pendingMessages = Array.from(this.deliveryStatus.values()).filter(status => status === 'pending').length;
    const deliveredMessages = Array.from(this.deliveryStatus.values()).filter(status => status === 'delivered').length;
    const failedMessages = Array.from(this.deliveryStatus.values()).filter(status => status === 'failed').length;

    return {
      total_messages: totalMessages,
      pending_messages: pendingMessages,
      delivered_messages: deliveredMessages,
      failed_messages: failedMessages,
    };
  }
}

// 全局消息存储实例
const messageStore = new MessageStore();

// 消息总线函数
export const messageBusFunction: FunctionCall<MessageBusInput, MessageBusOutput> = {
  name: 'message-bus',
  version: '1.0.0',
  description: 'Agent间消息传递和队列管理服务',
  category: 'communication',
  tags: ['message', 'bus', 'queue', 'agent-communication'],
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: '操作类型',
        enum: ['send', 'receive', 'queue', 'dequeue', 'status', 'clear'],
      },
      message: {
        type: 'object',
        description: '消息对象',
        properties: {
          id: { type: 'string' },
          content: { type: 'string' },
          sender: { type: 'string' },
          recipient: { type: 'string' },
          timestamp: { type: 'number' },
          type: { type: 'string' },
          metadata: { type: 'object' },
        },
        required: ['content', 'sender', 'recipient', 'type'],
      },
      recipient: {
        type: 'string',
        description: '接收者标识',
      },
      sender: {
        type: 'string',
        description: '发送者标识',
      },
      message_id: {
        type: 'string',
        description: '消息ID',
      },
      queue_name: {
        type: 'string',
        description: '队列名称',
      },
    },
    required: ['operation'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'object',
        description: '单个消息对象',
      },
      messages: {
        type: 'array',
        description: '消息列表',
        items: {
          type: 'object',
        },
      },
      delivery_status: {
        type: 'string',
        description: '投递状态',
        enum: ['pending', 'delivered', 'failed', 'unknown'],
      },
      message_id: {
        type: 'string',
        description: '消息ID',
      },
      queue_size: {
        type: 'number',
        description: '队列大小',
      },
      status: {
        type: 'object',
        description: '消息总线状态统计',
        properties: {
          total_messages: { type: 'number' },
          pending_messages: { type: 'number' },
          delivered_messages: { type: 'number' },
          failed_messages: { type: 'number' },
        },
      },
    },
  },
  async execute(input: MessageBusInput, _context?: ExecutionContext): Promise<FunctionResult<MessageBusOutput>> {
    const startTime = Date.now();

    try {
      switch (input.operation) {
        case 'send': {
          if (!input.message) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const message: Message = {
            id: input.message.id || messageStore.generateId(),
            content: input.message.content!,
            sender: input.message.sender!,
            recipient: input.message.recipient!,
            timestamp: input.message.timestamp || Date.now(),
            type: input.message.type!,
            metadata: input.message.metadata,
          };

          messageStore.addMessage(message);
          messageStore.updateDeliveryStatus(message.id, 'delivered');

          return {
            success: true,
            data: {
              message,
              delivery_status: 'delivered',
              message_id: message.id,
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'receive': {
          if (!input.recipient) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const messages = messageStore.getMessagesByRecipient(input.recipient);
          return {
            success: true,
            data: { messages },
            executionTime: Date.now() - startTime,
          };
        }

        case 'queue': {
          if (!input.message || !input.queue_name) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const message: Message = {
            id: input.message.id || messageStore.generateId(),
            content: input.message.content!,
            sender: input.message.sender!,
            recipient: input.message.recipient!,
            timestamp: input.message.timestamp || Date.now(),
            type: input.message.type!,
            metadata: input.message.metadata,
          };

          messageStore.enqueue(input.queue_name, message);
          messageStore.updateDeliveryStatus(message.id, 'pending');

          return {
            success: true,
            data: {
              message,
              message_id: message.id,
              queue_size: messageStore.getQueueSize(input.queue_name),
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'dequeue': {
          if (!input.queue_name) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const message = messageStore.dequeue(input.queue_name);
          if (message) {
            messageStore.updateDeliveryStatus(message.id, 'delivered');
          }

          return {
            success: true,
            data: {
              message,
              queue_size: messageStore.getQueueSize(input.queue_name),
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'status': {
          const status = messageStore.getStats();
          return {
            success: true,
            data: { status },
            executionTime: Date.now() - startTime,
          };
        }

        case 'clear': {
          messageStore.clear();
          return {
            success: true,
            data: { status: messageStore.getStats() },
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
  validate(input: MessageBusInput) {
    const errors: string[] = [];

    if (!input.operation) {
      errors.push('操作类型不能为空');
    }

    if (input.operation === 'send' || input.operation === 'queue') {
      if (!input.message) {
        errors.push('发送消息时消息对象不能为空');
      } else {
        if (!input.message.content) {
          errors.push('消息内容不能为空');
        }
        if (!input.message.sender) {
          errors.push('发送者不能为空');
        }
        if (!input.message.recipient) {
          errors.push('接收者不能为空');
        }
        if (!input.message.type) {
          errors.push('消息类型不能为空');
        }
      }
    }

    if (input.operation === 'receive' && !input.recipient) {
      errors.push('接收消息时接收者不能为空');
    }

    if ((input.operation === 'queue' || input.operation === 'dequeue') && !input.queue_name) {
      errors.push('队列操作时队列名称不能为空');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
