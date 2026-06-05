/**
 * Edge Breathing Light Implementation
 * 实现屏幕边缘呼吸灯效果
 */
const { BrowserWindow, screen } = require('electron');

// 存储激活的呼吸灯窗口
const activeLights = new Map();

/**
 * 创建边缘呼吸灯效果
 * @param {Object} options 配置选项
 * @param {string} options.color 呼吸灯颜色，默认 #00ff00
 * @param {number} options.duration 持续时间(ms)，默认 30000
 * @param {number} options.intensity 强度等级 1-10，默认 5
 * @returns {Promise<Object>} 包含灯光ID的对象
 */
async function activateBreathingLight(options = {}) {
  const { color = '#00ff00', duration = 30000, intensity = 5 } = options;

  // 获取屏幕尺寸
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // 计算窗口尺寸 (屏幕边界10像素宽)
  const borderWidth = Math.max(2, Math.floor(intensity / 2)); // 根据强度调整边框厚度

  // 创建四个窗口代表四条边
  const lightWindows = [];

  // 顶边
  const topWin = new BrowserWindow({
    x: 0,
    y: 0,
    width: width,
    height: borderWidth,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    focusable: false,
    skipTaskbar: true,
    backgroundColor: color,
    hasShadow: false,
    vibrancy: null,
    opacity: 0.8,
  });

  // 底边
  const bottomWin = new BrowserWindow({
    x: 0,
    y: height - borderWidth,
    width: width,
    height: borderWidth,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    focusable: false,
    skipTaskbar: true,
    backgroundColor: color,
    hasShadow: false,
    vibrancy: null,
    opacity: 0.8,
  });

  // 左边
  const leftWin = new BrowserWindow({
    x: 0,
    y: borderWidth,
    width: borderWidth,
    height: height - 2 * borderWidth,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    focusable: false,
    skipTaskbar: true,
    backgroundColor: color,
    hasShadow: false,
    vibrancy: null,
    opacity: 0.8,
  });

  // 右边
  const rightWin = new BrowserWindow({
    x: width - borderWidth,
    y: borderWidth,
    width: borderWidth,
    height: height - 2 * borderWidth,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    focusable: false,
    skipTaskbar: true,
    backgroundColor: color,
    hasShadow: false,
    vibrancy: null,
    opacity: 0.8,
  });

  const windows = [topWin, bottomWin, leftWin, rightWin];

  // 加载一个简单的发光动画HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: ${color};
            animation: breathe 1.5s ease-in-out infinite alternate;
          }
          
          @keyframes breathe {
            0% { opacity: 0.4; }
            100% { opacity: 0.9; }
          }
        </style>
      </head>
      <body></body>
    </html>
    `;

  // 设置每个窗口的内容
  for (const win of windows) {
    win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
    );
    win.setAlwaysOnTop(true, 'screen-saver');
  }

  // 创建唯一ID
  const lightId = `light_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 存储窗口引用
  activeLights.set(lightId, windows);

  // 设置自动销毁
  if (duration > 0) {
    setTimeout(() => {
      deactivateBreathingLight(lightId).catch(console.error);
    }, duration);
  }

  return { id: lightId };
}

/**
 * 关闭指定的呼吸灯
 * @param {string} lightId 灯光ID
 * @returns {Promise<void>}
 */
async function deactivateBreathingLight(lightId) {
  const windows = activeLights.get(lightId);
  if (!windows) {
    throw new Error(`Light with ID ${lightId} not found`);
  }

  // 关闭所有相关的窗口
  for (const win of windows) {
    try {
      if (!win.isDestroyed()) {
        win.close();
      }
    } catch (error) {
      console.warn(`Warning closing light window:`, error.message);
    }
  }

  // 从活动列表移除
  activeLights.delete(lightId);
}

module.exports = {
  activateBreathingLight,
  deactivateBreathingLight,
};
