/**
 * safe-path.js - 中文路径安全模块
 *
 * 解决 MSYS2 bash 下 __dirname 中文路径乱码问题。
 * Node.js 可以正常处理中文绝对路径字符串，但 __dirname 从 CWD 推导时
 * 在 MSYS2 终端会乱码。此模块提供安全的路径解析方案。
 *
 * 用法:
 *   const sp = require('./safe-path');
 *   const projectDir = sp.resolveProjectDir(outlineJsonPath);
 *   const slidesDir = sp.resolveSlidesDir(outlineJsonPath);
 *   const imgPath = sp.resolveImage(outlineJsonPath, 'cover-bg.png');
 */

var path = require('path');
var fs = require('fs');

/**
 * 从 outline.json 的绝对路径推导项目目录
 * 这比 __dirname 安全，因为 outline.json 路径是通过 CLI 参数传入的，
 * Node.js 可以正确处理中文绝对路径字符串。
 *
 * @param {string} outlineJsonPath - outline.json 的路径（相对或绝对）
 * @returns {string} 项目目录的绝对路径
 */
function resolveProjectDir(outlineJsonPath) {
  return path.dirname(path.resolve(outlineJsonPath));
}

/**
 * 解析 slides 目录路径
 * @param {string} outlineJsonPath - outline.json 路径
 * @param {string} [subdir] - 子目录名，默认 'slides'
 * @returns {string} slides 目录绝对路径
 */
function resolveSlidesDir(outlineJsonPath, subdir) {
  subdir = subdir || 'slides';
  var dir = path.join(resolveProjectDir(outlineJsonPath), subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * 解析图片路径（安全版）
 * @param {string} outlineJsonPath - outline.json 路径
 * @param {string} imageName - 图片文件名
 * @param {string} [subdir] - 子目录名，默认 'slides'
 * @returns {string|null} 图片绝对路径，不存在返回 null
 */
function resolveImage(outlineJsonPath, imageName, subdir) {
  if (!imageName) return null;
  if (path.isAbsolute(imageName)) {
    return fs.existsSync(imageName) ? imageName : null;
  }
  var p = path.join(resolveSlidesDir(outlineJsonPath, subdir), imageName);
  return fs.existsSync(p) ? p : null;
}

/**
 * 解析输出文件路径
 * @param {string} outlineJsonPath - outline.json 路径
 * @param {string} outputName - 输出文件名
 * @returns {string} 输出文件绝对路径
 */
function resolveOutput(outlineJsonPath, outputName) {
  return path.join(resolveProjectDir(outlineJsonPath), outputName);
}

/**
 * 安全的 require pptxgenjs
 * 尝试多个路径查找 pptxgenjs，避免中文路径下 node_modules 找不到的问题
 * @returns {object} pptxgenjs 模块
 */
function requirePptxgen() {
  var tryPaths = [
    'pptxgenjs', // 全局或当前 node_modules
  ];
  for (var i = 0; i < tryPaths.length; i++) {
    try {
      return require(tryPaths[i]);
    } catch (e) {
      // continue
    }
  }
  throw new Error('pptxgenjs not found. Run: npm install pptxgenjs');
}

module.exports = {
  resolveProjectDir: resolveProjectDir,
  resolveSlidesDir: resolveSlidesDir,
  resolveImage: resolveImage,
  resolveOutput: resolveOutput,
  requirePptxgen: requirePptxgen,
};
