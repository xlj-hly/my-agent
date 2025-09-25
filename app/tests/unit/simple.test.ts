/**
 * 简单测试 - 验证基础功能
 */

describe('基础功能测试', () => {
  it('应该能够运行基本的测试', () => {
    expect(1 + 1).toBe(2);
  });

  it('应该能够使用字符串操作', () => {
    const message = 'Hello, World!';
    expect(message).toContain('Hello');
    expect(message.length).toBeGreaterThan(0);
  });

  it('应该能够使用数组操作', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers[0]).toBe(1);
    expect(numbers[4]).toBe(5);
  });

  it('应该能够使用对象操作', () => {
    const obj = {
      name: 'test',
      version: '1.0.0',
      description: '测试对象',
    };

    expect(obj.name).toBe('test');
    expect(obj.version).toBe('1.0.0');
    expect(obj).toHaveProperty('description');
  });

  it('应该能够使用异步操作', async () => {
    const asyncFunction = async () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('异步结果'), 10);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe('异步结果');
  });
});
