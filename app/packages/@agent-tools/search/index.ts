/**
 * Search 工具函数包导出
 * 提供各种搜索功能的基础工具函数
 */

// 导入搜索工具函数
import { webSearchFunction } from './web-search';
import { vectorSearchFunction } from './vector-search';
import { semanticSearchFunction } from './semantic-search';

// 导出搜索工具函数
export { webSearchFunction } from './web-search';
export { vectorSearchFunction } from './vector-search';
export { semanticSearchFunction } from './semantic-search';

// 导出类型定义
export type { WebSearchInput, WebSearchResult } from './web-search';
export type { VectorSearchInput, VectorSearchResult } from './vector-search';
export type { SemanticSearchInput, SemanticSearchResult } from './semantic-search';

// 导出搜索工具集合
export const searchTools = [
  webSearchFunction,
  vectorSearchFunction,
  semanticSearchFunction,
];

// 包信息
export const SEARCH_TOOLS_VERSION = '1.0.0';
export const SEARCH_TOOLS_DESCRIPTION = '搜索工具函数包 - 提供网络搜索、向量搜索、语义搜索等功能';
