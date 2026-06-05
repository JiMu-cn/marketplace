/**
 * Auto Desktop Skill Demo
 * 演示AI开始GUI操作时自动执行显示桌面和呼吸灯效果
 */

// 导入AutoDesktop技能
const AutoDesktopSkill = require('./index');

// 创建技能实例
const desktopSkill = new AutoDesktopSkill();

/**
 * 模拟AI开始进行GUI操作前的准备工作
 * 该函数会：
 * 1. 先执行showDesktop()最小化所有窗口
 * 2. 启动屏幕边缘呼吸灯作为状态指示
 */
async function prepareForAIInteraction() {
  console.log('🤖 AI即将开始GUI操作...');

  try {
    // 启动桌面操作流程 - 这会自动执行showDesktop()并启动呼吸灯
    const result = await desktopSkill.startDesktopOperation({
      breathingColor: '#00aaff', // 设置为蓝色，表示AI正在操作
      breathingDuration: 45000, // 持续45秒
      breathingIntensity: 7, // 较强的强度，便于识别
    });

    console.log(`✅ ${result.message}`);
    console.log(`💡 呼吸灯ID: ${result.lightId}`);

    // 获取活跃灯光信息
    const activeLights = desktopSkill.getActiveLights();
    console.log(`📊 当前活跃的灯光数量: ${activeLights.length}`);

    return result.lightId;
  } catch (error) {
    console.error('❌ 准备GUI操作环境时出错:', error.message);
    throw error;
  }
}

/**
 * 模拟AI完成GUI操作后的清理工作
 * 该函数会关闭呼吸灯
 */
async function finishAIInteraction(lightId) {
  console.log('\n🤖 AI已完成GUI操作...');

  try {
    // 结束桌面操作流程 - 关闭对应的呼吸灯
    const result = await desktopSkill.endDesktopOperation(lightId);

    console.log(`✅ ${result.message}`);

    // 检查仍有无活跃灯光
    const activeLights = desktopSkill.getActiveLights();
    console.log(`📊 剩余活跃灯光数量: ${activeLights.length}`);
  } catch (error) {
    console.error('❌ 清理GUI操作环境时出错:', error.message);
    throw error;
  }
}

/**
 * 完整的使用示例：
 * 模拟一次典型的AI GUI操作流程
 */
async function demoFullFlow() {
  console.log('🎬 开始演示Auto Desktop技能完整流程...\n');

  // 步骤1: 准备AI GUI操作环境
  const lightId = await prepareForAIInteraction();

  console.log('\n⏳ AI正在执行GUI操作...（模拟中）');

  // 等待一段时间模拟AI操作
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // 步骤2: 清理AI GUI操作环境
  await finishAIInteraction(lightId);

  console.log('\n🏁 演示完成！');
}

// 仅在直接运行此文件时执行演示
if (require.main === module) {
  demoFullFlow().catch((error) => {
    console.error('演示过程中发生错误:', error);
    process.exit(1);
  });
} else {
  // 当作为模块导入时导出示例函数
  module.exports = {
    prepareForAIInteraction,
    finishAIInteraction,
    demoFullFlow,
  };
}
