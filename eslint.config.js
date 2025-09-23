import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'], // 源码文件
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node, // Node.js 全局变量
    },
    rules: {
      // Agent开发中的放宽规则
      '@typescript-eslint/no-explicit-any': 'off', // Agent开发中经常需要处理动态类型
      '@typescript-eslint/no-unused-vars': 'warn', // 降级为警告而不是错误
    },
  },
  // 关闭与 Prettier 冲突的 ESLint 规则（放在最后）
  eslintConfigPrettier,
]);
