import { pubSubFunction } from '../../../../packages/@agent-services/communication/pub-sub';

describe('Pub-Sub Function', () => {
  beforeEach(async () => {
    // 清理发布订阅状态
    await pubSubFunction.execute({ operation: 'clear' });
  });

  it('should publish a message successfully', async () => {
    const input = {
      operation: 'publish' as const,
      topic: 'news',
      content: 'Breaking news!',
      publisher: 'news-agent',
    };

    const result = await pubSubFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.message).toBeDefined();
    expect(result.data!.message!.topic).toBe('news');
    expect(result.data!.message!.content).toBe('Breaking news!');
    expect(result.data!.message!.publisher).toBe('news-agent');
    expect(result.data!.message_id).toBeDefined();
  });

  it('should subscribe to a topic', async () => {
    const input = {
      operation: 'subscribe' as const,
      topic: 'news',
      callback: 'handleNews',
    };

    const result = await pubSubFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.subscriber).toBeDefined();
    expect(result.data!.subscriber!.topic).toBe('news');
    expect(result.data!.subscriber!.callback).toBe('handleNews');
    expect(result.data!.subscriber!.active).toBe(true);
    expect(result.data!.subscriber_id).toBeDefined();
  });

  it('should unsubscribe from a topic', async () => {
    // 先订阅
    const subscribeResult = await pubSubFunction.execute({
      operation: 'subscribe' as const,
      topic: 'news',
      callback: 'handleNews',
    });

    const subscriberId = subscribeResult.data!.subscriber_id!;

    // 取消订阅
    const unsubscribeResult = await pubSubFunction.execute({
      operation: 'unsubscribe' as const,
      subscriber_id: subscriberId,
    });

    expect(unsubscribeResult.success).toBe(true);
    expect(unsubscribeResult.data!.subscriber).toBeDefined();
    expect(unsubscribeResult.data!.subscriber!.id).toBe(subscriberId);
  });

  it('should get subscribers for a topic', async () => {
    // 添加多个订阅者
    await pubSubFunction.execute({
      operation: 'subscribe' as const,
      topic: 'sports',
      callback: 'handler1',
    });

    await pubSubFunction.execute({
      operation: 'subscribe' as const,
      topic: 'sports',
      callback: 'handler2',
    });

    await pubSubFunction.execute({
      operation: 'subscribe' as const,
      topic: 'weather',
      callback: 'handler3',
    });

    // 获取sports主题的订阅者
    const result = await pubSubFunction.execute({
      operation: 'getSubscribers' as const,
      topic: 'sports',
    });

    expect(result.success).toBe(true);
    expect(result.data!.subscribers).toBeDefined();
    expect(result.data!.subscribers!.length).toBe(2);
    expect(result.data!.subscribers!.some(s => s.callback === 'handler1')).toBe(true);
    expect(result.data!.subscribers!.some(s => s.callback === 'handler2')).toBe(true);
  });

  it('should get all topics', async () => {
    // 添加不同主题的订阅者
    await pubSubFunction.execute({
      operation: 'subscribe' as const,
      topic: 'topic1',
      callback: 'handler1',
    });

    await pubSubFunction.execute({
      operation: 'subscribe' as const,
      topic: 'topic2',
      callback: 'handler2',
    });

    const result = await pubSubFunction.execute({
      operation: 'getTopics' as const,
    });

    expect(result.success).toBe(true);
    expect(result.data!.topics).toBeDefined();
    expect(result.data!.topics!.length).toBe(2);
    expect(result.data!.topics!.includes('topic1')).toBe(true);
    expect(result.data!.topics!.includes('topic2')).toBe(true);
  });

  it('should get pub-sub stats', async () => {
    // 发布一些消息
    await pubSubFunction.execute({
      operation: 'publish' as const,
      topic: 'test',
      content: 'Message 1',
      publisher: 'agent1',
    });

    await pubSubFunction.execute({
      operation: 'publish' as const,
      topic: 'test',
      content: 'Message 2',
      publisher: 'agent2',
    });

    // 添加订阅者
    await pubSubFunction.execute({
      operation: 'subscribe' as const,
      topic: 'test',
      callback: 'handler1',
    });

    const result = await pubSubFunction.execute({
      operation: 'stats' as const,
    });

    expect(result.success).toBe(true);
    expect(result.data!.stats).toBeDefined();
    expect(result.data!.stats!.total_topics).toBe(1);
    expect(result.data!.stats!.total_subscribers).toBe(1);
    expect(result.data!.stats!.total_messages).toBe(2);
    expect(result.data!.stats!.subscribers_by_topic).toBeDefined();
    expect(result.data!.stats!.messages_by_topic).toBeDefined();
  });

  it('should clear all data', async () => {
    // 添加一些数据
    await pubSubFunction.execute({
      operation: 'publish' as const,
      topic: 'test',
      content: 'Test message',
      publisher: 'agent1',
    });

    await pubSubFunction.execute({
      operation: 'subscribe' as const,
      topic: 'test',
      callback: 'handler1',
    });

    // 清理
    const result = await pubSubFunction.execute({
      operation: 'clear' as const,
    });

    expect(result.success).toBe(true);
    expect(result.data!.stats!.total_messages).toBe(0);
    expect(result.data!.stats!.total_subscribers).toBe(0);
    expect(result.data!.stats!.total_topics).toBe(0);
  });

  it('should handle publishToTopic operation', async () => {
    const input = {
      operation: 'publishToTopic' as const,
      topic: 'announcements',
      content: 'Important announcement',
      publisher: 'admin',
    };

    const result = await pubSubFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data!.message!.topic).toBe('announcements');
    expect(result.data!.message!.content).toBe('Important announcement');
  });

  it('should notify subscribers when publishing', async () => {
    // 添加订阅者
    await pubSubFunction.execute({
      operation: 'subscribe' as const,
      topic: 'notifications',
      callback: 'notifyHandler',
    });

    await pubSubFunction.execute({
      operation: 'subscribe' as const,
      topic: 'notifications',
      callback: 'alertHandler',
    });

    // 发布消息
    const result = await pubSubFunction.execute({
      operation: 'publish' as const,
      topic: 'notifications',
      content: 'New notification',
      publisher: 'system',
    });

    expect(result.success).toBe(true);
    expect(result.metadata!.subscribers_notified).toBe(2);
  });

  it('should handle message with metadata', async () => {
    const metadata = {
      priority: 'high',
      category: 'urgent',
      timestamp: Date.now(),
    };

    const result = await pubSubFunction.execute({
      operation: 'publish' as const,
      topic: 'alerts',
      content: 'Alert message',
      publisher: 'monitor',
      metadata,
    });

    expect(result.success).toBe(true);
    expect(result.data!.message!.metadata).toEqual(metadata);
  });

  it('should handle invalid input for publish operation', async () => {
    const result = await pubSubFunction.execute({
      operation: 'publish' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid input for subscribe operation', async () => {
    const result = await pubSubFunction.execute({
      operation: 'subscribe' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid input for unsubscribe operation', async () => {
    const result = await pubSubFunction.execute({
      operation: 'unsubscribe' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid input for getSubscribers operation', async () => {
    const result = await pubSubFunction.execute({
      operation: 'getSubscribers' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should validate input correctly', () => {
    const validInput = {
      operation: 'publish' as const,
      topic: 'test',
      content: 'test content',
      publisher: 'test-publisher',
    };

    const validation = pubSubFunction.validate!(validInput);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toBeUndefined();
  });

  it('should reject invalid input', () => {
    const invalidInput = {
      operation: 'publish' as const,
    };

    const validation = pubSubFunction.validate!(invalidInput);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toBeDefined();
    expect(validation.errors!.length).toBeGreaterThan(0);
  });

  it('should handle complex content types', async () => {
    const complexContent = {
      type: 'data',
      payload: {
        user: { id: 1, name: 'John' },
        actions: ['read', 'write'],
        settings: { theme: 'dark', language: 'en' },
      },
      timestamp: Date.now(),
    };

    const result = await pubSubFunction.execute({
      operation: 'publish' as const,
      topic: 'user-updates',
      content: complexContent,
      publisher: 'user-service',
    });

    expect(result.success).toBe(true);
    expect(result.data!.message!.content).toEqual(complexContent);
  });

  it('should handle removing non-existent subscriber', async () => {
    const result = await pubSubFunction.execute({
      operation: 'unsubscribe' as const,
      subscriber_id: 'non-existent-id',
    });

    expect(result.success).toBe(true);
    expect(result.data!.subscriber).toBeUndefined();
  });

  it('should handle multiple publishers on same topic', async () => {
    // 多个发布者发布到同一主题
    await pubSubFunction.execute({
      operation: 'publish' as const,
      topic: 'shared',
      content: 'Message from publisher 1',
      publisher: 'publisher1',
    });

    await pubSubFunction.execute({
      operation: 'publish' as const,
      topic: 'shared',
      content: 'Message from publisher 2',
      publisher: 'publisher2',
    });

    const statsResult = await pubSubFunction.execute({
      operation: 'stats' as const,
    });

    expect(statsResult.success).toBe(true);
    expect(statsResult.data!.stats!.total_messages).toBe(2);
    expect(statsResult.data!.stats!.messages_by_topic.shared).toBe(2);
  });
});