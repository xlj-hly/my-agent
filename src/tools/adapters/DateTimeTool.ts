/**
 * 日期时间工具 - 适配新架构
 */

import { BaseTool } from '../../core/base/BaseTool.js';
import type { Result } from '../../core/types/common.js';

export class DateTimeTool extends BaseTool {
  constructor() {
    super({
      name: 'get_current_datetime',
      description: '获取当前的日期、时间和星期信息',
      category: 'system',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            description: '返回格式：full(完整), date(仅日期), time(仅时间)',
            enum: ['full', 'date', 'time'],
          },
        },
      },
    });
  }

  async execute(args: { format?: string }): Promise<Result> {
    try {
      const now = new Date();
      const format = args.format || 'full';

      // 中文星期映射
      const weekdays = [
        '星期日',
        '星期一',
        '星期二',
        '星期三',
        '星期四',
        '星期五',
        '星期六',
      ];
      const weekday = weekdays[now.getDay()];

      // 格式化日期
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      let content: string;

      switch (format) {
        case 'date':
          content = `${year}年${month}月${day}日 ${weekday}`;
          break;
        case 'time':
          content = `${hours}:${minutes}:${seconds}`;
          break;
        case 'full':
        default:
          content = `${year}年${month}月${day}日 ${weekday} ${hours}:${minutes}:${seconds}`;
          break;
      }

      return this.createResult(true, content);
    } catch (error) {
      return this.createResult(
        false,
        undefined,
        `获取时间失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }
}
