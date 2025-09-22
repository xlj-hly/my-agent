import { build, context } from 'esbuild';

const common = {
  entryPoints: ['src/cli.tsx'],
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outdir: 'dist',
  bundle: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  packages: 'external', // 外置 node_modules 依赖，仅打包源码
};

const watch = process.argv.includes('--watch');

if (watch) {
  const ctx = await context(common);
  await ctx.watch();
} else {
  await build(common);
}
