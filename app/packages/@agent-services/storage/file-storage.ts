import { FunctionCall, FunctionResult, ExecutionContext } from '../../@agent-core';
import { JSONSchema } from '../../@agent-core/interfaces/function.interface';
import { ERROR_CODES, getErrorMessage } from '../../@agent-core/constants/errors';

// 文件信息接口
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  createdAt: number;
  modifiedAt: number;
  permissions: string;
  isDirectory: boolean;
  parent?: string;
  children?: string[];
}

// 文件操作结果接口
export interface FileOperationResult {
  success: boolean;
  message: string;
  fileInfo?: FileInfo;
  files?: FileInfo[];
  content?: string;
  bytesTransferred?: number;
}

// 文件存储输入接口
export interface FileStorageInput {
  operation: string;
  path?: string;
  content?: string;
  destination?: string;
  newPath?: string;
  pattern?: string;
  recursive?: boolean;
  permissions?: string;
  overwrite?: boolean;
}

// 文件存储输出接口
export interface FileStorageOutput {
  success: boolean;
  error?: string;
  result?: FileOperationResult;
  files?: FileInfo[];
  content?: string;
  bytesTransferred?: number;
  message?: string;
}

// 模拟文件系统存储
const fileSystem = new Map<string, FileInfo>();
const fileContents = new Map<string, string>();

// 生成文件ID（暂时注释，避免未使用警告）
// function generateFileId(path: string): string {
//   return `file_${Buffer.from(path).toString('base64')}`;
// }

// 创建文件信息
function createFileInfo(path: string, isDirectory: boolean = false, content?: string): FileInfo {
  const now = Date.now();
  const pathParts = path.split('/');
  const name = pathParts[pathParts.length - 1];
  const parent = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : undefined;
  
  const fileInfo: FileInfo = {
    name,
    path,
    size: content ? Buffer.byteLength(content, 'utf8') : 0,
    type: isDirectory ? 'directory' : 'file',
    createdAt: now,
    modifiedAt: now,
    permissions: 'rw-r--r--',
    isDirectory,
    parent,
    children: isDirectory ? [] : undefined,
  };
  
  fileSystem.set(path, fileInfo);
  if (content && !isDirectory) {
    fileContents.set(path, content);
  }
  
  // 更新父目录
  if (parent) {
    let parentInfo = fileSystem.get(parent);
    if (!parentInfo) {
      // 如果父目录不存在，创建它
      parentInfo = createFileInfo(parent, true);
    } else if (!parentInfo.isDirectory) {
      // 如果父路径存在但不是目录，跳过
      return fileInfo;
    }
    
    if (!parentInfo.children) {
      parentInfo.children = [];
    }
    if (!parentInfo.children.includes(name)) {
      parentInfo.children.push(name);
      parentInfo.modifiedAt = now;
    }
  }
  
  return fileInfo;
}

// 删除文件或目录
function deleteFile(path: string, recursive: boolean = true): boolean {
  const fileInfo = fileSystem.get(path);
  if (!fileInfo) return false;
  
  if (fileInfo.isDirectory) {
    if (!recursive && fileInfo.children && fileInfo.children.length > 0) {
      // 非递归模式下，如果目录不为空则删除失败
      return false;
    }
    
    if (fileInfo.children) {
      // 递归删除子文件和子目录
      for (const child of fileInfo.children) {
        const childPath = `${path}/${child}`;
        deleteFile(childPath, true);
      }
    }
  }
  
  fileSystem.delete(path);
  fileContents.delete(path);
  
  // 从父目录中移除
  if (fileInfo.parent) {
    const parentInfo = fileSystem.get(fileInfo.parent);
    if (parentInfo && parentInfo.children) {
      const index = parentInfo.children.indexOf(fileInfo.name);
      if (index > -1) {
        parentInfo.children.splice(index, 1);
        parentInfo.modifiedAt = Date.now();
      }
    }
  }
  
  return true;
}

