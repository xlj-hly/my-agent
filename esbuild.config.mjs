import { build, context } from 'esbuild';

// CLI应用配置 - 优化后
const cliConfig = {
  entryPoints: ['src/cli.tsx'],
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outdir: 'dist',
  bundle: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  packages: 'external', // 外置 node_modules 依赖，仅打包源码
  minify: true, // 启用代码压缩
  treeShaking: true, // 启用tree shaking
};

// MCP服务器配置 - 优化后
const mcpConfig = {
  entryPoints: ['src/mcp/main.ts'],
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outdir: 'dist/mcp',
  bundle: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  packages: 'external',
  minify: true, // 启用代码压缩
  treeShaking: true, // 启用tree shaking
};

// 测试脚本配置（暂时移除，需要重新实现）
// const testConfig = { ... };

// 新架构工具配置 - 应用型项目启用打包
const toolsConfig = {
  entryPoints: ['src/tools/index.ts'], // 统一入口点，其他工具通过index.ts导出
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outdir: 'dist/tools',
  bundle: true, // 启用打包，提升性能
  sourcemap: true,
  packages: 'external', // 保持external，因为是Node.js应用
  minify: true, // 启用代码压缩
};

// 核心模块配置 - 应用型项目启用打包
const coreConfig = {
  entryPoints: {
    'types': 'src/core/types/common.ts',
    'interfaces': 'src/core/interfaces/IAgent.ts', // IAgent作为统一接口入口
    'base': 'src/core/base/BaseTool.ts', // BaseTool作为统一基类入口
  },
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outdir: 'dist/core',
  bundle: true, // 启用打包
  sourcemap: true,
  packages: 'external',
  minify: true,
  splitting: true, // 启用代码分割，优化重复代码
};

// 服务模块配置 - 应用型项目启用打包
const servicesConfig = {
  entryPoints: {
    'agentService': 'src/services/AgentCore.ts', // AgentCore作为主要服务入口
    'services': 'src/services/ModelService.ts', // 其他服务可以通过AgentCore访问
  },
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outdir: 'dist/services',
  bundle: true, // 启用打包
  sourcemap: true,
  packages: 'external',
  minify: true,
  splitting: true,
};

// 适配器配置 - 应用型项目启用打包
const adaptersConfig = {
  entryPoints: {
    'CLIAdapter': 'src/adapters/CLIAdapter.ts',
    'MCPAdapter': 'src/adapters/MCPAdapter.ts',
  },
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outdir: 'dist/adapters',
  bundle: true, // 启用打包
  sourcemap: true,
  packages: 'external',
  minify: true,
  splitting: true,
};

const watch = process.argv.includes('--watch');

if (watch) {
  console.log('启动监听模式，构建所有组件...');
  const contexts = await Promise.all([
    context(cliConfig),
    context(mcpConfig),
    context(coreConfig),
    context(servicesConfig),
    context(adaptersConfig),
    context(toolsConfig),
  ]);

  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log('监听模式启动成功');
} else {
  console.log('构建所有组件...');
  await Promise.all([
    build(cliConfig),
    build(mcpConfig),
    build(coreConfig),
    build(servicesConfig),
    build(adaptersConfig),
    build(toolsConfig),
  ]);
  console.log('构建完成');
}
