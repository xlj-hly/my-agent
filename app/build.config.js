/**
 * 多Agent编排系统构建配置
 * 用于构建整个系统和各个包
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// 构建配置
const BUILD_CONFIG = {
  // 包构建顺序（依赖关系）
  packages: ['@agent-core', '@agent-tools', '@agent-services', '@agent-agents'],

  // 构建选项
  options: {
    clean: true,
    parallel: false,
    verbose: true,
    sourceMap: true,
    declaration: true,
  },
};

/**
 * 构建单个包
 */
function buildPackage(packageName) {
  console.log(`🔨 构建包: ${packageName}`);

  const packagePath = join('packages', packageName);
  const packageJsonPath = join(packagePath, 'package.json');

  try {
    // 检查包是否存在
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    // 执行构建命令
    execSync('npm run build', {
      cwd: packagePath,
      stdio: 'inherit',
    });

    console.log(`✅ 包构建完成: ${packageName}`);
  } catch (error) {
    console.error(`❌ 包构建失败: ${packageName}`, error.message);
    throw error;
  }
}

/**
 * 清理构建输出
 */
function cleanBuild() {
  console.log('🧹 清理构建输出...');

  try {
    execSync('npm run clean', { stdio: 'inherit' });
    console.log('✅ 清理完成');
  } catch (error) {
    console.warn('⚠️ 清理命令失败:', error.message);
  }
}

/**
 * 构建所有包
 */
function buildAllPackages() {
  console.log('🚀 开始构建所有包...');

  for (const packageName of BUILD_CONFIG.packages) {
    buildPackage(packageName);
  }

  console.log('🎉 所有包构建完成!');
}

/**
 * 主构建函数
 */
function build() {
  console.log('🏗️ 多Agent编排系统构建开始');
  console.log('=====================================');

  try {
    // 清理
    if (BUILD_CONFIG.options.clean) {
      cleanBuild();
    }

    // 构建包
    buildAllPackages();

    // 构建主应用
    console.log('🔨 构建主应用...');
    execSync('tsc -p app/tsconfig.json', { stdio: 'inherit' });
    console.log('✅ 主应用构建完成');

    console.log('=====================================');
    console.log('🎉 构建完成!');
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}

export { build, buildPackage, buildAllPackages, cleanBuild };
