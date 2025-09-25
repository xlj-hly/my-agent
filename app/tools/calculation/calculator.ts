import {
  FunctionCall,
  ExecutionContext,
  FunctionResult,
  ERROR_CODES,
  getErrorMessage,
} from '../../packages/@agent-core';

type CalcOp = 'add' | 'sub' | 'mul' | 'div';
type CalcInput = { op: CalcOp; a: number; b: number };
type CalcOutput = { result: number };

export const calculatorFunction: FunctionCall<CalcInput, CalcOutput> = {
  name: 'calculator',
  version: '1.0.0',
  description: '基础四则运算',
  category: 'calculation',
  tags: ['math', 'calculator'],
  inputSchema: {
    type: 'object',
    properties: {
      op: { type: 'string', enum: ['add', 'sub', 'mul', 'div'] },
      a: { type: 'number' },
      b: { type: 'number' },
    },
    required: ['op', 'a', 'b'],
  },
  outputSchema: {
    type: 'object',
    properties: { result: { type: 'number' } },
    required: ['result'],
  },
  validate(input: CalcInput) {
    if (!input || typeof input.a !== 'number' || typeof input.b !== 'number') {
      return { valid: false, errors: ['a、b 必须为数字'] };
    }
    if (!['add', 'sub', 'mul', 'div'].includes(input.op)) {
      return { valid: false, errors: ['不支持的操作符'] };
    }
    if (input.op === 'div' && input.b === 0) {
      return { valid: false, errors: ['除数不可为0'] };
    }
    return { valid: true };
  },
  async execute(
    input: CalcInput,
    _context?: ExecutionContext
  ): Promise<FunctionResult<CalcOutput>> {
    const v = this.validate?.(input);
    if (!v?.valid) {
      return {
        success: false,
        error: getErrorMessage(ERROR_CODES.FUNCTION_VALIDATION_ERROR),
        metadata: { errors: v?.errors },
      };
    }
    let result: number;
    switch (input.op) {
      case 'add':
        result = input.a + input.b;
        break;
      case 'sub':
        result = input.a - input.b;
        break;
      case 'mul':
        result = input.a * input.b;
        break;
      case 'div':
        result = input.a / input.b;
        break;
      default:
        return {
          success: false,
          error: getErrorMessage(ERROR_CODES.INVALID_INPUT),
        };
    }
    return { success: true, data: { result } };
  },
};

export default calculatorFunction;
