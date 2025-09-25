import type { FunctionCall, FunctionResult, ExecutionContext } from '../../@agent-core';
import { ERROR_CODES, getErrorMessage } from '../../@agent-core/constants/errors';

// 事件接口
export interface Event {
  id: string;
  name: string;
  data: Record<string, any>;
  timestamp: number;
  source: string;
  type: string;
}

// 事件监听器接口
export interface EventListener {
  id: string;
  eventName: string;
  callback: string; // 存储回调函数标识
  once: boolean;
  timestamp: number;
}

// 事件发射器输入接口
export interface EventEmitterInput {
  operation: 'emit' | 'on' | 'once' | 'off' | 'listeners' | 'removeAllListeners' | 'eventNames' | 'stats';
  event_name?: string;
  data?: Record<string, any>;
  source?: string;
  type?: string;
  listener_id?: string;
  callback?: string;
}

// 事件发射器输出接口
export interface EventEmitterOutput {
  event?: Event;
  event_id?: string;
  listener?: EventListener;
  listener_id?: string;
  listeners?: EventListener[];
  event_names?: string[];
  stats?: {
    total_events: number;
    total_listeners: number;
    events_by_type: Record<string, number>;
    listeners_by_event: Record<string, number>;
  };
}

// 内存事件存储
class EventStore {
  private events: Map<string, Event> = new Map();
  private listeners: Map<string, EventListener> = new Map();
  private listenersByEvent: Map<string, Set<string>> = new Map();
  private eventCounter = 0;
  private listenerCounter = 0;

  generateEventId(): string {
    return `evt_${++this.eventCounter}_${Date.now()}`;
  }

  generateListenerId(): string {
    return `listener_${++this.listenerCounter}_${Date.now()}`;
  }

  addEvent(event: Event): void {
    this.events.set(event.id, event);
  }

  addListener(listener: EventListener): void {
    this.listeners.set(listener.id, listener);
    
    if (!this.listenersByEvent.has(listener.eventName)) {
      this.listenersByEvent.set(listener.eventName, new Set());
    }
    this.listenersByEvent.get(listener.eventName)!.add(listener.id);
  }

  removeListener(listenerId: string): EventListener | undefined {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      this.listeners.delete(listenerId);
      const eventListeners = this.listenersByEvent.get(listener.eventName);
      if (eventListeners) {
        eventListeners.delete(listenerId);
        if (eventListeners.size === 0) {
          this.listenersByEvent.delete(listener.eventName);
        }
      }
    }
    return listener;
  }

  getListenersForEvent(eventName: string): EventListener[] {
    const listenerIds = this.listenersByEvent.get(eventName);
    if (!listenerIds) {
      return [];
    }
    
    return Array.from(listenerIds)
      .map(id => this.listeners.get(id))
      .filter((listener): listener is EventListener => listener !== undefined);
  }

  getAllListeners(): EventListener[] {
    return Array.from(this.listeners.values());
  }

  getEventNames(): string[] {
    return Array.from(this.listenersByEvent.keys());
  }

  removeAllListeners(eventName?: string): number {
    if (eventName) {
      const listenerIds = this.listenersByEvent.get(eventName);
      if (listenerIds) {
        const count = listenerIds.size;
        listenerIds.forEach(id => this.listeners.delete(id));
        this.listenersByEvent.delete(eventName);
        return count;
      }
      return 0;
    } else {
      const count = this.listeners.size;
      this.listeners.clear();
      this.listenersByEvent.clear();
      return count;
    }
  }

  getStats() {
    const totalEvents = this.events.size;
    const totalListeners = this.listeners.size;
    
    const eventsByType: Record<string, number> = {};
    Array.from(this.events.values()).forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    const listenersByEvent: Record<string, number> = {};
    Array.from(this.listenersByEvent.entries()).forEach(([eventName, listenerIds]) => {
      listenersByEvent[eventName] = listenerIds.size;
    });

    return {
      total_events: totalEvents,
      total_listeners: totalListeners,
      events_by_type: eventsByType,
      listeners_by_event: listenersByEvent,
    };
  }

  clear(): void {
    this.events.clear();
    this.listeners.clear();
    this.listenersByEvent.clear();
    this.eventCounter = 0;
    this.listenerCounter = 0;
  }
}

// 全局事件存储实例
const eventStore = new EventStore();

