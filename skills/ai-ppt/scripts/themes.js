/**
 * themes.js - 统一主题系统
 *
 * 所有 PPT 的颜色、字体、间距都从这里获取。
 * AI 生成脚本时只需 require 主题，不再每次手写颜色常量。
 *
 * 用法:
 *   const { getTheme, listThemes } = require('./themes');
 *   const theme = getTheme('dark-gold');
 */

// ============================================================
// 内置主题
// ============================================================

const THEMES = {
  // 深色金色系 - 适合金融、贵金属、商务
  'dark-gold': {
    id: 'dark-gold',
    name: '深色金色',
    background: '1A1A2E',       // 深靛蓝（独立）
    cardBg: '16213E',
    cardBorder: '2A3A5C',
    primary: 'D4AF37',
    primaryLight: 'F5D68A',
    primaryDark: 'B8860B',
    accent: 'E5A400',
    text: 'FFFFFF',
    textMuted: 'CBD5E1',
    textOnPrimary: '0F172A',
    success: '22C55E', danger: 'EF4444', info: '3B82F6',
    palette: ['D4AF37', 'E5A400', 'F5D68A', '3B82F6', '22C55E', 'C084FC'],
    bgGradient: { angle: 180, stops: [{ pos: 0, color: '1A1A2E' }, { pos: 100, color: '0F0F1E' }] },
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // 深色蓝橙系 - 适合科技、加密货币
  'dark-tech': {
    id: 'dark-tech',
    name: '深色科技',
    background: '0D1117',       // GitHub 暗色（独立）
    cardBg: '161B22',
    cardBorder: '30363D',
    primary: 'F97316',
    primaryLight: 'FDBA74',
    primaryDark: 'C2410C',
    accent: '3B82F6',
    text: 'FFFFFF',
    textMuted: 'CBD5E1',
    textOnPrimary: 'FFFFFF',
    success: '22C55E', danger: 'EF4444', info: '3B82F6',
    palette: ['F97316', '3B82F6', '22C55E', 'FBBF24', 'EC4899', '8B5CF6'],
    bgGradient: { angle: 135, stops: [{ pos: 0, color: '0D1117' }, { pos: 100, color: '161B22' }] },
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // 深色绿色系 - 适合环保、绿色经济
  'dark-green': {
    id: 'dark-green',
    name: '深色绿色',
    background: '0A1628',       // 深青蓝（独立）
    cardBg: '122035',
    cardBorder: '1E3A50',
    primary: '22C55E',
    primaryLight: '86EFAC',
    primaryDark: '15803D',
    accent: '06B6D4',
    text: 'FFFFFF',
    textMuted: 'CBD5E1',
    textOnPrimary: 'FFFFFF',
    success: '22C55E', danger: 'EF4444', info: '3B82F6',
    palette: ['22C55E', '06B6D4', 'FBBF24', '3B82F6', 'A78BFA', 'F472B6'],
    bgGradient: { angle: 180, stops: [{ pos: 0, color: '0A1628' }, { pos: 100, color: '071220' }] },
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // 浅色商务 - 适合正式汇报
  'light-business': {
    id: 'light-business',
    name: '浅色商务',
    background: 'FFFFFF',
    cardBg: 'F8FAFC',
    cardBorder: 'E2E8F0',
    primary: '1E40AF',
    primaryLight: '93C5FD',
    primaryDark: '1E3A8A',
    accent: 'F59E0B',
    text: '1E293B',
    textMuted: '64748B',
    textOnPrimary: 'FFFFFF',
    success: '16A34A', danger: 'DC2626', info: '2563EB',
    palette: ['1E40AF', 'F59E0B', '16A34A', 'DC2626', '7C3AED', '0891B2'],
    bgGradient: { angle: 180, stops: [{ pos: 0, color: 'FFFFFF' }, { pos: 100, color: 'F1F5F9' }] },
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // 浅色暖色 - 适合教育、文化
  'light-warm': {
    id: 'light-warm',
    name: '浅色暖色',
    background: 'FFFBF0',
    cardBg: 'FFF7ED',
    cardBorder: 'FED7AA',
    primary: 'EA580C',
    primaryLight: 'FDBA74',
    primaryDark: 'C2410C',
    accent: '0891B2',
    text: '1C1917',
    textMuted: '78716C',
    textOnPrimary: 'FFFFFF',
    success: '16A34A', danger: 'DC2626', info: '0284C7',
    palette: ['EA580C', '0891B2', '7C3AED', '16A34A', 'DC2626', 'D97706'],
    bgGradient: { angle: 180, stops: [{ pos: 0, color: 'FFFBF0' }, { pos: 100, color: 'FFF1DB' }] },
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // 深色红色系 - 适合医药、健康
  'dark-red': {
    id: 'dark-red',
    name: '深色红色',
    background: '1A0A14',       // 深酒红（独立）
    cardBg: '2A1520',
    cardBorder: '3D2030',
    primary: 'EF4444',
    primaryLight: 'FCA5A5',
    primaryDark: 'B91C1C',
    accent: 'F59E0B',
    text: 'FFFFFF',
    textMuted: 'CBD5E1',
    textOnPrimary: 'FFFFFF',
    success: '22C55E', danger: 'EF4444', info: '3B82F6',
    palette: ['EF4444', 'F59E0B', '3B82F6', '22C55E', 'EC4899', 'A78BFA'],
    bgGradient: { angle: 180, stops: [{ pos: 0, color: '1A0A14' }, { pos: 100, color: '10060E' }] },
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // 深色紫色系 - 适合AI、创新
  'dark-purple': {
    id: 'dark-purple',
    name: '深色紫色',
    background: '13091F',       // 深紫黑（独立）
    cardBg: '1E1233',
    cardBorder: '2D1F4E',
    primary: '8B5CF6',
    primaryLight: 'C4B5FD',
    primaryDark: '6D28D9',
    accent: 'EC4899',
    text: 'FFFFFF',
    textMuted: 'CBD5E1',
    textOnPrimary: 'FFFFFF',
    success: '22C55E', danger: 'EF4444', info: '3B82F6',
    palette: ['8B5CF6', 'EC4899', '06B6D4', 'FBBF24', '22C55E', 'F97316'],
    bgGradient: { angle: 135, stops: [{ pos: 0, color: '13091F' }, { pos: 100, color: '0D0618' }] },
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // ============================================================
  // 浅色/彩色主题 - 适合活动策划、零售、生活服务
  // 每个主题有独特的色调倾向，不只是"白底+不同强调色"
  // ============================================================

  // 明亮彩色系 - 适合玩具店、儿童、亲子
  // 色调：暖橙底 + 奶油卡片 + 紫色点缀
  'light-playful': {
    id: 'light-playful',
    name: '明亮彩色',
    background: 'FFF3E0',       // 暖橙底
    cardBg: 'FFF8F0',           // 奶油色卡片
    cardBorder: 'FFCC80',       // 橙色边框
    primary: 'F97316',          // 活力橙
    primaryLight: 'FDBA74',
    primaryDark: 'EA580C',
    accent: '8B5CF6',           // 紫色点缀
    text: '3E2723',             // 深棕文字
    textMuted: '8D6E63',        // 棕灰
    textOnPrimary: 'FFFFFF',
    success: '22C55E', danger: 'EF4444', info: '3B82F6',
    palette: ['F97316', '8B5CF6', '22C55E', 'EC4899', '3B82F6', 'FBBF24'],
    bgGradient: { angle: 180, stops: [{ pos: 0, color: 'FFF3E0' }, { pos: 100, color: 'FFE0B2' }] },
    decorStripe: 'FFB74D',      // 装饰条色
    gradientFrom: 'FF9800', gradientTo: 'FF5722',
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // 自然绿色系 - 适合旅游、户外、景区
  // 色调：浅绿底 + 薄荷卡片 + 青色点缀
  'light-nature': {
    id: 'light-nature',
    name: '自然绿色',
    background: 'E8F5E9',       // 浅绿底
    cardBg: 'F1F8E9',           // 薄荷卡片
    cardBorder: 'A5D6A7',       // 绿色边框
    primary: '2E7D32',          // 森林绿
    primaryLight: '81C784',
    primaryDark: '1B5E20',
    accent: '00838F',           // 青色点缀
    text: '1B5E20',             // 深绿文字
    textMuted: '558B2F',        // 橄榄绿
    textOnPrimary: 'FFFFFF',
    success: '2E7D32', danger: 'C62828', info: '0277BD',
    palette: ['2E7D32', '00838F', 'F9A825', '1565C0', 'AD1457', 'E65100'],
    bgGradient: { angle: 180, stops: [{ pos: 0, color: 'E8F5E9' }, { pos: 100, color: 'C8E6C9' }] },
    decorStripe: '66BB6A',
    gradientFrom: '43A047', gradientTo: '00897B',
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // 暖色餐饮系 - 适合餐饮、咖啡、烘焙
  // 色调：暖黄底 + 米色卡片 + 红色点缀
  'light-food': {
    id: 'light-food',
    name: '暖色餐饮',
    background: 'FFF8E1',       // 暖黄底
    cardBg: 'FFFDE7',           // 米色卡片
    cardBorder: 'FFE082',       // 金黄边框
    primary: 'E65100',          // 深橙（食欲色）
    primaryLight: 'FFB74D',
    primaryDark: 'BF360C',
    accent: 'C62828',           // 红色点缀
    text: '3E2723',             // 深棕文字
    textMuted: '795548',        // 咖啡色
    textOnPrimary: 'FFFFFF',
    success: '2E7D32', danger: 'C62828', info: '0277BD',
    palette: ['E65100', 'C62828', '2E7D32', '0277BD', '6A1B9A', 'F9A825'],
    bgGradient: { angle: 180, stops: [{ pos: 0, color: 'FFF8E1' }, { pos: 100, color: 'FFECB3' }] },
    decorStripe: 'FFA726',
    gradientFrom: 'FF6F00', gradientTo: 'E65100',
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // 时尚粉色系 - 适合服装、美妆、时尚
  // 色调：浅粉底 + 玫瑰卡片 + 紫色点缀
  'light-fashion': {
    id: 'light-fashion',
    name: '时尚粉色',
    background: 'FCE4EC',       // 浅粉底
    cardBg: 'FFF0F5',           // 玫瑰白卡片
    cardBorder: 'F48FB1',       // 粉色边框
    primary: 'C2185B',          // 玫红
    primaryLight: 'F06292',
    primaryDark: '880E4F',
    accent: '6A1B9A',           // 紫色点缀
    text: '311B92',             // 深紫文字
    textMuted: '7B1FA2',        // 紫灰
    textOnPrimary: 'FFFFFF',
    success: '2E7D32', danger: 'C62828', info: '0277BD',
    palette: ['C2185B', '6A1B9A', '00838F', 'F9A825', '2E7D32', '1565C0'],
    bgGradient: { angle: 180, stops: [{ pos: 0, color: 'FCE4EC' }, { pos: 100, color: 'F8BBD0' }] },
    decorStripe: 'EC407A',
    gradientFrom: 'E91E63', gradientTo: '9C27B0',
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },

  // 节庆红金系 - 适合开业、庆典、活动
  // 色调：浅红底 + 暖白卡片 + 金色点缀
  'light-festival': {
    id: 'light-festival',
    name: '节庆红金',
    background: 'FFEBEE',       // 浅红底
    cardBg: 'FFF3E0',           // 暖白卡片
    cardBorder: 'EF9A9A',       // 红色边框
    primary: 'C62828',          // 中国红
    primaryLight: 'EF5350',
    primaryDark: 'B71C1C',
    accent: 'E65100',           // 金橙点缀
    text: '3E2723',             // 深棕文字
    textMuted: '6D4C41',        // 棕灰
    textOnPrimary: 'FFFFFF',
    success: '2E7D32', danger: 'C62828', info: '0277BD',
    palette: ['C62828', 'E65100', 'F9A825', '2E7D32', '1565C0', '6A1B9A'],
    bgGradient: { angle: 180, stops: [{ pos: 0, color: 'FFEBEE' }, { pos: 100, color: 'FFCDD2' }] },
    decorStripe: 'E53935',
    gradientFrom: 'D32F2F', gradientTo: 'FF6F00',
    fontTitle: 'Microsoft YaHei', fontBody: 'Microsoft YaHei', fontMono: 'Consolas',
  },
};

// ============================================================
// 主题推荐映射（关键词 → 主题ID）
// ============================================================

const TOPIC_THEME_MAP = {
  // 深色主题 - 数据/科技/金融
  '金': 'dark-gold', '贵金属': 'dark-gold', '黄金': 'dark-gold', '金融': 'dark-gold',
  '投资': 'dark-gold', '股票': 'dark-gold', '基金': 'dark-gold', '银行': 'dark-gold',
  '比特币': 'dark-tech', '加密': 'dark-tech', '区块链': 'dark-tech', '科技': 'dark-tech',
  'GPU': 'dark-tech', '显卡': 'dark-tech', 'Nvidia': 'dark-tech', 'AMD': 'dark-tech',
  '芯片': 'dark-tech', '半导体': 'dark-tech', '算力': 'dark-tech', '处理器': 'dark-tech',
  'AI': 'dark-purple', '人工智能': 'dark-purple', '创新': 'dark-purple', '元宇宙': 'dark-purple',
  '绿色': 'dark-green', '环保': 'dark-green', '碳': 'dark-green', '新能源': 'dark-green',
  '可持续': 'dark-green', '电动': 'dark-green', '清洁': 'dark-green',
  '医药': 'dark-red', '健康': 'dark-red', '医疗': 'dark-red', '生物': 'dark-red',

  // 浅色主题 - 生活/零售/活动
  '玩具': 'light-playful', '儿童': 'light-playful', '亲子': 'light-playful', '游乐': 'light-playful',
  '母婴': 'light-playful', '幼儿': 'light-playful', '童装': 'light-playful',
  '旅游': 'light-nature', '景区': 'light-nature', '风景': 'light-nature', '户外': 'light-nature',
  '度假': 'light-nature', '民宿': 'light-nature', '露营': 'light-nature', '公园': 'light-nature',
  '餐饮': 'light-food', '餐厅': 'light-food', '美食': 'light-food', '咖啡': 'light-food',
  '烘焙': 'light-food', '火锅': 'light-food', '奶茶': 'light-food', '茶饮': 'light-food',
  '服装': 'light-fashion', '时尚': 'light-fashion', '美妆': 'light-fashion', '潮牌': 'light-fashion',
  '女装': 'light-fashion', '男装': 'light-fashion', '鞋': 'light-fashion',
  '开业': 'light-festival', '庆典': 'light-festival', '活动策划': 'light-festival',
  '周年': 'light-festival', '促销': 'light-festival', '节日': 'light-festival',

  // 通用
  '教育': 'light-warm', '文化': 'light-warm', '历史': 'light-warm',
  '汇报': 'light-business', '商务': 'light-business', '企业': 'light-business',

  // 单片机/嵌入式/硬件/IoT
  '单片机': 'dark-tech', 'MCU': 'dark-tech', '嵌入式': 'dark-tech', '物联网': 'dark-tech',
  'IoT': 'dark-tech', '传感器': 'dark-tech', '电路': 'dark-tech', '硬件': 'dark-tech',
  '机器人': 'dark-tech', '自动化': 'dark-tech', '智能制造': 'dark-tech', '工业': 'dark-tech',
};

// ============================================================
// 配色变体 — 同一主题 ID 下的多套配色
// 根据标题 hash 稳定选择（同标题同配色，不同标题不同配色）
// 每个变体只覆盖需要变化的字段，其余继承基础主题
// ============================================================

var VARIANTS = {
  'light-nature': [
    {}, // 变体0: 基础（森林绿）
    { background: 'E0F7FA', cardBg: 'E0F2F1', cardBorder: '80CBC4',
      primary: '00695C', primaryLight: '4DB6AC', accent: '0277BD',
      text: '004D40', textMuted: '00695C', decorStripe: '26A69A',
      gradientFrom: '00897B', gradientTo: '006064' }, // 变体1: 青绿湖泊
    { background: 'F1F8E9', cardBg: 'F9FBE7', cardBorder: 'C5E1A5',
      primary: '558B2F', primaryLight: '9CCC65', accent: 'F9A825',
      text: '33691E', textMuted: '689F38', decorStripe: '8BC34A',
      gradientFrom: '7CB342', gradientTo: 'C0CA33' }, // 变体2: 田野黄绿
  ],
  'light-food': [
    {}, // 变体0: 基础（暖黄餐饮）
    { background: 'FBE9E7', cardBg: 'FFF3E0', cardBorder: 'FFAB91',
      primary: 'BF360C', primaryLight: 'FF8A65', accent: 'AD1457',
      text: '3E2723', textMuted: '6D4C41', decorStripe: 'FF7043',
      gradientFrom: 'E64A19', gradientTo: 'BF360C' }, // 变体1: 火锅红
    { background: 'EFEBE9', cardBg: 'FFF8E1', cardBorder: 'BCAAA4',
      primary: '4E342E', primaryLight: '8D6E63', accent: '00695C',
      text: '3E2723', textMuted: '6D4C41', decorStripe: '795548',
      gradientFrom: '5D4037', gradientTo: '3E2723' }, // 变体2: 咖啡棕
  ],
  'light-playful': [
    {}, // 变体0: 基础（暖橙）
    { background: 'E8EAF6', cardBg: 'EDE7F6', cardBorder: 'B39DDB',
      primary: '5E35B1', primaryLight: '9575CD', accent: 'F4511E',
      text: '311B92', textMuted: '5C6BC0', decorStripe: '7E57C2',
      gradientFrom: '673AB7', gradientTo: '3F51B5' }, // 变体1: 梦幻紫
    { background: 'E0F7FA', cardBg: 'E1F5FE', cardBorder: '81D4FA',
      primary: '0288D1', primaryLight: '4FC3F7', accent: 'FF6F00',
      text: '01579B', textMuted: '0277BD', decorStripe: '29B6F6',
      gradientFrom: '039BE5', gradientTo: '0277BD' }, // 变体2: 海洋蓝
  ],
  'light-fashion': [
    {}, // 变体0: 基础（玫红粉）
    { background: 'EDE7F6', cardBg: 'F3E5F5', cardBorder: 'CE93D8',
      primary: '7B1FA2', primaryLight: 'BA68C8', accent: 'C2185B',
      text: '4A148C', textMuted: '8E24AA', decorStripe: 'AB47BC',
      gradientFrom: '9C27B0', gradientTo: '6A1B9A' }, // 变体1: 高贵紫
    { background: 'ECEFF1', cardBg: 'F5F5F5', cardBorder: 'B0BEC5',
      primary: '37474F', primaryLight: '78909C', accent: 'D4AF37',
      text: '263238', textMuted: '546E7A', decorStripe: '607D8B',
      gradientFrom: '455A64', gradientTo: '263238' }, // 变体2: 高级灰
  ],
  'light-festival': [
    {}, // 变体0: 基础（红金）
    { background: 'FFF3E0', cardBg: 'FFF8E1', cardBorder: 'FFE082',
      primary: 'E65100', primaryLight: 'FF9800', accent: 'C62828',
      text: 'BF360C', textMuted: 'E65100', decorStripe: 'FF6D00',
      gradientFrom: 'FF6F00', gradientTo: 'E65100' }, // 变体1: 金橙庆典
    { background: 'FCE4EC', cardBg: 'FFF0F5', cardBorder: 'F48FB1',
      primary: 'AD1457', primaryLight: 'EC407A', accent: 'FF6F00',
      text: '880E4F', textMuted: 'C2185B', decorStripe: 'E91E63',
      gradientFrom: 'D81B60', gradientTo: 'AD1457' }, // 变体2: 桃红喜庆
  ],
};

// ============================================================
// 公共 API
// ============================================================

/**
 * 简单字符串 hash（稳定：同字符串同结果）
 */
function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // 转32位整数
  }
  return Math.abs(hash);
}

/**
 * 获取主题配置（支持配色变体）
 * @param {string} themeId - 主题ID
 * @param {string} [seed] - 变体种子（通常是 PPT 标题），不同标题选不同变体
 * @returns {object} 主题配置对象
 */
function getTheme(themeId, seed) {
  var base = THEMES[themeId];
  if (!base) {
    throw new Error('Unknown theme: ' + themeId + '. Available: ' + Object.keys(THEMES).join(', '));
  }
  var theme = Object.assign({}, base);

  // 如果有变体且提供了 seed，根据 hash 选择变体
  var variants = VARIANTS[themeId];
  if (variants && variants.length > 1 && seed) {
    var idx = simpleHash(seed) % variants.length;
    var variant = variants[idx];
    if (variant && Object.keys(variant).length > 0) {
      Object.assign(theme, variant);
    }
  }

  return theme;
}

/**
 * 根据主题关键词推荐主题
 * @param {string} topic - PPT 主题描述
 * @returns {string} 推荐的主题ID
 */
function recommendTheme(topic) {
  if (!topic) return 'dark-gold';
  // 按关键词长度降序匹配，更具体的优先（如"单片机"优先于"创新"）
  var keywords = Object.keys(TOPIC_THEME_MAP).sort(function(a, b) { return b.length - a.length; });
  for (var i = 0; i < keywords.length; i++) {
    if (topic.indexOf(keywords[i]) !== -1) {
      return TOPIC_THEME_MAP[keywords[i]];
    }
  }
  return 'dark-gold'; // 默认
}

/**
 * 列出所有可用主题
 * @returns {Array<{id: string, name: string}>}
 */
function listThemes() {
  return Object.keys(THEMES).map(function(id) {
    return { id: id, name: THEMES[id].name };
  });
}

/**
 * 判断主题是深色还是浅色
 * @param {object} theme - 主题对象
 * @returns {boolean} true = 深色主题
 */
function isDark(theme) {
  return theme.id.startsWith('dark-');
}

module.exports = {
  getTheme: getTheme,
  recommendTheme: recommendTheme,
  listThemes: listThemes,
  isDark: isDark,
  THEMES: THEMES,
};
