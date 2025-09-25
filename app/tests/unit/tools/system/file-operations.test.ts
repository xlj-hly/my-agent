/**
 * @jest-environment node
 * 
 * File Operations 工具函数测试
 */

import { fileOperationsFunction } from '../../../../packages/@agent-tools/system/file-operations';

describe('FileOperationsFunction', () => {
  it('应该成功读取文件信息', async () => {
    const input = {
      filePath: './package.json',
      operation: 'info'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.fileInfo).toBeDefined();
    expect(result.data?.fileInfo!.name).toBeDefined();
    expect(result.data?.fileInfo!.size).toBeDefined();
    expect(typeof result.data?.fileInfo!.size).toBe('number');
  });

  it('应该成功检查文件是否存在', async () => {
    const input = {
      filePath: './package.json',
      operation: 'exists'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.exists).toBeDefined();
    expect(typeof result.data?.exists).toBe('boolean');
  });

  it('应该成功列出目录内容', async () => {
    const input = {
      filePath: './app',
      operation: 'list'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.files).toBeDefined();
    expect(Array.isArray(result.data?.files)).toBe(true);
  });

  it('应该成功创建目录', async () => {
    const input = {
      filePath: './test-temp-dir',
      operation: 'mkdir'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.created).toBeDefined();
    expect(typeof result.data?.created).toBe('boolean');
  });

  it('应该成功删除文件或目录', async () => {
    // 先创建测试目录
    await fileOperationsFunction.execute({
      filePath: './test-temp-dir',
      operation: 'mkdir'
    });
    
    const input = {
      filePath: './test-temp-dir',
      operation: 'delete'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.deleted).toBeDefined();
    expect(typeof result.data?.deleted).toBe('boolean');
  });

  it('应该成功复制文件', async () => {
    const input = {
      filePath: './package.json',
      operation: 'copy',
      destinationPath: './package-copy.json'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.copied).toBeDefined();
    expect(typeof result.data?.copied).toBe('boolean');
  });

  it('应该成功移动文件', async () => {
    // 先复制文件
    await fileOperationsFunction.execute({
      filePath: './package.json',
      operation: 'copy',
      destinationPath: './package-move.json'
    });
    
    const input = {
      filePath: './package-move.json',
      operation: 'move',
      destinationPath: './package-moved.json'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.moved).toBeDefined();
    expect(typeof result.data?.moved).toBe('boolean');
  });

  it('应该处理不存在的文件', async () => {
    const input = {
      filePath: './non-existent-file.txt',
      operation: 'info'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该验证输入schema', () => {
    const validInput = {
      filePath: './test.txt',
      operation: 'info'
    };
    
    const invalidInput = {
      filePath: 123, // 应该是字符串
      operation: 'invalid' // 无效操作
    } as any;
    
    if (fileOperationsFunction.validate) {
      const validResult = fileOperationsFunction.validate(validInput);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = fileOperationsFunction.validate(invalidInput);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    }
  });

  it('应该返回正确的元数据', async () => {
    const input = {
      filePath: './package.json',
      operation: 'info'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.operation).toBe('info');
    expect(result.metadata?.filePath).toBe('./package.json');
    expect(result.executionTime).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  it('应该支持权限检查', async () => {
    const input = {
      filePath: './package.json',
      operation: 'permissions'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.permissions).toBeDefined();
    expect(result.data?.permissions!.readable).toBeDefined();
    expect(typeof result.data?.permissions!.readable).toBe('boolean');
  });

  it('应该支持递归目录操作', async () => {
    const input = {
      filePath: './app',
      operation: 'list',
      recursive: true
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.files).toBeDefined();
    expect(Array.isArray(result.data?.files)).toBe(true);
  });

  it('应该处理路径遍历攻击防护', async () => {
    const input = {
      filePath: '../../../etc/passwd',
      operation: 'info'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该支持文件搜索', async () => {
    const input = {
      filePath: './app',
      operation: 'search',
      searchPattern: '*.ts'
    };
    
    const result = await fileOperationsFunction.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.data?.searchResults).toBeDefined();
    expect(Array.isArray(result.data?.searchResults)).toBe(true);
  });
});
