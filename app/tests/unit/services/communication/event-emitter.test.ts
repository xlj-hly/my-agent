import { eventEmitterFunction } from '../../../../packages/@agent-services/communication/event-emitter';

describe('Event Emitter Function', () => {
  beforeEach(async () => {
    // 清理事件发射器状态
    await eventEmitterFunction.execute({ operation: 'removeAllListeners' });
  });

  it('should emit an event successfully', async () => {
    const input = {
      operation: 'emit' as const,
      event_name: 'test-event',
      data: { message: 'Hello World' },
      source: 'agent1',
      type: 'custom',
    };

    const result = await eventEmitterFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.event).toBeDefined();
    expect(result.data!.event!.name).toBe('test-event');
    expect(result.data!.event!.data).toEqual({ message: 'Hello World' });
    expect(result.data!.event!.source).toBe('agent1');
    expect(result.data!.event!.type).toBe('custom');
    expect(result.data!.event_id).toBeDefined();
  });

  it('should add event listener', async () => {
    const input = {
      operation: 'on' as const,
      event_name: 'test-event',
      callback: 'handleEvent',
    };

    const result = await eventEmitterFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.listener).toBeDefined();
    expect(result.data!.listener!.eventName).toBe('test-event');
    expect(result.data!.listener!.callback).toBe('handleEvent');
    expect(result.data!.listener!.once).toBe(false);
    expect(result.data!.listener_id).toBeDefined();
  });

  it('should add one-time event listener', async () => {
    const input = {
      operation: 'once' as const,
      event_name: 'test-event',
      callback: 'handleEventOnce',
    };

    const result = await eventEmitterFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.listener).toBeDefined();
    expect(result.data!.listener!.eventName).toBe('test-event');
    expect(result.data!.listener!.callback).toBe('handleEventOnce');
    expect(result.data!.listener!.once).toBe(true);
  });

  it('should remove event listener', async () => {
    // 先添加监听器
    const addResult = await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'test-event',
      callback: 'handleEvent',
    });

    const listenerId = addResult.data!.listener_id!;

    // 移除监听器
    const removeResult = await eventEmitterFunction.execute({
      operation: 'off' as const,
      listener_id: listenerId,
    });

    expect(removeResult.success).toBe(true);
    expect(removeResult.data!.listener).toBeDefined();
    expect(removeResult.data!.listener!.id).toBe(listenerId);
  });

  it('should get listeners for an event', async () => {
    // 添加多个监听器
    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'test-event',
      callback: 'handler1',
    });

    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'test-event',
      callback: 'handler2',
    });

    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'other-event',
      callback: 'handler3',
    });

    // 获取test-event的监听器
    const result = await eventEmitterFunction.execute({
      operation: 'listeners' as const,
      event_name: 'test-event',
    });

    expect(result.success).toBe(true);
    expect(result.data!.listeners).toBeDefined();
    expect(result.data!.listeners!.length).toBe(2);
    expect(result.data!.listeners!.some(l => l.callback === 'handler1')).toBe(true);
    expect(result.data!.listeners!.some(l => l.callback === 'handler2')).toBe(true);
  });

  it('should get all event names', async () => {
    // 添加不同事件的监听器
    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'event1',
      callback: 'handler1',
    });

    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'event2',
      callback: 'handler2',
    });

    const result = await eventEmitterFunction.execute({
      operation: 'eventNames' as const,
    });

    expect(result.success).toBe(true);
    expect(result.data!.event_names).toBeDefined();
    expect(result.data!.event_names!.length).toBe(2);
    expect(result.data!.event_names!.includes('event1')).toBe(true);
    expect(result.data!.event_names!.includes('event2')).toBe(true);
  });

  it('should get event emitter stats', async () => {
    // 发射一些事件
    await eventEmitterFunction.execute({
      operation: 'emit' as const,
      event_name: 'test-event',
      data: { test: true },
    });

    await eventEmitterFunction.execute({
      operation: 'emit' as const,
      event_name: 'test-event',
      data: { test: false },
    });

    // 添加监听器
    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'test-event',
      callback: 'handler1',
    });

    const result = await eventEmitterFunction.execute({
      operation: 'stats' as const,
    });

    expect(result.success).toBe(true);
    expect(result.data!.stats).toBeDefined();
    expect(result.data!.stats!.total_events).toBeGreaterThanOrEqual(2);
    expect(result.data!.stats!.total_listeners).toBe(1);
    expect(result.data!.stats!.events_by_type).toBeDefined();
    expect(result.data!.stats!.listeners_by_event).toBeDefined();
  });

  it('should remove all listeners for specific event', async () => {
    // 添加监听器
    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'event1',
      callback: 'handler1',
    });

    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'event1',
      callback: 'handler2',
    });

    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'event2',
      callback: 'handler3',
    });

    // 移除event1的所有监听器
    const result = await eventEmitterFunction.execute({
      operation: 'removeAllListeners' as const,
      event_name: 'event1',
    });

    expect(result.success).toBe(true);
    expect(result.metadata!.removed_listeners).toBe(2);

    // 检查event1的监听器
    const listenersResult = await eventEmitterFunction.execute({
      operation: 'listeners' as const,
      event_name: 'event1',
    });

    expect(listenersResult.data!.listeners!.length).toBe(0);

    // 检查event2的监听器还在
    const event2ListenersResult = await eventEmitterFunction.execute({
      operation: 'listeners' as const,
      event_name: 'event2',
    });

    expect(event2ListenersResult.data!.listeners!.length).toBe(1);
  });

  it('should remove all listeners', async () => {
    // 添加多个监听器
    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'event1',
      callback: 'handler1',
    });

    await eventEmitterFunction.execute({
      operation: 'on' as const,
      event_name: 'event2',
      callback: 'handler2',
    });

    // 移除所有监听器
    const result = await eventEmitterFunction.execute({
      operation: 'removeAllListeners' as const,
    });

    expect(result.success).toBe(true);
    expect(result.metadata!.removed_listeners).toBe(2);

    // 检查事件名称列表为空
    const eventNamesResult = await eventEmitterFunction.execute({
      operation: 'eventNames' as const,
    });

    expect(eventNamesResult.data!.event_names!.length).toBe(0);
  });

  it('should handle invalid input for emit operation', async () => {
    const result = await eventEmitterFunction.execute({
      operation: 'emit' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid input for on operation', async () => {
    const result = await eventEmitterFunction.execute({
      operation: 'on' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid input for off operation', async () => {
    const result = await eventEmitterFunction.execute({
      operation: 'off' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid input for listeners operation', async () => {
    const result = await eventEmitterFunction.execute({
      operation: 'listeners' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should validate input correctly', () => {
    const validInput = {
      operation: 'emit' as const,
      event_name: 'test-event',
      data: { test: true },
    };

    const validation = eventEmitterFunction.validate!(validInput);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toBeUndefined();
  });

  it('should reject invalid input', () => {
    const invalidInput = {
      operation: 'emit' as const,
    };

    const validation = eventEmitterFunction.validate!(invalidInput);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toBeDefined();
    expect(validation.errors!.length).toBeGreaterThan(0);
  });

  it('should handle event with complex data', async () => {
    const complexData = {
      user: { id: 1, name: 'John' },
      items: ['item1', 'item2'],
      metadata: { timestamp: Date.now() },
    };

    const result = await eventEmitterFunction.execute({
      operation: 'emit' as const,
      event_name: 'complex-event',
      data: complexData,
      source: 'system',
      type: 'data',
    });

    expect(result.success).toBe(true);
    expect(result.data!.event!.data).toEqual(complexData);
  });

  it('should handle removing non-existent listener', async () => {
    const result = await eventEmitterFunction.execute({
      operation: 'off' as const,
      listener_id: 'non-existent-id',
    });

    expect(result.success).toBe(true);
    expect(result.data!.listener).toBeUndefined();
  });
});