import { FunctionCall, FunctionResult, ExecutionContext } from '../../@agent-core';
import { JSONSchema } from '../../@agent-core/interfaces/function.interface';
import { ERROR_CODES, getErrorMessage } from '../../@agent-core/constants/errors';

// 数据库连接配置接口
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  connectionTimeout?: number;
  maxConnections?: number;
}

// 查询结果接口
export interface QueryResult {
  rows: Record<string, any>[];
  rowCount: number;
  fields: string[];
  executionTime: number;
}

// 数据库操作输入接口
export interface DatabaseClientInput {
  operation: string;
  config?: DatabaseConfig;
  query?: string;
  params?: Record<string, any>;
  table?: string;
  data?: Record<string, any>;
  where?: Record<string, any>;
  connectionId?: string;
}

// 数据库操作输出接口
export interface DatabaseClientOutput {
  success: boolean;
  error?: string;
  result?: QueryResult;
  connectionId?: string;
  message?: string;
  affectedRows?: number;
  lastInsertId?: string;
}

// 模拟内存数据库存储
const databaseStore = new Map<string, Record<string, any>[]>(); // tableName -> rows[]
const connections = new Map<string, { config: DatabaseConfig; connected: boolean }>();
let connectionIdCounter = 0;

// 模拟SQL查询解析和执行
function parseAndExecuteSQL(query: string, params: Record<string, any>, tableName: string): QueryResult {
  const startTime = Date.now();
  const upperQuery = query.toUpperCase().trim();
  
  let rows: Record<string, any>[] = [];
  let rowCount = 0;
  let fields: string[] = [];
  
  if (upperQuery.startsWith('SELECT')) {
    // 模拟SELECT查询
    const tableData = databaseStore.get(tableName) || [];
    let filteredData = [...tableData];
    
    // 简单的WHERE条件过滤
    if (params && Object.keys(params).length > 0) {
      filteredData = tableData.filter((row: Record<string, any>) => {
        return Object.entries(params).every(([key, value]) => row[key] === value);
      });
    }
    
    rows = filteredData;
    rowCount = rows.length;
    if (rows.length > 0) {
      fields = Object.keys(rows[0]);
    }
  } else if (upperQuery.startsWith('INSERT')) {
    // 模拟INSERT操作
    const newRow = { ...params, id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` };
    const tableData = databaseStore.get(tableName) || [];
    tableData.push(newRow);
    databaseStore.set(tableName, tableData);
    rows = [newRow];
    rowCount = 1;
    fields = Object.keys(newRow);
  } else if (upperQuery.startsWith('UPDATE')) {
    // 模拟UPDATE操作
    const tableData = databaseStore.get(tableName) || [];
    let updated = 0;
    for (let i = 0; i < tableData.length; i++) {
      if (tableData[i].id === params.id) {
        tableData[i] = { ...tableData[i], ...params };
        updated++;
      }
    }
    rowCount = updated;
    fields = Object.keys(params);
  } else if (upperQuery.startsWith('DELETE')) {
    // 模拟DELETE操作
    const tableData = databaseStore.get(tableName) || [];
    const filteredData = tableData.filter((row: Record<string, any>) => row.id !== params.id);
    rowCount = tableData.length - filteredData.length;
    databaseStore.set(tableName, filteredData);
    fields = [];
  }
  
  return {
    rows,
    rowCount,
    fields,
    executionTime: Date.now() - startTime,
  };
}

export const databaseClientFunction: FunctionCall<DatabaseClientInput, DatabaseClientOutput> = {
  name: 'database-client',
  version: '1.0.0',
  description: '提供数据库连接、查询、事务等操作服务',
  category: 'storage',
  tags: ['database', 'sql', 'storage', 'persistence'],
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['connect', 'disconnect', 'query', 'insert', 'update', 'delete', 'transaction', 'status'],
        description: '要执行的数据库操作',
      },
      config: {
        type: 'object',
        properties: {
          host: { type: 'string', description: '数据库主机地址' },
          port: { type: 'number', description: '数据库端口' },
          database: { type: 'string', description: '数据库名称' },
          username: { type: 'string', description: '用户名' },
          password: { type: 'string', description: '密码' },
          connectionTimeout: { type: 'number', description: '连接超时时间(毫秒)' },
          maxConnections: { type: 'number', description: '最大连接数' },
        },
        required: ['host', 'port', 'database', 'username', 'password'],
      },
      query: { type: 'string', description: 'SQL查询语句' },
      params: { type: 'object', description: '查询参数' },
      table: { type: 'string', description: '表名' },
      data: { type: 'object', description: '要插入或更新的数据' },
      where: { type: 'object', description: 'WHERE条件' },
      connectionId: { type: 'string', description: '连接ID' },
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
          rows: { type: 'array', items: { type: 'object' } },
          rowCount: { type: 'number' },
          fields: { type: 'array', items: { type: 'string' } },
          executionTime: { type: 'number' },
        },
      },
      connectionId: { type: 'string', description: '连接ID' },
      message: { type: 'string', description: '操作消息' },
      affectedRows: { type: 'number', description: '受影响的行数' },
      lastInsertId: { type: 'string', description: '最后插入的ID' },
    },
    required: ['success'],
  } as JSONSchema,
  async execute(
    input: DatabaseClientInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<DatabaseClientOutput>> {
    const startTime = Date.now();
    try {
      let output: DatabaseClientOutput = { success: false };

      switch (input.operation) {
        case 'connect': {
          if (!input.config) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const connectionId = `conn_${++connectionIdCounter}_${Date.now()}`;
          connections.set(connectionId, { config: input.config, connected: true });
          output = {
            success: true,
            connectionId,
            message: 'Database connected successfully',
          };
          break;
        }
        case 'disconnect': {
          if (!input.connectionId) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          if (connections.delete(input.connectionId)) {
            output = { success: true, message: 'Database disconnected successfully' };
          } else {
            output = { success: false, error: 'Connection not found' };
          }
          break;
        }
        case 'query': {
          if (!input.connectionId || !input.query || !input.table) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const connection = connections.get(input.connectionId);
          if (!connection || !connection.connected) {
            throw new Error('Database connection not established');
          }
          const result = parseAndExecuteSQL(input.query, input.params || {}, input.table);
          output = {
            success: true,
            result,
            message: 'Query executed successfully',
          };
          break;
        }
        case 'insert': {
          if (!input.connectionId || !input.table || !input.data) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const connection = connections.get(input.connectionId);
          if (!connection || !connection.connected) {
            throw new Error('Database connection not established');
          }
          const result = parseAndExecuteSQL('INSERT', input.data, input.table);
          output = {
            success: true,
            result,
            affectedRows: result.rowCount,
            lastInsertId: result.rows[0]?.id,
            message: 'Data inserted successfully',
          };
          break;
        }
        case 'update': {
          if (!input.connectionId || !input.table || !input.data || !input.where) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const connection = connections.get(input.connectionId);
          if (!connection || !connection.connected) {
            throw new Error('Database connection not established');
          }
          const updateData = { ...input.data, ...input.where };
          const result = parseAndExecuteSQL('UPDATE', updateData, input.table);
          output = {
            success: true,
            result,
            affectedRows: result.rowCount,
            message: 'Data updated successfully',
          };
          break;
        }
        case 'delete': {
          if (!input.connectionId || !input.table || !input.where) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const connection = connections.get(input.connectionId);
          if (!connection || !connection.connected) {
            throw new Error('Database connection not established');
          }
          const result = parseAndExecuteSQL('DELETE', input.where, input.table);
          output = {
            success: true,
            result,
            affectedRows: result.rowCount,
            message: 'Data deleted successfully',
          };
          break;
        }
        case 'transaction': {
          if (!input.connectionId) {
            throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
          }
          const connection = connections.get(input.connectionId);
          if (!connection || !connection.connected) {
            throw new Error('Database connection not established');
          }
          output = {
            success: true,
            message: 'Transaction started successfully',
          };
          break;
        }
        case 'status': {
          const totalConnections = connections.size;
          const activeConnections = Array.from(connections.values()).filter(conn => conn.connected).length;
          output = {
            success: true,
            message: `Database status: ${activeConnections}/${totalConnections} connections active`,
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
  validate(input: DatabaseClientInput) {
    const errors: string[] = [];
    
    if (['connect'].includes(input.operation) && !input.config) {
      errors.push('Config is required for connect operation.');
    }
    if (['disconnect', 'query', 'insert', 'update', 'delete', 'transaction'].includes(input.operation) && !input.connectionId) {
      errors.push('Connection ID is required for this operation.');
    }
    if (['query', 'insert', 'update', 'delete'].includes(input.operation) && !input.table) {
      errors.push('Table name is required for this operation.');
    }
    if (input.operation === 'query' && !input.query) {
      errors.push('Query is required for query operation.');
    }
    if (['insert', 'update'].includes(input.operation) && !input.data) {
      errors.push('Data is required for insert/update operations.');
    }
    if (['update', 'delete'].includes(input.operation) && !input.where) {
      errors.push('Where conditions are required for update/delete operations.');
    }
    
    return { valid: errors.length === 0, errors };
  },
};
