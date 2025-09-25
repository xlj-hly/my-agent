# Week 3 开发记录 - 注册机制实现

## 范围与目标（依据 ROADMAP/ARCHITECTURE/IMPLEMENTATION_GUIDE）
- 实现注册机制：PluginRegistry、FunctionRegistry、AgentRegistry。
- 实现插件加载与卸载逻辑（initialize/destroy、批量注册/卸载）。
- 严格接口优先、无后缀导入导出、ESM+ts-jest 测试链。
- 补充实现 ServiceRegistry（与架构接口一致）。

## 产出清单
- 新增实现
  - `app/registry/function-registry.ts`
  - `app/registry/plugin-registry.ts`
  - `app/registry/agent-registry.ts`
  - `app/registry/service-registry.ts`
- 新增单元测试
  - `app/tests/unit/registry/function-registry.test.ts`（8/8）
  - `app/tests/unit/registry/plugin-registry.test.ts`（5/5）
  - `app/tests/unit/registry/agent-registry.test.ts`（5/5）
  - `app/tests/unit/registry/service-registry.test.ts`（5/5）
- 全量测试：11/11 suites，108/108 tests 通过

## 关键实现要点
- FunctionRegistry：注册/注销/查询、分类与标签筛选、校验与调用（返回 FunctionResult）。
- PluginRegistry：校验与依赖检查（最小实现）、批量注册/卸载 functions/agents/services、健康状态聚合、函数调用委托。
- AgentRegistry：注册/注销/查询、按 type 与 capability 筛选、可用列表（最小实现）。
- ServiceRegistry：注册/注销/查询、健康状态聚合（服务可选 healthCheck）。
- 错误码统一使用 `@agent-core/constants/errors.ts`（如 FUNCTION_NOT_FOUND、RESOURCE_ALREADY_EXISTS 等）。
- 导入导出：统一“无后缀”，测试直接从源码入口 `app/packages/@agent-core` 导入。

## 与文档一致性
- ROADMAP Week 3 目标已完成，并补充 ServiceRegistry（架构接口已定义，属合理最小扩展）。
- 未引入文档外模块（如 workflow）。
- 严格接口优先与标准化。

## 决策与取舍
- 持久化暂不实现，采用内存 Map，保持接口异步签名，便于后续替换存储后端。
- 依赖检查与健康汇总采用最小可行策略，后续可增强。

## 下一步建议（进入 Week 4）
- 配置与工具（按 ROADMAP Week 4）：
  - 实现 `ConfigManager`（系统配置加载/切换/通知）。
  - 创建基础工具函数（按文档工具包规划的最小集合）。
  - 增补对应单测与阶段验收。
- 保持无后缀导入、错误码标准化与接口优先。


