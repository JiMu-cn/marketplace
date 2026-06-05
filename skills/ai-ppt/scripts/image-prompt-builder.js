/**
 * image-prompt-builder.js - 图片生成 Prompt 构建器
 *
 * 将规则 14（封面图禁止包含主题文字）和风格系统编码为可调用函数。
 * AI 调用 jimu_image_generation 前，先用此模块构建 prompt。
 *
 * 用法:
 *   const ipb = require('./image-prompt-builder');
 *   const prompt = ipb.buildCoverPrompt('绿色经济', { style: 'gradient-glass' });
 *   // → "Dark cinematic background, renewable energy landscape..."
 *   //   绝不包含 "绿色经济" 这几个字
 */

var fs = require('fs');
var path = require('path');

// ============================================================
// 主题 → 视觉关键词映射
// ============================================================

var TOPIC_VISUALS = {
  // 金融/贵金属
  '金': 'gold bars, vault, financial charts, luxury metallic textures',
  '贵金属': 'gold ingots, silver coins, precious metals on dark velvet',
  '黄金': 'gold bars stacked, golden light rays, luxury dark background',
  '金融': 'stock market charts, financial district skyline, glass buildings',
  '投资': 'growth charts, coins stacking, upward arrows, wealth symbols',
  '股票': 'candlestick charts, trading screens, stock exchange floor',
  '银行': 'bank vault, marble columns, financial institution interior',

  // 科技/加密
  '比特币': 'digital coins, blockchain network nodes, circuit board patterns',
  '加密': 'cryptographic patterns, digital locks, neon circuit lines',
  '区块链': 'interconnected nodes, distributed network, digital chains',
  '科技': 'futuristic technology, holographic displays, circuit patterns',

  // AI/创新
  'AI': 'neural network visualization, brain circuits, digital synapses',
  '人工智能': 'robot hand reaching, neural pathways, glowing data streams',
  '创新': 'lightbulb moment, breakthrough concept, futuristic lab',

  // 绿色/环保
  '绿色': 'renewable energy landscape, solar panels, wind turbines, green hills',
  '环保': 'earth from space, green forests, clean water, sustainability',
  '碳': 'carbon molecules, industrial to green transition, smoke to trees',
  '新能源': 'solar farm, wind turbines at sunset, electric grid',
  '可持续': 'circular economy diagram, recycling, green city',
  '电动': 'electric vehicles charging, battery technology, EV infrastructure',

  // 医药/健康
  '医药': 'laboratory equipment, molecular structures, medical research',
  '健康': 'DNA helix, medical technology, wellness symbols',
  '医疗': 'hospital technology, surgical robots, medical devices',
  '生物': 'microscope view, cell structures, biotech laboratory',

  // 教育/文化
  '教育': 'books and knowledge, library interior, learning environment',
  '文化': 'cultural artifacts, traditional and modern blend, heritage',
  '历史': 'historical timeline, ancient to modern transition, archives',

  // GPU/芯片/半导体
  'GPU': 'high-end graphics card with glowing fans, circuit board, neon data streams',
  '显卡': 'graphics processing unit close-up, PCB traces, cooling system, RGB lighting',
  'Nvidia': 'GPU chip with green energy streams, neural network nodes, dark tech background',
  'AMD': 'red-themed processor chip, circuit patterns, high performance computing',
  '芯片': 'semiconductor chip macro shot, silicon wafer, golden pins, clean room',
  '半导体': 'silicon wafer in fabrication, clean room equipment, microscopic circuits',
  '处理器': 'CPU processor with heat spreader, motherboard socket, data flow visualization',
  '算力': 'server rack with glowing GPUs, data center, computational power visualization',

  // 单片机/嵌入式/硬件/IoT
  '单片机': 'microcontroller chip on PCB board, electronic components, soldering iron, oscilloscope waveforms, dark tech lab',
  'MCU': 'microcontroller unit close-up, ARM Cortex chip, embedded circuit board, blue LED indicators',
  '嵌入式': 'embedded system board, FPGA development kit, wires and sensors, engineering workbench',
  '物联网': 'IoT network diagram, connected smart devices, sensor nodes, wireless signals, smart city',
  'IoT': 'Internet of Things ecosystem, smart sensors, connected devices mesh, data streams',
  '传感器': 'electronic sensors array, temperature humidity pressure modules, PCB traces, lab environment',
  '电路': 'printed circuit board macro shot, copper traces, SMD components, green PCB, soldering',
  '硬件': 'hardware engineering lab, development boards, multimeter, electronic prototyping',
  '机器人': 'robotic arm in factory, industrial automation, servo motors, precision engineering',
  '自动化': 'industrial automation line, PLC controllers, conveyor belt, smart manufacturing',
  '智能制造': 'smart factory interior, robotic assembly line, digital twin visualization, Industry 4.0',
  '工业': 'industrial facility, heavy machinery, steel structures, manufacturing floor, dramatic lighting',
  '新能源汽车': 'electric vehicle charging station, EV battery pack, automotive electronics, futuristic car',
  '智能家居': 'smart home interior, connected appliances, voice assistant, ambient lighting, modern living room',
};

