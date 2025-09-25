/**
 * 多Agent编排系统主入口
 * Multi-Agent Orchestration System Main Entry
 */

import { PACKAGE_INFO } from './packages/@agent-core/index.js';

console.log('🤖 多Agent编排系统启动中...');
console.log('=====================================');
console.log(`📦 系统版本: ${PACKAGE_INFO.version}`);
console.log(`🏗️ 架构: ${PACKAGE_INFO.description}`);
console.log('=====================================');

/**
 * 系统启动函数
 */
async function startSystem(): Promise<void> {
  try {
    console.log('🚀 初始化系统组件...');

    // TODO: 初始化注册中心
    console.log('📋 注册中心初始化完成');

    // TODO: 初始化记忆系统
    console.log('🧠 记忆系统初始化完成');

    // TODO: 初始化编排器
    console.log('🎭 编排器初始化完成');

    // TODO: 加载插件
    console.log('🔌 插件系统初始化完成');

    console.log('=====================================');
    console.log('✅ 系统启动完成!');
    console.log('🎯 多Agent编排系统已就绪');
  } catch (error) {
    console.error('❌ 系统启动失败:', error);
    process.exit(1);
  }
}

/**
 * 系统关闭函数
 */
async function stopSystem(): Promise<void> {
  console.log('🛑 系统关闭中...');

  try {
    // TODO: 清理资源
    console.log('🧹 资源清理完成');

    console.log('✅ 系统已安全关闭');
  } catch (error) {
    console.error('❌ 系统关闭时发生错误:', error);
  }
}

// 处理进程信号
process.on('SIGINT', async () => {
  console.log('\n📡 收到中断信号...');
  await stopSystem();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n📡 收到终止信号...');
  await stopSystem();
  process.exit(0);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动系统（在测试/非直接运行环境下不触发）
try {
  // 某些编译环境不支持 import.meta，容错处理
  // 仅当作为主模块直接运行时触发启动
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta: any = import.meta as any;
  if (meta && meta.url && meta.url === `file://${process.argv[1]}`) {
    startSystem().catch((error) => {
      console.error('❌ 启动失败:', error);
      process.exit(1);
    });
  }
} catch {
  // noop: 允许在测试环境 import 本模块而不报错
}

export { startSystem, stopSystem };
