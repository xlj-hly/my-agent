/**
 * 系统信息工具 - 适配新架构
 */

import { BaseTool } from '../../core/base/BaseTool.js';
import type { Result } from '../../core/types/common.js';

export class SystemInfoTool extends BaseTool {
  constructor() {
    super({
      name: 'get_system_info',
      description: '获取当前运行环境的系统信息',
      category: 'system',
      parameters: {
        type: 'object',
        properties: {
          info_type: {
            type: 'string',
            description:
              '信息类型：platform(平台), node(Node版本), memory(内存), all(全部)',
            enum: ['platform', 'node', 'memory', 'all'],
          },
        },
      },
    });
  }

  async execute(args: { info_type?: string }): Promise<Result> {
    try {
      const infoType = args.info_type || 'all';
      const info: Record<string, any> = {};

      if (infoType === 'platform' || infoType === 'all') {
        info.platform = {
          操作系统: process.platform,
          架构: process.arch,
          Node版本: process.version,
        };
      }

      if (infoType === 'node' || infoType === 'all') {
        info.node = {
          版本: process.version,
          执行路径: process.execPath,
          工作目录: process.cwd(),
        };
      }

      if (infoType === 'memory' || infoType === 'all') {
        const memUsage = process.memoryUsage();
        info.memory = {
          堆内存使用: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          堆内存总计: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          外部内存: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
          RSS: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        };
      }

      let content: string;
      if (infoType === 'all') {
        content = Object.entries(info)
          .map(([key, value]) => `${key}:\n${JSON.stringify(value, null, 2)}`)
          .join('\n\n');
      } else {
        content = JSON.stringify(info[infoType], null, 2);
      }

      return this.createResult(true, content);
    } catch (error) {
      return this.createResult(
        false,
        undefined,
        `获取系统信息失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }
}