// ============================================================
// 风格 Prompt 模板
// ============================================================

var STYLE_TEMPLATES = {
  'gradient-glass': {
    prefix: 'Futuristic glass morphism style, frosted glass panels, aurora gradient background, volumetric lighting, ',
    suffix: ', 8k resolution, ultra detailed, UI design aesthetic, Dribbble trending, clean composition',
  },
  'vector-illustration': {
    prefix: 'Flat vector illustration style, clean black outlines, geometric simplified shapes, retro muted color palette, cream paper texture background, ',
    suffix: ', panoramic composition, toy model aesthetic, decorative geometric elements',
  },
  'cinematic': {
    prefix: 'Cinematic dark background, dramatic lighting, depth of field, ',
    suffix: ', professional photography, 8k, ultra detailed, moody atmosphere',
  },
  'minimal': {
    prefix: 'Minimalist design, clean white space, subtle gradients, ',
    suffix: ', modern aesthetic, simple geometric shapes, elegant composition',
  },
};

var DEFAULT_STYLE = 'cinematic';

// ============================================================
// 安全后缀 (规则 14: 禁止文字)
// ============================================================

var NO_TEXT_SUFFIX = ', no text, no words, no typography, no letters, no Chinese characters, no numbers overlay';

// ============================================================
// Prompt 构建函数
// ============================================================

/**
 * 构建封面图 prompt (规则 14: 禁止包含主题文字)
 *
 * @param {string} topic - PPT 主题（如 "绿色经济发展"）
 * @param {object} [opts] - 选项
 * @param {string} [opts.style] - 风格ID
 * @param {string} [opts.extraVisuals] - 额外视觉描述
 * @returns {string} 英文 prompt，绝不包含主题文字
 */
function buildCoverPrompt(topic, opts) {
  opts = opts || {};
  var style = STYLE_TEMPLATES[opts.style] || STYLE_TEMPLATES[DEFAULT_STYLE];
  var visuals = findVisuals(topic);

  var prompt = style.prefix
    + visuals
    + (opts.extraVisuals ? ', ' + opts.extraVisuals : '')
    + style.suffix
    + NO_TEXT_SUFFIX;

  return prompt;
}

/**
 * 构建章节页背景图 prompt
 */
function buildChapterPrompt(chapterTitle, topic, opts) {
  opts = opts || {};
  var style = STYLE_TEMPLATES[opts.style] || STYLE_TEMPLATES[DEFAULT_STYLE];
  var visuals = findVisuals(chapterTitle) || findVisuals(topic);

  var prompt = style.prefix
    + 'abstract background for chapter divider, '
    + visuals
    + style.suffix
    + NO_TEXT_SUFFIX;

  return prompt;
}

/**
 * 构建内容页配图 prompt (不受规则 14 限制，但仍用英文)
 */
