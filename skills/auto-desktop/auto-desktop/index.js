/**
 * Auto Desktop Skill - Main Module
 * 主技能接口文件
 */

const { showDesktop, restoreWindows } = require('./show-desktop');
const {
  activateBreathingLight,
  deactivateBreathingLight,
} = require('./breathing-light');

/**
 * AutoDesktop技能类
 * 提供自动化桌面操作功能
 */
class AutoDesktopSkill {
  constructor() {
    this.activeLights = new Map();
  }

  /**
   * 开始桌面操作 - 自动显示桌面并激活呼吸灯
   * @param {Object} options 操作选项
   * @param {string} options.breathingColor 呼吸灯颜色
   * @param {number} options.breathingDuration 呼吸灯持续时间(毫秒)
   * @param {number} options.breathingIntensity 呼吸灯强度
   * @returns {Promise<Object>} 包含lightId的结果对象
   */
  async startDesktopOperation(options = {}) {
    try {
      // 首先显示桌面，将所有窗口最小化
      console.log('开始桌面操作流程...');
      await showDesktop();

      // 然后激活呼吸灯效果
      const lightingOptions = {
        color: options.breathingColor || '#00ff00',
        duration: options.breathingDuration || 60000, // 默认持续1分钟
        intensity: options.breathingIntensity || 5,
      };

      const lightResult = await activateBreathingLight(lightingOptions);

      // 保存活动灯光引用
      this.activeLights.set(lightResult.id, {
        startedAt: Date.now(),
        options: lightingOptions,
      });

      console.log(`桌面操作启动成功，激活呼吸灯(id: ${lightResult.id})`);

      return {
        success: true,
        lightId: lightResult.id,
        message: '桌面操作流程已启动',
      };
    } catch (error) {
      console.error('启动桌面操作失败:', error);
      throw error;
    }
  }

  /**
   * 结束桌面操作 - 关闭呼吸灯
   * @param {string} lightId 特定的灯光ID
   * @returns {Promise<Object>} 操作结果
   */
  async endDesktopOperation(lightId) {
    try {
      if (!lightId) {
        // 如果没有指定ID，则关闭所有的活跃灯光
        const promises = [];
        for (const id of this.activeLights.keys()) {
          promises.push(this._deactivateLight(id));
        }

        await Promise.all(promises);

        return {
          success: true,
          message: `${promises.length}个活跃的呼吸灯已关闭`,
        };
      } else {
        // 关闭特定灯光
        await this._deactivateLight(lightId);

        return {
          success: true,
          message: `呼吸灯(id: ${lightId})已关闭`,
        };
      }
    } catch (error) {
      console.error('结束桌面操作失败:', error);
      throw error;
    }
  }

  /**
   * 内部方法：停用灯光
   * @param {string} lightId 灯光ID
   * @private
   */
  async _deactivateLight(lightId) {
    try {
      await deactivateBreathingLight(lightId);
    } finally {
      this.activeLights.delete(lightId);
    }
  }

  /**
   * 单独显示桌面功能
   * @returns {Promise<Object>} 操作结果
   */
  async showDesktopOnly() {
    try {
      await showDesktop();

      return {
        success: true,
        message: '桌面已显示',
      };
    } catch (error) {
      console.error('显示桌面失败:', error);
      throw error;
    }
  }

  /**
   * 单独激活呼吸灯功能
   * @param {Object} options 呼吸灯选项
   * @returns {Promise<Object>} 包含lightId的结果对象
   */
  async activateBreathingLightOnly(options = {}) {
    try {
      const lightingOptions = {
        color: options.color || '#00ff00',
        duration: options.duration || 30000,
        intensity: options.intensity || 5,
      };

      const lightResult = await activateBreathingLight(lightingOptions);

      // 保存活动灯光引用
      this.activeLights.set(lightResult.id, {
        startedAt: Date.now(),
        options: lightingOptions,
      });

      return {
        success: true,
        lightId: lightResult.id,
      };
    } catch (error) {
      console.error('激活呼吸灯失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前活跃的灯光信息
   * @returns {Array<Object>} 活跃灯光数组
   */
  getActiveLights() {
    const lights = [];

    for (const [id, info] of this.activeLights.entries()) {
      lights.push({
        id,
        startedAt: info.startedAt,
        duration: info.options.duration,
        color: info.options.color,
        intensity: info.options.intensity,
      });
    }

    return lights;
  }
}

module.exports = AutoDesktopSkill;