// 复制文件
function copyFile(sourcePath: string, destPath: string): boolean {
  const sourceInfo = fileSystem.get(sourcePath);
  if (!sourceInfo) return false;
  
  const content = fileContents.get(sourcePath);
  createFileInfo(destPath, sourceInfo.isDirectory, content);
  return true;
}

// 移动文件
function moveFile(sourcePath: string, destPath: string): boolean {
  if (copyFile(sourcePath, destPath)) {
    return deleteFile(sourcePath);
  }
  return false;
}

export const fileStorageFunction: FunctionCall<FileStorageInput, FileStorageOutput> = {
  name: 'file-storage',
  version: '1.0.0',
  description: '提供文件上传、下载、删除、列表等操作服务',
  category: 'storage',
  tags: ['file', 'storage', 'filesystem', 'upload', 'download'],
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['upload', 'download', 'delete', 'list', 'info', 'copy', 'move', 'mkdir', 'exists', 'search'],
        description: '要执行的文件操作',
      },
      path: { type: 'string', description: '文件或目录路径' },
      content: { type: 'string', description: '文件内容' },
      destination: { type: 'string', description: '目标路径' },
      newPath: { type: 'string', description: '新路径' },
      pattern: { type: 'string', description: '搜索模式' },
      recursive: { type: 'boolean', description: '是否递归操作' },
      permissions: { type: 'string', description: '文件权限' },
      overwrite: { type: 'boolean', description: '是否覆盖现有文件' },
    },
    required: ['operation'],
  } as JSONSchema,
  outputSchema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', description: '操作是否成功' },
      error: { type: 'string', description: '错误信息' },
      result: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          fileInfo: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              size: { type: 'number' },
              type: { type: 'string' },
              createdAt: { type: 'number' },
              modifiedAt: { type: 'number' },
              permissions: { type: 'string' },
              isDirectory: { type: 'boolean' },
              parent: { type: 'string' },
              children: { type: 'array', items: { type: 'string' } },
            },
          },
          files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                path: { type: 'string' },
                size: { type: 'number' },
                type: { type: 'string' },
                createdAt: { type: 'number' },
                modifiedAt: { type: 'number' },
                permissions: { type: 'string' },
                isDirectory: { type: 'boolean' },
              },
            },
          },
          content: { type: 'string' },
          bytesTransferred: { type: 'number' },
        },
      },
      files: { type: 'array', items: { type: 'object' } },
      content: { type: 'string', description: '文件内容' },
      bytesTransferred: { type: 'number', description: '传输字节数' },
      message: { type: 'string', description: '操作消息' },
    },
    required: ['success'],
  } as JSONSchema,
  async execute(
    input: FileStorageInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<FileStorageOutput>> {
    const startTime = Date.now();
    try {
      let output: FileStorageOutput = { success: false };

      switch (input.operation) {
        case 'upload': {
          if (!input.path || input.content === undefined) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const existingFile = fileSystem.get(input.path);
          if (existingFile && !input.overwrite) {
            throw new Error('File already exists and overwrite is not enabled');
          }
          const fileInfo = createFileInfo(input.path, false, input.content);
          if (input.permissions) {
            fileInfo.permissions = input.permissions;
          }
          output = {
            success: true,
            result: {
              success: true,
              message: 'File uploaded successfully',
              fileInfo,
              bytesTransferred: fileInfo.size,
            },
          };
          break;
        }
        case 'download': {
          if (!input.path) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const fileInfo = fileSystem.get(input.path);
          if (!fileInfo || fileInfo.isDirectory) {
            throw new Error('File not found or path is a directory');
          }
          const content = fileContents.get(input.path) || '';
          output = {
            success: true,
            content,
            bytesTransferred: fileInfo.size,
            message: 'File downloaded successfully',
          };
          break;
        }
        case 'delete': {
          if (!input.path) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const deleted = deleteFile(input.path, input.recursive);
          if (!deleted) {
            throw new Error('File or directory not found');
          }
          output = {
            success: true,
            message: 'File or directory deleted successfully',
          };
          break;
        }
        case 'list': {
          if (!input.path) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const dirInfo = fileSystem.get(input.path);
          if (!dirInfo || !dirInfo.isDirectory) {
            throw new Error('Directory not found or path is not a directory');
          }
          const files: FileInfo[] = [];
          if (dirInfo.children) {
            for (const child of dirInfo.children) {
              const childPath = `${input.path}/${child}`;
              const childInfo = fileSystem.get(childPath);
              if (childInfo) {
                files.push(childInfo);
              }
            }
          }
          output = {
            success: true,
            files,
            message: `Found ${files.length} items in directory`,
          };
          break;
        }
        case 'info': {
          if (!input.path) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const fileInfo = fileSystem.get(input.path);
          if (!fileInfo) {
            throw new Error('File or directory not found');
          }
          output = {
            success: true,
            result: {
              success: true,
              message: 'File information retrieved',
              fileInfo,
            },
          };
          break;
        }
        case 'copy': {
          if (!input.path || !input.destination) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const copied = copyFile(input.path, input.destination);
          if (!copied) {
            throw new Error('Source file not found');
          }
          output = {
            success: true,
            message: 'File copied successfully',
          };
          break;
        }
        case 'move': {
          if (!input.path || !input.destination) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const moved = moveFile(input.path, input.destination);
          if (!moved) {
            throw new Error('Source file not found or move operation failed');
          }
          output = {
            success: true,
            message: 'File moved successfully',
          };
          break;
        }
        case 'mkdir': {
          if (!input.path) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const existingFile = fileSystem.get(input.path);
          if (existingFile && !input.overwrite) {
            throw new Error('Directory already exists and overwrite is not enabled');
          }
          const dirInfo = createFileInfo(input.path, true);
          if (input.permissions) {
            dirInfo.permissions = input.permissions;
          }
          output = {
            success: true,
            result: {
              success: true,
              message: 'Directory created successfully',
              fileInfo: dirInfo,
            },
          };
          break;
        }
        case 'exists': {
          if (!input.path) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const exists = fileSystem.has(input.path);
          output = {
            success: true,
            message: exists ? 'File or directory exists' : 'File or directory does not exist',
          };
          break;
        }
        case 'search': {
          if (!input.pattern) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const regex = new RegExp(input.pattern.replace(/\*/g, '.*'));
          const matchingFiles: FileInfo[] = [];
          
          for (const fileInfo of fileSystem.values()) {
            if (regex.test(fileInfo.name)) {
              matchingFiles.push(fileInfo);
            }
          }
          
          output = {
            success: true,
            files: matchingFiles,
            message: `Found ${matchingFiles.length} matching files`,
          };
          break;
        }
        default:
          throw new Error(getErrorMessage(ERROR_CODES.UNKNOWN_ERROR));
      }

      return {
        success: true,
        data: output,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  },
  validate(input: FileStorageInput) {
    const errors: string[] = [];
    
    if (['upload', 'download', 'delete', 'list', 'info', 'copy', 'move', 'mkdir', 'exists'].includes(input.operation) && !input.path) {
      errors.push('Path is required for this operation.');
    }
    if (['upload'].includes(input.operation) && input.content === undefined) {
      errors.push('Content is required for upload operation.');
    }
    if (['copy', 'move'].includes(input.operation) && !input.destination) {
      errors.push('Destination is required for copy/move operations.');
    }
    if (input.operation === 'search' && !input.pattern) {
      errors.push('Pattern is required for search operation.');
    }
    if (input.path && input.path.includes('..')) {
      errors.push('Path cannot contain parent directory references.');
    }
    
    return { valid: errors.length === 0, errors };
  },
};