function buildContentPrompt(pageTitle, topic, opts) {
  opts = opts || {};
  var style = STYLE_TEMPLATES[opts.style] || STYLE_TEMPLATES[DEFAULT_STYLE];
  var visuals = findVisuals(pageTitle) || findVisuals(topic);

  var prompt = style.prefix
    + 'illustration for presentation slide, '
    + visuals
    + (opts.extraVisuals ? ', ' + opts.extraVisuals : '')
    + style.suffix
    + NO_TEXT_SUFFIX;

  return prompt;
}

/**
 * 根据主题关键词查找视觉描述
 */
function findVisuals(text) {
  if (!text) return 'abstract geometric shapes, professional background';
  for (var keyword in TOPIC_VISUALS) {
    if (text.indexOf(keyword) !== -1) {
      return TOPIC_VISUALS[keyword];
    }
  }
  return 'abstract geometric shapes, professional background';
}

// ============================================================
// 图片路径管理
// ============================================================

/**
 * 创建图片清单 - 列出 outline 中所有需要生成的图片
 *
 * @param {object} outlineData - ppt_outline 数据
 * @returns {Array<{id: string, type: string, prompt: string, path: string|null}>}
 */
function buildImageManifest(outlineData, opts) {
  opts = opts || {};
  var style = opts.style || DEFAULT_STYLE;
  var topic = (outlineData.cover && outlineData.cover.title) || '';
  var manifest = [];

  // 封面
  if (outlineData.cover && !outlineData.cover.image) {
    manifest.push({
      id: 'cover',
      type: 'cover',
      prompt: buildCoverPrompt(topic, { style: style }),
      path: null,
    });
  }

  // 章节页
  var parts = outlineData.parts || [];
  parts.forEach(function(part, i) {
    if (!part.image) {
      manifest.push({
        id: 'chapter-' + (i + 1),
        type: 'chapter',
        prompt: buildChapterPrompt(part.part_title, topic, { style: style }),
        path: null,
      });
    }

    // 内容页 (只为标记了 visual_asset_plan 的页面生成)
    var pages = part.pages || [];
    pages.forEach(function(page) {
      if (page.visual_asset_plan === 'generated-image' && !page.image) {
        manifest.push({
          id: page.page_id || ('page-' + manifest.length),
          type: 'content',
          prompt: buildContentPrompt(page.title, topic, { style: style }),
          path: null,
        });
      }
    });
  });

  // 结尾页
  if (outlineData.end_page && !outlineData.end_page.image) {
    manifest.push({
      id: 'end',
      type: 'cover',
      prompt: buildCoverPrompt(topic, { style: style }),
      path: null,
    });
  }

  return manifest;
}

/**
 * 将生成的图片路径回写到 outline 数据中
 *
 * @param {object} outlineData - ppt_outline 数据 (会被修改)
 * @param {Array} manifest - 带有 path 的图片清单
 */
function applyManifestToOutline(outlineData, manifest) {
  var byId = {};
  manifest.forEach(function(item) {
    if (item.path) byId[item.id] = item.path;
  });

  if (byId['cover'] && outlineData.cover) {
    outlineData.cover.image = byId['cover'];
  }
  if (byId['end'] && outlineData.end_page) {
    outlineData.end_page.image = byId['end'];
  }

  var parts = outlineData.parts || [];
  parts.forEach(function(part, i) {
    var chapterId = 'chapter-' + (i + 1);
    if (byId[chapterId]) part.image = byId[chapterId];

    var pages = part.pages || [];
    pages.forEach(function(page) {
      var pageId = page.page_id;
      if (pageId && byId[pageId]) page.image = byId[pageId];
    });
  });
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  buildCoverPrompt: buildCoverPrompt,
  buildChapterPrompt: buildChapterPrompt,
  buildContentPrompt: buildContentPrompt,
  buildImageManifest: buildImageManifest,
  applyManifestToOutline: applyManifestToOutline,
  findVisuals: findVisuals,
  STYLE_TEMPLATES: STYLE_TEMPLATES,
  TOPIC_VISUALS: TOPIC_VISUALS,
  NO_TEXT_SUFFIX: NO_TEXT_SUFFIX,
};
