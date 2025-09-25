/**
 * FunctionRegistry 内存实现（Week 3）
 * 严格遵循 @agent-core/interfaces/registry.interface.ts
 */

import {
  FunctionCall,
  ExecutionContext,
  FunctionResult,
  IFunctionRegistry,
  ERROR_CODES,
  getErrorMessage,
} from '../packages/@agent-core';

export class FunctionRegistry implements IFunctionRegistry {
  private readonly nameToFunction: Map<string, FunctionCall> = new Map();

  async registerFunction(func: FunctionCall): Promise<void> {
    const name = func?.name;
    if (!name) {
      throw new Error(getErrorMessage(ERROR_CODES.INVALID_INPUT));
    }
    if (this.nameToFunction.has(name)) {
      throw new Error(getErrorMessage(ERROR_CODES.RESOURCE_ALREADY_EXISTS));
    }
    this.nameToFunction.set(name, func);
  }

  async unregisterFunction(functionName: string): Promise<void> {
    if (!this.nameToFunction.has(functionName)) {
      // 函数未找到
      throw new Error(getErrorMessage(ERROR_CODES.FUNCTION_NOT_FOUND));
    }
    this.nameToFunction.delete(functionName);
  }

  getFunction(functionName: string): FunctionCall | undefined {
    return this.nameToFunction.get(functionName);
  }

  getAllFunctions(): FunctionCall[] {
    return Array.from(this.nameToFunction.values());
  }

  getFunctionsByCategory(category: string): FunctionCall[] {
    return Array.from(this.nameToFunction.values()).filter(
      (f) => f.category === category
    );
  }

  getFunctionsByTag(tag: string): FunctionCall[] {
    return Array.from(this.nameToFunction.values()).filter((f) =>
      Array.isArray(f.tags) ? f.tags.includes(tag) : false
    );
  }

  async callFunction<TInput, TOutput>(
    functionName: string,
    input: TInput,
    context?: ExecutionContext
  ): Promise<FunctionResult<TOutput>> {
    const fn = this.nameToFunction.get(functionName);
    if (!fn) {
      return {
        success: false,
        error: getErrorMessage(ERROR_CODES.FUNCTION_NOT_FOUND),
      } as FunctionResult<TOutput>;
    }

    // 可选输入校验
    if (typeof fn.validate === 'function') {
      const validation = fn.validate(input as any);
      if (!validation?.valid) {
        return {
          success: false,
          error: getErrorMessage(ERROR_CODES.FUNCTION_VALIDATION_ERROR),
          metadata: {
            errors: validation?.errors,
            warnings: validation?.warnings,
          },
        } as FunctionResult<TOutput>;
      }
    }

    try {
      return await fn.execute(input as any, context);
    } catch (err: any) {
      return {
        success: false,
        error: getErrorMessage(ERROR_CODES.FUNCTION_EXECUTION_ERROR),
        metadata: { cause: String(err?.message ?? err) },
      } as FunctionResult<TOutput>;
    }
  }

  isRegistered(functionName: string): boolean {
    return this.nameToFunction.has(functionName);
  }
}

export default FunctionRegistry;
