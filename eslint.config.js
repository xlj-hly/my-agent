import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'src/**'],
  },
  {
    files: ['app/**/*.{ts,tsx}'],   // 源码文件
    extends: [
      js.configs.recommended,
       ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      // 多Agent系统开发规则
      '@typescript-eslint/no-explicit-any': 'warn', // 允许any类型但给出警告
      '@typescript-eslint/no-unused-vars': 'warn',
      // '@typescript-eslint/explicit-function-return-type': 'off',
      // '@typescript-eslint/explicit-module-boundary-types': 'off',
      // '@typescript-eslint/no-non-null-assertion': 'warn',
      // 'prefer-const': 'error',
      // 'no-var': 'error',
      // 'no-console': 'warn',
    },
  },
  eslintConfigPrettier,
]);
