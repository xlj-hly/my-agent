/**
 * File Operations 工具函数
 * 提供文件系统操作功能：文件读写、目录操作、权限检查等
 */

import { FunctionCall, FunctionResult, ExecutionContext, ValidationResult } from '../../@agent-core';
import * as fs from 'fs';
import * as path from 'path';

// 输入接口
export interface FileOperationsInput {
  filePath: string;
  operation: string;
  destinationPath?: string;
  content?: string;
  options?: {
    recursive?: boolean;
    force?: boolean;
    encoding?: string;
    searchPattern?: string;
  };
}

// 输出接口
export interface FileOperationsOutput {
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    modified: string;
    created: string;
    permissions: string;
  };
  exists?: boolean;
  files?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  created?: boolean;
  deleted?: boolean;
  copied?: boolean;
  moved?: boolean;
  permissions?: {
    readable: boolean;
    writable: boolean;
    executable: boolean;
  };
  searchResults?: Array<{
    path: string;
    type: string;
    size: number;
  }>;
  content?: string;
}

export const fileOperationsFunction: FunctionCall<FileOperationsInput, FileOperationsOutput> = {
  name: 'file-operations',
  version: '1.0.0',
  description: '执行文件系统操作，包括文件读写、目录操作、权限检查等',
  category: 'system',
  tags: ['file', 'directory', 'system', 'io'],
  
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: '文件或目录路径',
        minLength: 1,
        maxLength: 1000,
      },
      operation: {
        type: 'string',
        description: '操作类型',
        enum: ['info', 'exists', 'list', 'mkdir', 'delete', 'copy', 'move', 'permissions', 'search', 'read', 'write'],
      },
      destinationPath: {
        type: 'string',
        description: '目标路径（用于copy、move操作）',
        minLength: 1,
        maxLength: 1000,
      },
      content: {
        type: 'string',
        description: '文件内容（用于write操作）',
        maxLength: 1000000,
      },
      options: {
        type: 'object',
        properties: {
          recursive: { type: 'boolean', default: false },
          force: { type: 'boolean', default: false },
          encoding: { type: 'string', default: 'utf8' },
          searchPattern: { type: 'string', description: '搜索模式（如 *.txt）' },
        },
        description: '操作选项',
      },
    },
    required: ['filePath', 'operation'],
  },
  
  outputSchema: {
    type: 'object',
    properties: {
      fileInfo: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          size: { type: 'number' },
          type: { type: 'string' },
          modified: { type: 'string' },
          created: { type: 'string' },
          permissions: { type: 'string' },
        },
        description: '文件信息',
      },
      exists: { type: 'boolean', description: '文件是否存在' },
      files: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            size: { type: 'number' },
          },
        },
        description: '文件列表',
      },
      created: { type: 'boolean', description: '是否创建成功' },
      deleted: { type: 'boolean', description: '是否删除成功' },
      copied: { type: 'boolean', description: '是否复制成功' },
      moved: { type: 'boolean', description: '是否移动成功' },
      permissions: {
        type: 'object',
        properties: {
          readable: { type: 'boolean' },
          writable: { type: 'boolean' },
          executable: { type: 'boolean' },
        },
        description: '权限信息',
      },
      searchResults: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            type: { type: 'string' },
            size: { type: 'number' },
          },
        },
        description: '搜索结果',
      },
      content: { type: 'string', description: '文件内容' },
    },
  },
  
  validate: (input: FileOperationsInput): ValidationResult => {
    const errors: string[] = [];
    
    if (!input.filePath || typeof input.filePath !== 'string') {
      errors.push('文件路径是必需的且必须是字符串');
    } else if (input.filePath.trim().length === 0) {
      errors.push('文件路径不能为空');
    } else if (input.filePath.length > 1000) {
      errors.push('文件路径长度不能超过1000字符');
    } else if (isPathTraversal(input.filePath)) {
      errors.push('不允许路径遍历攻击');
    }
    
    if (!input.operation || typeof input.operation !== 'string') {
      errors.push('操作类型是必需的且必须是字符串');
    } else if (!['info', 'exists', 'list', 'mkdir', 'delete', 'copy', 'move', 'permissions', 'search', 'read', 'write'].includes(input.operation)) {
      errors.push('不支持的操作类型');
    }
    
    // 特定操作的验证
    if (['copy', 'move'].includes(input.operation)) {
      if (!input.destinationPath) {
        errors.push(`${input.operation}操作需要目标路径`);
      } else if (isPathTraversal(input.destinationPath)) {
        errors.push('不允许目标路径遍历攻击');
      }
    }
    
    if (input.operation === 'write') {
      if (!input.content) {
        errors.push('write操作需要文件内容');
      } else if (input.content.length > 1000000) {
        errors.push('文件内容不能超过1000000字符');
      }
    }
    
    if (input.options?.encoding && !['utf8', 'utf16le', 'latin1', 'base64', 'hex', 'ascii'].includes(input.options.encoding)) {
      errors.push('不支持的编码格式');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  execute: async (
    input: FileOperationsInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<FileOperationsOutput>> => {
    const startTime = Date.now();
    
    try {
      // 验证输入
      if (fileOperationsFunction.validate) {
        const validation = fileOperationsFunction.validate(input);
        if (!validation.valid) {
          return {
            success: false,
            error: '输入验证失败',
            metadata: { errors: validation.errors },
            executionTime: Date.now() - startTime,
          };
        }
      }
      
      // 执行文件操作
      const result = await performFileOperation(input);
      
      return {
        success: true,
        data: result,
        metadata: {
          operation: input.operation,
          filePath: input.filePath,
          destinationPath: input.destinationPath,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: `文件操作失败: ${error.message}`,
        metadata: {
          operation: input.operation,
          filePath: input.filePath,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  },
};

/**
 * 执行文件操作
 */
async function performFileOperation(input: FileOperationsInput): Promise<FileOperationsOutput> {
  const { filePath, operation, destinationPath, content, options } = input;
  
  switch (operation) {
    case 'info':
      return getFileInfo(filePath);
      
    case 'exists':
      return { exists: fs.existsSync(filePath) };
      
    case 'list':
      return listDirectory(filePath, options?.recursive || false);
      
    case 'mkdir':
      return createDirectory(filePath, options?.recursive || false);
      
    case 'delete':
      return deleteFileOrDirectory(filePath, options?.force || false);
      
    case 'copy':
      if (!destinationPath) throw new Error('目标路径是必需的');
      return copyFile(filePath, destinationPath);
      
    case 'move':
      if (!destinationPath) throw new Error('目标路径是必需的');
      return moveFile(filePath, destinationPath);
      
    case 'permissions':
      return getPermissions(filePath);
      
    case 'search':
      return searchFiles(filePath, options?.searchPattern || '*', options?.recursive || false);
      
    case 'read':
      return readFile(filePath, (options?.encoding || 'utf8') as BufferEncoding);
      
    case 'write':
      if (!content) throw new Error('文件内容是必需的');
      return writeFile(filePath, content, (options?.encoding || 'utf8') as BufferEncoding);
      
    default:
      throw new Error(`不支持的操作: ${operation}`);
  }
}

/**
 * 获取文件信息
 */
function getFileInfo(filePath: string): FileOperationsOutput {
  const stats = fs.statSync(filePath);
  
  return {
    fileInfo: {
      name: path.basename(filePath),
      size: stats.size,
      type: stats.isDirectory() ? 'directory' : 'file',
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString(),
      permissions: stats.mode.toString(8),
    },
  };
}

/**
 * 列出目录内容
 */
function listDirectory(dirPath: string, recursive: boolean): FileOperationsOutput {
  const files: Array<{ name: string; type: string; size: number }> = [];
  
  function scanDir(currentPath: string, depth: number = 0) {
    if (depth > 10) return; // 防止无限递归
    
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);
      
      files.push({
        name: item,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
      });
      
      if (recursive && stats.isDirectory()) {
        scanDir(itemPath, depth + 1);
      }
    }
  }
  
  scanDir(dirPath);
  return { files };
}

/**
 * 创建目录
 */
function createDirectory(dirPath: string, recursive: boolean): FileOperationsOutput {
  if (fs.existsSync(dirPath)) {
    return { created: false };
  }
  
  if (recursive) {
    fs.mkdirSync(dirPath, { recursive: true });
  } else {
    fs.mkdirSync(dirPath);
  }
  
  return { created: true };
}

/**
 * 删除文件或目录
 */
function deleteFileOrDirectory(filePath: string, force: boolean): FileOperationsOutput {
  if (!fs.existsSync(filePath)) {
    return { deleted: false };
  }
  
  const stats = fs.statSync(filePath);
  
  if (stats.isDirectory()) {
    if (force) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.rmdirSync(filePath);
    }
  } else {
    fs.unlinkSync(filePath);
  }
  
  return { deleted: true };
}

/**
 * 复制文件
 */
function copyFile(sourcePath: string, destinationPath: string): FileOperationsOutput {
  fs.copyFileSync(sourcePath, destinationPath);
  return { copied: true };
}

/**
 * 移动文件
 */
function moveFile(sourcePath: string, destinationPath: string): FileOperationsOutput {
  fs.renameSync(sourcePath, destinationPath);
  return { moved: true };
}

/**
 * 获取权限信息
 */
function getPermissions(filePath: string): FileOperationsOutput {
  const stats = fs.statSync(filePath);
  const mode = stats.mode;
  
  return {
    permissions: {
      readable: (mode & parseInt('444', 8)) !== 0,
      writable: (mode & parseInt('222', 8)) !== 0,
      executable: (mode & parseInt('111', 8)) !== 0,
    },
  };
}

/**
 * 搜索文件
 */
function searchFiles(dirPath: string, pattern: string, recursive: boolean): FileOperationsOutput {
  const results: Array<{ path: string; type: string; size: number }> = [];
  
  function searchDir(currentPath: string, depth: number = 0) {
    if (depth > 10) return; // 防止无限递归
    
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);
      
      // 简化的模式匹配
      if (matchPattern(item, pattern)) {
        results.push({
          path: itemPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
        });
      }
      
      if (recursive && stats.isDirectory()) {
        searchDir(itemPath, depth + 1);
      }
    }
  }
  
  searchDir(dirPath);
  return { searchResults: results };
}

/**
 * 读取文件
 */
function readFile(filePath: string, encoding: BufferEncoding): FileOperationsOutput {
  const content = fs.readFileSync(filePath, encoding);
  return { content };
}

/**
 * 写入文件
 */
function writeFile(filePath: string, content: string, encoding: BufferEncoding): FileOperationsOutput {
  fs.writeFileSync(filePath, content, encoding);
  return { created: true };
}

/**
 * 检查路径遍历攻击
 */
function isPathTraversal(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  return normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.includes('\\');
}

/**
 * 简化的模式匹配
 */
function matchPattern(filename: string, pattern: string): boolean {
  if (pattern === '*') return true;
  
  // 简单的通配符匹配
  const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
  return regex.test(filename);
}
