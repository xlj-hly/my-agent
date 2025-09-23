/**
 * 计算器工具 - 适配新架构
 */

import { BaseTool } from '../../core/base/BaseTool.js';
import type { Result } from '../../core/types/common.js';

export class CalculatorTool extends BaseTool {
  constructor() {
    super({
      name: 'calculator',
      description: '执行基础数学计算（支持加减乘除、幂运算、三角函数等）',
      category: 'math',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description:
              '数学表达式，如: 2+3*4, Math.sqrt(16), Math.sin(Math.PI/2)',
          },
        },
        required: ['expression'],
      },
    });
  }

  async execute(args: { expression: string }): Promise<Result> {
    try {
      const expression = args.expression.trim();

      // 安全检查：只允许数学运算和Math对象方法
      const allowedPattern =
        /^[\d+\-*/().\s,Math.sincostalogexpqrtabspowminmax]+$/;
      if (!allowedPattern.test(expression)) {
        return this.createResult(
          false,
          undefined,
          '表达式包含不安全的字符，只允许数字、基本运算符和Math函数'
        );
      }

      // 使用Function构造器安全执行
      const result = Function(`"use strict"; return (${expression})`)();

      return this.createResult(true, `${expression} = ${result}`);
    } catch (error) {
      return this.createResult(
        false,
        undefined,
        `计算失败: ${error instanceof Error ? error.message : '表达式错误'}`
      );
    }
  }
}
