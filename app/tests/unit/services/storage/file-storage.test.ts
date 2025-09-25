import { fileStorageFunction, FileStorageInput, FileStorageOutput } from '../../../../packages/@agent-services/storage/file-storage';
import { FunctionResult } from '../../../../packages/@agent-core';

describe('File Storage Function', () => {
  beforeEach(async () => {
    // 清理文件系统状态
    await fileStorageFunction.execute({ operation: 'clear' });
  });

  it('should upload file successfully', async () => {
    const input: FileStorageInput = {
      operation: 'upload',
      path: '/documents/test.txt',
      content: 'Hello, World!',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.result).toBeDefined();
    expect(result.data!.result!.fileInfo).toBeDefined();
    expect(result.data!.result!.fileInfo!.name).toBe('test.txt');
    expect(result.data!.result!.fileInfo!.path).toBe('/documents/test.txt');
    expect(result.data!.result!.bytesTransferred).toBe(13);
  });

  it('should download file successfully', async () => {
    // First upload a file
    await fileStorageFunction.execute({
      operation: 'upload',
      path: '/data/config.json',
      content: '{"version": "1.0.0", "debug": true}',
    });

    const input: FileStorageInput = {
      operation: 'download',
      path: '/data/config.json',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.content).toBe('{"version": "1.0.0", "debug": true}');
    expect(result.data!.bytesTransferred).toBe(35);
  });

  it('should delete file successfully', async () => {
    // First upload a file
    await fileStorageFunction.execute({
      operation: 'upload',
      path: '/temp/file.txt',
      content: 'Temporary content',
    });

    const input: FileStorageInput = {
      operation: 'delete',
      path: '/temp/file.txt',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.message).toBe('File or directory deleted successfully');
  });

  it('should create directory successfully', async () => {
    const input: FileStorageInput = {
      operation: 'mkdir',
      path: '/projects/myapp',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.result).toBeDefined();
    expect(result.data!.result!.fileInfo).toBeDefined();
    expect(result.data!.result!.fileInfo!.isDirectory).toBe(true);
    expect(result.data!.result!.fileInfo!.name).toBe('myapp');
  });

  it('should list directory contents', async () => {
    // Create directory and files
    await fileStorageFunction.execute({ operation: 'mkdir', path: '/workspace' });
    await fileStorageFunction.execute({ operation: 'upload', path: '/workspace/app.js', content: 'console.log("Hello");' });
    await fileStorageFunction.execute({ operation: 'upload', path: '/workspace/README.md', content: '# My App' });

    const input: FileStorageInput = {
      operation: 'list',
      path: '/workspace',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.files).toHaveLength(2);
    expect(result.data!.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'app.js', isDirectory: false }),
        expect.objectContaining({ name: 'README.md', isDirectory: false }),
      ])
    );
  });

  it('should get file information', async () => {
    // First upload a file
    await fileStorageFunction.execute({
      operation: 'upload',
      path: '/info/document.pdf',
      content: 'PDF content here',
    });

    const input: FileStorageInput = {
      operation: 'info',
      path: '/info/document.pdf',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.result).toBeDefined();
    expect(result.data!.result!.fileInfo).toBeDefined();
    expect(result.data!.result!.fileInfo!.name).toBe('document.pdf');
    expect(result.data!.result!.fileInfo!.size).toBe(16);
    expect(result.data!.result!.fileInfo!.isDirectory).toBe(false);
  });

  it('should copy file successfully', async () => {
    // First upload a file
    await fileStorageFunction.execute({
      operation: 'upload',
      path: '/source/original.txt',
      content: 'Original content',
    });

    const input: FileStorageInput = {
      operation: 'copy',
      path: '/source/original.txt',
      destination: '/backup/copy.txt',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.message).toBe('File copied successfully');

    // Verify copy exists
    const downloadResult = await fileStorageFunction.execute({
      operation: 'download',
      path: '/backup/copy.txt',
    });
    expect(downloadResult.data!.content).toBe('Original content');
  });

  it('should move file successfully', async () => {
    // First upload a file
    await fileStorageFunction.execute({
      operation: 'upload',
      path: '/old/location.txt',
      content: 'File content',
    });

    const input: FileStorageInput = {
      operation: 'move',
      path: '/old/location.txt',
      destination: '/new/location.txt',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.message).toBe('File moved successfully');

    // Verify file exists in new location
    const downloadResult = await fileStorageFunction.execute({
      operation: 'download',
      path: '/new/location.txt',
    });
    expect(downloadResult.data!.content).toBe('File content');

    // Verify file doesn't exist in old location
    const oldFileResult = await fileStorageFunction.execute({
      operation: 'download',
      path: '/old/location.txt',
    });
    expect(oldFileResult.success).toBe(false);
  });

  it('should check if file exists', async () => {
    // First upload a file
    await fileStorageFunction.execute({
      operation: 'upload',
      path: '/check/exists.txt',
      content: 'Test file',
    });

    const input: FileStorageInput = {
      operation: 'exists',
      path: '/check/exists.txt',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.message).toBe('File or directory exists');
  });

  it('should return false for non-existent file', async () => {
    const input: FileStorageInput = {
      operation: 'exists',
      path: '/nonexistent/file.txt',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.message).toBe('File or directory does not exist');
  });

  it('should search files by pattern', async () => {
    // Upload multiple files
    await fileStorageFunction.execute({ operation: 'upload', path: '/search/app.js', content: 'JS code' });
    await fileStorageFunction.execute({ operation: 'upload', path: '/search/app.css', content: 'CSS code' });
    await fileStorageFunction.execute({ operation: 'upload', path: '/search/readme.md', content: 'Markdown' });

    const input: FileStorageInput = {
      operation: 'search',
      pattern: 'app.*',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);
    expect(result.data!.files).toHaveLength(3);
    expect(result.data!.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'app.js' }),
        expect.objectContaining({ name: 'app.css' }),
      ])
    );
  });

  it('should handle overwrite option', async () => {
    // First upload a file
    await fileStorageFunction.execute({
      operation: 'upload',
      path: '/overwrite/test.txt',
      content: 'Original content',
    });

    const input: FileStorageInput = {
      operation: 'upload',
      path: '/overwrite/test.txt',
      content: 'New content',
      overwrite: true,
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);

    // Verify content was updated
    const downloadResult = await fileStorageFunction.execute({
      operation: 'download',
      path: '/overwrite/test.txt',
    });
    expect(downloadResult.data!.content).toBe('New content');
  });

  it('should handle directory with permissions', async () => {
    const input: FileStorageInput = {
      operation: 'mkdir',
      path: '/secure/folder',
      permissions: 'rwxr-xr-x',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.result).toBeDefined();
    expect(result.data!.result!.fileInfo).toBeDefined();
    expect(result.data!.result!.fileInfo!.permissions).toBe('rwxr-xr-x');
  });

  it('should handle recursive directory operations', async () => {
    // Create nested directory structure
    await fileStorageFunction.execute({ operation: 'mkdir', path: '/nested/level1' });
    await fileStorageFunction.execute({ operation: 'mkdir', path: '/nested/level1/level2' });
    await fileStorageFunction.execute({ operation: 'upload', path: '/nested/level1/level2/file.txt', content: 'Nested file' });

    // Delete the entire nested structure
    const input: FileStorageInput = {
      operation: 'delete',
      path: '/nested',
      recursive: true,
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.success).toBe(true);

    // Verify structure was deleted
    const existsResult = await fileStorageFunction.execute({
      operation: 'exists',
      path: '/nested',
    });
    expect(existsResult.data!.message).toBe('File or directory does not exist');
  });

  it('should handle missing required parameters', async () => {
    const input: FileStorageInput = {
      operation: 'upload',
      // Missing path and content
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid operations', async () => {
    const input: FileStorageInput = {
      operation: 'invalid_operation',
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should validate input correctly', () => {
    const validInput: FileStorageInput = {
      operation: 'upload',
      path: '/test/file.txt',
      content: 'Test content',
    };
    const validResult = fileStorageFunction.validate!(validInput);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toEqual([]);

    const invalidInput: FileStorageInput = {
      operation: 'upload',
      // Missing path
      content: 'Test content',
    };
    const invalidResult = fileStorageFunction.validate!(invalidInput);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('Path is required for this operation.');
  });

  it('should handle large file content', async () => {
    const largeContent = 'x'.repeat(10000); // 10KB content

    const input: FileStorageInput = {
      operation: 'upload',
      path: '/large/bigfile.txt',
      content: largeContent,
    };

    const result: FunctionResult<FileStorageOutput> = await fileStorageFunction.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.result).toBeDefined();
    expect(result.data!.result!.fileInfo!.size).toBe(10000);
    expect(result.data!.result!.bytesTransferred).toBe(10000);
  });

  it('should handle complex directory structure', async () => {
    // Create complex directory structure
    await fileStorageFunction.execute({ operation: 'mkdir', path: '/project/src/components' });
    await fileStorageFunction.execute({ operation: 'mkdir', path: '/project/src/utils' });
    await fileStorageFunction.execute({ operation: 'upload', path: '/project/package.json', content: '{"name": "test"}' });
    await fileStorageFunction.execute({ operation: 'upload', path: '/project/src/index.js', content: 'console.log("Hello");' });
    await fileStorageFunction.execute({ operation: 'upload', path: '/project/src/components/Button.js', content: 'export default Button;' });

    // List root directory
    const rootListResult = await fileStorageFunction.execute({
      operation: 'list',
      path: '/project',
    });

    expect(rootListResult.success).toBe(true);
    expect(rootListResult.data!.files).toHaveLength(2); // package.json and src directory

    // List src directory
    const srcListResult = await fileStorageFunction.execute({
      operation: 'list',
      path: '/project/src',
    });

    expect(srcListResult.success).toBe(true);
    expect(srcListResult.data!.files).toHaveLength(3); // index.js, components, utils
  });
});
