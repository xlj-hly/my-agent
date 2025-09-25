import { messageBusFunction } from '../../../../packages/@agent-services/communication/message-bus';

describe('Message Bus Function', () => {
  beforeEach(async () => {
    // 清理消息总线状态
    await messageBusFunction.execute({ operation: 'clear' });
  });

  it('should send a message successfully', async () => {
    const input = {
      operation: 'send' as const,
      message: {
        content: 'Hello, World!',
        sender: 'agent1',
        recipient: 'agent2',
        type: 'text',
      },
    };

    const result = await messageBusFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.message).toBeDefined();
    expect(result.data!.message!.content).toBe('Hello, World!');
    expect(result.data!.delivery_status).toBe('delivered');
    expect(result.data!.message_id).toBeDefined();
  });

  it('should receive messages for a recipient', async () => {
    // 先发送几条消息
    await messageBusFunction.execute({
      operation: 'send' as const,
      message: {
        content: 'Message 1',
        sender: 'agent1',
        recipient: 'agent2',
        type: 'text',
      },
    });

    await messageBusFunction.execute({
      operation: 'send' as const,
      message: {
        content: 'Message 2',
        sender: 'agent3',
        recipient: 'agent2',
        type: 'text',
      },
    });

    // 接收消息
    const result = await messageBusFunction.execute({
      operation: 'receive' as const,
      recipient: 'agent2',
    });

    expect(result.success).toBe(true);
    expect(result.data!.messages).toBeDefined();
    expect(result.data!.messages!.length).toBe(2);
    expect(result.data!.messages!.some(msg => msg.content === 'Message 1')).toBe(true);
    expect(result.data!.messages!.some(msg => msg.content === 'Message 2')).toBe(true);
  });

  it('should queue and dequeue messages', async () => {
    // 入队消息
    const queueResult = await messageBusFunction.execute({
      operation: 'queue' as const,
      message: {
        content: 'Queued message',
        sender: 'agent1',
        recipient: 'agent2',
        type: 'text',
      },
      queue_name: 'task_queue',
    });

    expect(queueResult.success).toBe(true);
    expect(queueResult.data!.queue_size).toBe(1);

    // 出队消息
    const dequeueResult = await messageBusFunction.execute({
      operation: 'dequeue' as const,
      queue_name: 'task_queue',
    });

    expect(dequeueResult.success).toBe(true);
    expect(dequeueResult.data!.message).toBeDefined();
    expect(dequeueResult.data!.message!.content).toBe('Queued message');
    expect(dequeueResult.data!.queue_size).toBe(0);
  });

  it('should handle multiple queues', async () => {
    // 向不同队列添加消息
    await messageBusFunction.execute({
      operation: 'queue' as const,
      message: {
        content: 'Queue 1 message',
        sender: 'agent1',
        recipient: 'agent2',
        type: 'text',
      },
      queue_name: 'queue1',
    });

    await messageBusFunction.execute({
      operation: 'queue' as const,
      message: {
        content: 'Queue 2 message',
        sender: 'agent1',
        recipient: 'agent3',
        type: 'text',
      },
      queue_name: 'queue2',
    });

    // 检查队列1
    const queue1Result = await messageBusFunction.execute({
      operation: 'dequeue' as const,
      queue_name: 'queue1',
    });

    expect(queue1Result.success).toBe(true);
    expect(queue1Result.data!.message!.content).toBe('Queue 1 message');

    // 检查队列2
    const queue2Result = await messageBusFunction.execute({
      operation: 'dequeue' as const,
      queue_name: 'queue2',
    });

    expect(queue2Result.success).toBe(true);
    expect(queue2Result.data!.message!.content).toBe('Queue 2 message');
  });

  it('should return message bus status', async () => {
    // 发送一些消息
    await messageBusFunction.execute({
      operation: 'send' as const,
      message: {
        content: 'Test message',
        sender: 'agent1',
        recipient: 'agent2',
        type: 'text',
      },
    });

    const result = await messageBusFunction.execute({
      operation: 'status' as const,
    });

    expect(result.success).toBe(true);
    expect(result.data!.status).toBeDefined();
    expect(result.data!.status!.total_messages).toBeGreaterThan(0);
    expect(result.data!.status!.delivered_messages).toBeGreaterThan(0);
  });

  it('should clear all messages', async () => {
    // 发送一些消息
    await messageBusFunction.execute({
      operation: 'send' as const,
      message: {
        content: 'Test message',
        sender: 'agent1',
        recipient: 'agent2',
        type: 'text',
      },
    });

    // 清理
    const clearResult = await messageBusFunction.execute({
      operation: 'clear' as const,
    });

    expect(clearResult.success).toBe(true);

    // 检查状态
    const statusResult = await messageBusFunction.execute({
      operation: 'status' as const,
    });

    expect(statusResult.success).toBe(true);
    expect(statusResult.data!.status!.total_messages).toBe(0);
  });

  it('should handle invalid input for send operation', async () => {
    const result = await messageBusFunction.execute({
      operation: 'send' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid input for receive operation', async () => {
    const result = await messageBusFunction.execute({
      operation: 'receive' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid input for queue operation', async () => {
    const result = await messageBusFunction.execute({
      operation: 'queue' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid input for dequeue operation', async () => {
    const result = await messageBusFunction.execute({
      operation: 'dequeue' as const,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should validate input correctly', () => {
    const validInput = {
      operation: 'send' as const,
      message: {
        content: 'Test',
        sender: 'agent1',
        recipient: 'agent2',
        type: 'text',
      },
    };

    const validation = messageBusFunction.validate!(validInput);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toBeUndefined();
  });

  it('should reject invalid input', () => {
    const invalidInput = {
      operation: 'send' as const,
    };

    const validation = messageBusFunction.validate!(invalidInput);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toBeDefined();
    expect(validation.errors!.length).toBeGreaterThan(0);
  });

  it('should handle message with metadata', async () => {
    const input = {
      operation: 'send' as const,
      message: {
        content: 'Message with metadata',
        sender: 'agent1',
        recipient: 'agent2',
        type: 'data',
        metadata: {
          priority: 'high',
          category: 'urgent',
        },
      },
    };

    const result = await messageBusFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data!.message!.metadata).toEqual({
      priority: 'high',
      category: 'urgent',
    });
  });

  it('should handle empty queue dequeue', async () => {
    const result = await messageBusFunction.execute({
      operation: 'dequeue' as const,
      queue_name: 'empty_queue',
    });

    expect(result.success).toBe(true);
    expect(result.data!.message).toBeUndefined();
    expect(result.data!.queue_size).toBe(0);
  });
});