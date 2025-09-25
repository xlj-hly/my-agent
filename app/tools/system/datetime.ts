import {
  FunctionCall,
  ExecutionContext,
  FunctionResult,
} from '../../packages/@agent-core';

type DateTimeInput = { timezone?: string };
type DateTimeOutput = { nowIso: string; timestamp: number; timezone: string };

export const datetimeFunction: FunctionCall<DateTimeInput, DateTimeOutput> = {
  name: 'datetime-now',
  version: '1.0.0',
  description: '获取当前时间（ISO字符串与时间戳）',
  category: 'system',
  tags: ['datetime', 'system', 'utility'],
  inputSchema: {
    type: 'object',
    properties: {
      timezone: { type: 'string', description: '时区标识，仅作记录' },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      nowIso: { type: 'string' },
      timestamp: { type: 'number' },
      timezone: { type: 'string' },
    },
    required: ['nowIso', 'timestamp', 'timezone'],
  },
  async execute(
    input: DateTimeInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<DateTimeOutput>> {
    const now = new Date();
    const tz =
      input?.timezone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone ??
      'UTC';
    return {
      success: true,
      data: {
        nowIso: now.toISOString(),
        timestamp: now.getTime(),
        timezone: tz,
      },
      metadata: { source: 'datetime-now' },
    };
  },
};

export default datetimeFunction;