// 事件发射器函数
export const eventEmitterFunction: FunctionCall<EventEmitterInput, EventEmitterOutput> = {
  name: 'event-emitter',
  version: '1.0.0',
  description: '系统事件发布和监听管理服务',
  category: 'communication',
  tags: ['event', 'emitter', 'listener', 'publish-subscribe'],
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: '操作类型',
        enum: ['emit', 'on', 'once', 'off', 'listeners', 'removeAllListeners', 'eventNames', 'stats'],
      },
      event_name: {
        type: 'string',
        description: '事件名称',
      },
      data: {
        type: 'object',
        description: '事件数据',
      },
      source: {
        type: 'string',
        description: '事件源',
      },
      type: {
        type: 'string',
        description: '事件类型',
      },
      listener_id: {
        type: 'string',
        description: '监听器ID',
      },
      callback: {
        type: 'string',
        description: '回调函数标识',
      },
    },
    required: ['operation'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      event: {
        type: 'object',
        description: '事件对象',
      },
      event_id: {
        type: 'string',
        description: '事件ID',
      },
      listener: {
        type: 'object',
        description: '监听器对象',
      },
      listener_id: {
        type: 'string',
        description: '监听器ID',
      },
      listeners: {
        type: 'array',
        description: '监听器列表',
        items: {
          type: 'object',
        },
      },
      event_names: {
        type: 'array',
        description: '事件名称列表',
        items: {
          type: 'string',
        },
      },
      stats: {
        type: 'object',
        description: '事件发射器统计信息',
        properties: {
          total_events: { type: 'number' },
          total_listeners: { type: 'number' },
          events_by_type: { type: 'object' },
          listeners_by_event: { type: 'object' },
        },
      },
    },
  },
  async execute(input: EventEmitterInput, _context?: ExecutionContext): Promise<FunctionResult<EventEmitterOutput>> {
    const startTime = Date.now();

    try {
      switch (input.operation) {
        case 'emit': {
          if (!input.event_name) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const event: Event = {
            id: eventStore.generateEventId(),
            name: input.event_name,
            data: input.data || {},
            timestamp: Date.now(),
            source: input.source || 'system',
            type: input.type || 'custom',
          };

          eventStore.addEvent(event);

          // 获取该事件的所有监听器
          const listeners = eventStore.getListenersForEvent(input.event_name);

          return {
            success: true,
            data: {
              event,
              event_id: event.id,
            },
            metadata: {
              listeners_notified: listeners.length,
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'on': {
          if (!input.event_name || !input.callback) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const listener: EventListener = {
            id: eventStore.generateListenerId(),
            eventName: input.event_name,
            callback: input.callback,
            once: false,
            timestamp: Date.now(),
          };

          eventStore.addListener(listener);

          return {
            success: true,
            data: {
              listener,
              listener_id: listener.id,
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'once': {
          if (!input.event_name || !input.callback) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const listener: EventListener = {
            id: eventStore.generateListenerId(),
            eventName: input.event_name,
            callback: input.callback,
            once: true,
            timestamp: Date.now(),
          };

          eventStore.addListener(listener);

          return {
            success: true,
            data: {
              listener,
              listener_id: listener.id,
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'off': {
          if (!input.listener_id) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const removedListener = eventStore.removeListener(input.listener_id);

          return {
            success: true,
            data: {
              listener: removedListener,
              listener_id: input.listener_id,
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'listeners': {
          if (!input.event_name) {
            return {
              success: false,
              error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
              executionTime: Date.now() - startTime,
            };
          }

          const listeners = eventStore.getListenersForEvent(input.event_name);

          return {
            success: true,
            data: { listeners },
            executionTime: Date.now() - startTime,
          };
        }

        case 'removeAllListeners': {
          const removedCount = eventStore.removeAllListeners(input.event_name);

          return {
            success: true,
            data: {
              stats: eventStore.getStats(),
            },
            metadata: {
              removed_listeners: removedCount,
            },
            executionTime: Date.now() - startTime,
          };
        }

        case 'eventNames': {
          const eventNames = eventStore.getEventNames();

          return {
            success: true,
            data: { event_names: eventNames },
            executionTime: Date.now() - startTime,
          };
        }

        case 'stats': {
          const stats = eventStore.getStats();

          return {
            success: true,
            data: { stats },
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
  validate(input: EventEmitterInput) {
    const errors: string[] = [];

    if (!input.operation) {
      errors.push('操作类型不能为空');
    }

    if (input.operation === 'emit' && !input.event_name) {
      errors.push('发射事件时事件名称不能为空');
    }

    if ((input.operation === 'on' || input.operation === 'once') && (!input.event_name || !input.callback)) {
      errors.push('添加监听器时事件名称和回调函数不能为空');
    }

    if (input.operation === 'off' && !input.listener_id) {
      errors.push('移除监听器时监听器ID不能为空');
    }

    if (input.operation === 'listeners' && !input.event_name) {
      errors.push('获取监听器时事件名称不能为空');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
