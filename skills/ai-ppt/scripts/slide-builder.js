/**
 * slide-builder.js - PPT 幻灯片构建器
 *
 * 所有布局、配色、边界、对比度规则编码为可调用函数。
 * AI 生成脚本时 require 此模块，不再手写辅助函数。
 *
 * 用法:
 *   const sb = require('./slide-builder');
 *   const ctx = sb.createContext(pptx, theme);
 *   sb.addCoverSlide(ctx, { title, subtitle, imagePath });
 *   sb.addDataCardsSlide(ctx, { title, cards, insightText });
 */

var fs = require('fs');
var path = require('path');
var themes = require('./themes');

// ============================================================
// 常量 (规则 0 + 规则 1)
// ============================================================

var LAYOUTS = {
  '16x9': { w: 10, h: 5.625 },
  'wide': { w: 13.33, h: 7.5 },
};

var DEFAULT_LAYOUT = '16x9';

// 安全区 (规则 1)
function getSafeArea(slideW, slideH) {
  return {
    x: 0.3,
    y: 0.3,
    w: slideW - 0.6,
    h: slideH - 0.625,
    maxY: slideH - 0.325,
  };
}

// 底部预算 (规则 12)
var BOTTOM = {
  insightH: 0.55,
  gapAboveInsight: 0.12,
  reservedBottom: 0.15,
  pageNumH: 0.3,
};

// 版面节奏 (借鉴 ppt-master: anchor/dense/breathing)
// anchor=封面/章节/结尾, breathing=呼吸感(偶数页), dense=紧凑(奇数页)
function getRhythm(pageIndex) {
  return (pageIndex % 2 === 0) ? 'breathing' : 'dense';
}

// 字号与安全行高 (规则 3)
var FONT_LINE_HEIGHT = {
  48: 0.80, 42: 0.72, 36: 0.65, 28: 0.50,
  24: 0.45, 18: 0.35, 14: 0.28, 12: 0.25, 11: 0.23, 10: 0.22,
};

function lineHeight(fontSize) {
  return FONT_LINE_HEIGHT[fontSize] || (fontSize * 0.018);
}

// ============================================================
// Context 对象 - 每个 PPT 生成会话的上下文
// ============================================================

function createContext(pptx, themeIdOrObj, layoutId, seed) {
  layoutId = layoutId || DEFAULT_LAYOUT;
  var dim = LAYOUTS[layoutId];
  if (!dim) throw new Error('Unknown layout: ' + layoutId);

  pptx.layout = layoutId === '16x9' ? 'LAYOUT_16x9' : 'LAYOUT_WIDE';

  var theme = (typeof themeIdOrObj === 'string')
    ? themes.getTheme(themeIdOrObj, seed)
    : themeIdOrObj;

  var safe = getSafeArea(dim.w, dim.h);
  var contentMaxY = dim.h - BOTTOM.insightH - BOTTOM.gapAboveInsight - BOTTOM.reservedBottom;

  return {
    pptx: pptx,
    theme: theme,
    W: dim.w,
    H: dim.h,
    SAFE: safe,
    BOTTOM: BOTTOM,
    contentMaxY: contentMaxY,
    slideCount: 0,
    isDark: themes.isDark(theme),
  };
}

// ============================================================
// 基础绘图函数 (规则 1 边界检查)
// ============================================================

function clampRect(x, y, w, h, slideW, slideH) {
  if (x + w > slideW) w = slideW - x - 0.05;
  if (y + h > slideH) h = slideH - y - 0.05;
  if (w < 0.1) w = 0.1;
  if (h < 0.1) h = 0.1;
  return { x: x, y: y, w: w, h: h };
}

/**
 * pptxgenjs 参数类型安全处理
 * - line.width 必须是 number（传 "40" 会崩溃）
 * - line.color = 'none' 无效，应删除整个 line 或不设
 * - fill.transparency 必须是 number
 * - rectRadius 必须是 number
 */
function sanitizePptxOpts(opts) {
  if (opts.line) {
    if (opts.line.color === 'none' || opts.line.color === 'transparent') {
      delete opts.line; // pptxgenjs 不支持 'none'
    } else {
      if (typeof opts.line.width === 'string') {
        opts.line.width = parseFloat(opts.line.width) || 1;
      }
    }
  }
  if (opts.fill && typeof opts.fill.transparency === 'string') {
    opts.fill.transparency = parseFloat(opts.fill.transparency) || 0;
  }
  if (typeof opts.rectRadius === 'string') {
    opts.rectRadius = parseFloat(opts.rectRadius) || 0;
  }
}

function addText(ctx, slide, text, opts) {
  var r = clampRect(opts.x || 0, opts.y || 0, opts.w || 1, opts.h || 0.5, ctx.W, ctx.H);
  var merged = Object.assign({}, opts, r);
  if (!merged.fontFace) merged.fontFace = ctx.theme.fontBody;
  slide.addText(text, merged);
}

function addShape(ctx, slide, shapeType, opts) {
  // 背景/装饰形状允许超出 (规则 9)
  if (!opts._decorative) {
    var r = clampRect(opts.x || 0, opts.y || 0, opts.w || 1, opts.h || 0.5, ctx.W, ctx.H);
    opts = Object.assign({}, opts, r);
  }
  delete opts._decorative;
  // pptxgenjs 类型安全: line.width 必须是数字, line.color='none' 无效
  sanitizePptxOpts(opts);
  slide.addShape(shapeType, opts);
}

function addImage(ctx, slide, imgPath, x, y, w, h, opts) {
  opts = opts || {};
  if (!fs.existsSync(imgPath)) {
    console.warn('[slide-builder] Image not found: ' + imgPath);
    return;
  }
  // 规则 2: 强制 sizing
  var sizingType = opts.sizingType || 'cover';
  var imgOpts = Object.assign({
    path: imgPath, x: x, y: y, w: w, h: h,
    sizing: { type: sizingType, w: w, h: h },
  }, opts);
  delete imgOpts.sizingType;
  slide.addImage(imgOpts);
}

// ============================================================
// 页面背景
// ============================================================

function applyBackground(ctx, slide, bgImagePath) {
  if (bgImagePath && fs.existsSync(bgImagePath)) {
    // 图片背景 + 深色遮罩 (85% 不透明度，确保正文可读)
    addImage(ctx, slide, bgImagePath, -0.1, -0.1, ctx.W + 0.2, ctx.H + 0.2);
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 0, y: 0, w: ctx.W, h: ctx.H,
      fill: { color: '000000', transparency: 15 },
    });
    return;
  }

  // 优先使用 slide.background 原生 API（确保所有查看器都能正确显示背景色）
  var grad = ctx.theme.bgGradient;
  if (grad && grad.stops && grad.stops.length >= 2) {
    // 渐变背景：用 addShape 矩形实现，同时设置 slide.background 作为 fallback
    slide.background = { color: ctx.theme.background };
    var gradStops = grad.stops.map(function(s) {
      return { position: s.pos !== undefined ? s.pos : 0, color: s.color };
    });
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 0, y: 0, w: ctx.W, h: ctx.H,
      fill: { type: 'gradient', stops: gradStops },
      line: { color: ctx.theme.background, width: 0 },
    });
  } else {
    // 纯色背景：直接用 slide.background，最可靠
    slide.background = { color: ctx.theme.background };
  }
  // 浅色主题：顶部装饰条（利用 decorStripe 色）
  if (ctx.theme.decorStripe && !ctx.isDark) {
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 0, y: 0, w: ctx.W, h: 0.06,
      fill: { color: ctx.theme.decorStripe },
    });
  }
}

// ============================================================
// 页码
// ============================================================

function addPageNumber(ctx, slide, num, total, opts) {
  opts = opts || {};
  var label = total ? (num + ' / ' + total) : String(num);
  // 有洞察条时页码嵌入洞察条右侧，避免被遮挡
  var pageY = ctx.H - 0.35;
  var pageColor = ctx.theme.textMuted;
  if (opts.insightBarY) {
    pageY = opts.insightBarY + 0.05;
    pageColor = 'FFFFFF';
  }
  addText(ctx, slide, label, {
    x: ctx.W - 1.0, y: pageY, w: 0.9, h: 0.25,
    fontSize: 10, color: pageColor, align: 'right',
  });
}

// ============================================================
// 洞察条 (规则 6 + 规则 12)
// ============================================================

function addInsightBar(ctx, slide, text, opts) {
  opts = opts || {};
  var color = opts.color || ctx.theme.primary;
  var contentBottomY = opts.contentBottomY || ctx.contentMaxY;
  var insightH = BOTTOM.insightH;
  var insightY = Math.max(
    contentBottomY + BOTTOM.gapAboveInsight,
    ctx.H - insightH - BOTTOM.reservedBottom
  );

  // 规则 6: 禁止 transparency，不透明背景 + 白色文字
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: ctx.SAFE.x, y: insightY, w: ctx.SAFE.w, h: insightH,
    fill: { color: color },
  });
  addText(ctx, slide, text, {
    x: ctx.SAFE.x + 0.15, y: insightY, w: ctx.SAFE.w - 0.3, h: insightH,
    fontSize: 13, color: 'FFFFFF', bold: true, valign: 'middle',
  });
}

// ============================================================
// 数据卡片 (规则 11)
// ============================================================

function addDataCard(ctx, slide, x, y, w, h, config) {
  var title = config.title || '';
  var value = config.value || '';
  var sub = config.sub || '';
  var accent = config.accent || ctx.theme.primary;
  var cardImage = config.cardImage || null;
  var points = config.points || null;

  // 规则 11 紧凑卡判断（紧凑卡不支持图片/要点）
  if (h < 0.55 && !cardImage && !points) {
    return addCompactCardSingleLine(ctx, slide, x, y, w, h, title, value, sub, accent);
  }
  if (h < 0.9 && !cardImage && !points) {
    return addCompactCardDualLine(ctx, slide, x, y, w, h, title, value, sub, accent);
  }

  // 卡片背景 + 强调条
  addShape(ctx, slide, ctx.pptx.ShapeType.rect, {
    x: x, y: y, w: w, h: h,
    fill: { color: ctx.theme.cardBg },
    line: { color: ctx.theme.cardBorder, width: 1 },
  });
  addShape(ctx, slide, ctx.pptx.ShapeType.rect, {
    x: x, y: y, w: w, h: 0.06,
    fill: { color: accent },
  });

  // ========== 带图片的卡片：左文右图 ==========
  if (cardImage && fs.existsSync(cardImage)) {
    var imgW = Math.min(w * 0.45, 2.5);
    var txtW = w - imgW - 0.3;
    var pad = 0.12;
    // 图片区域
    addImage(ctx, slide, cardImage, x + w - imgW - pad, y + 0.12, imgW, h - 0.24);
    // 标题
    addText(ctx, slide, title, {
      x: x + pad, y: y + 0.15, w: txtW, h: 0.25,
      fontSize: 13, color: ctx.theme.text, bold: true,
    });
    // 副标题/描述
    if (sub) {
      addText(ctx, slide, sub, {
        x: x + pad, y: y + 0.42, w: txtW, h: h - 0.55,
        fontSize: 10, color: ctx.theme.textMuted, valign: 'top',
      });
    }
    return;
  }

  // ========== 带要点列表的卡片 ==========
  if (points && points.length > 0) {
    var pad2 = 0.12;
    var titleH2 = 0.3;
    addText(ctx, slide, title, {
      x: x + pad2, y: y + pad2, w: w - pad2 * 2, h: titleH2,
      fontSize: 14, color: ctx.theme.text, bold: true,
    });
    var ptStartY = y + pad2 + titleH2 + 0.05;
    var ptAvailH = h - pad2 - titleH2 - 0.05 - pad2;
    var ptH = Math.min(0.35, ptAvailH / points.length);
    var ptFs = points.length > 4 ? 9 : 11;
    points.forEach(function(pt, i) {
      // 圆点标记
      slide.addShape(ctx.pptx.ShapeType.rect, {
        x: x + pad2, y: ptStartY + i * ptH + ptH * 0.35, w: 0.06, h: 0.06,
        fill: { color: accent },
      });
      addText(ctx, slide, pt, {
        x: x + pad2 + 0.14, y: ptStartY + i * ptH, w: w - pad2 * 2 - 0.14, h: ptH,
        fontSize: ptFs, color: ctx.theme.textMuted, valign: 'middle',
      });
    });
    return;
  }

  // ========== 标准三层卡片（纯文字）==========

  var textW = w - 0.3;
  // 估算行数：中文约 fontPt*0.014" 宽/字
  function estLines(text, fontPt) {
    var cw = fontPt * 0.014;
    var cpl = Math.max(1, Math.floor(textW / cw));
    return Math.ceil(text.length / cpl);
  }
  function lh(fontPt) { return fontPt * 0.018 + 0.02; }

  var isNumeric = /^[\d,.\-+%$]+/.test(value);
  var isShort = value.length <= 8;
  var availH = h - 0.16; // 去掉强调条+上下边距
  var titleFs = 12;
  var titleH = lh(titleFs);
  var gapV = 0.04;
  var bodyH = availH - titleH - gapV;

  var valueFs, subFs, valueH, subH;

  if (isNumeric || isShort) {
    valueFs = isNumeric ? Math.min(28, h * 12) : Math.min(20, h * 9);
    subFs = 11;
    valueH = Math.min(lh(valueFs) * 1.2, bodyH * (sub ? 0.6 : 1));
    subH = sub ? bodyH - valueH - gapV : 0;
  } else {
    // 长文本：从 13pt 往下试，直到 value+sub 能装进 bodyH
    valueFs = 13; subFs = 10;
    for (var ts = 13; ts >= 8; ts--) {
      var sf = Math.max(7, ts - 2);
      var vh = estLines(value, ts) * lh(ts);
      var sh = sub ? estLines(sub, sf) * lh(sf) : 0;
      if (vh + sh + (sub ? gapV : 0) <= bodyH) {
        valueFs = ts; subFs = sf; break;
      }
      if (ts === 8) { valueFs = 8; subFs = 7; }
    }
    valueH = estLines(value, valueFs) * lh(valueFs);
    subH = sub ? estLines(sub, subFs) * lh(subFs) : 0;
    // 安全裁切
    var totalBody = valueH + (sub ? gapV + subH : 0);
    if (totalBody > bodyH) {
      var sc = bodyH / totalBody;
      valueH *= sc; subH *= sc;
    }
  }

  var contentH = titleH + gapV + valueH + (sub ? gapV + subH : 0);
  var topPad = Math.max(0.1, (h - contentH) / 2);

  addText(ctx, slide, title, {
    x: x + 0.15, y: y + topPad, w: textW, h: titleH,
    fontSize: titleFs, color: ctx.theme.textMuted, valign: 'top',
  });
  addText(ctx, slide, value, {
    x: x + 0.15, y: y + topPad + titleH + gapV, w: textW, h: valueH,
    fontSize: valueFs, color: accent, bold: isShort || isNumeric,
    valign: isShort ? 'middle' : 'top',
  });
  if (sub) {
    addText(ctx, slide, sub, {
      x: x + 0.15, y: y + topPad + titleH + gapV + valueH + gapV, w: textW, h: subH,
      fontSize: subFs, color: ctx.theme.textMuted, valign: 'top',
    });
  }
}

// 紧凑卡: 单行三段式 (h < 0.55)
function addCompactCardSingleLine(ctx, slide, x, y, w, h, title, value, sub, accent) {
  addShape(ctx, slide, ctx.pptx.ShapeType.rect, {
    x: x, y: y, w: w, h: h,
    fill: { color: ctx.theme.cardBg },
    line: { color: ctx.theme.cardBorder, width: 1 },
  });
  // 左侧强调条
  addShape(ctx, slide, ctx.pptx.ShapeType.rect, {
    x: x, y: y, w: 0.05, h: h,
    fill: { color: accent },
  });
  var thirdW = (w - 0.2) / 3;
  addText(ctx, slide, title, {
    x: x + 0.12, y: y, w: thirdW, h: h,
    fontSize: 9, color: ctx.theme.textMuted, valign: 'middle',
  });
  addText(ctx, slide, value, {
    x: x + 0.12 + thirdW, y: y, w: thirdW, h: h,
    fontSize: 13, color: accent, bold: true, valign: 'middle', align: 'center',
  });
  if (sub) {
    addText(ctx, slide, sub, {
      x: x + 0.12 + thirdW * 2, y: y, w: thirdW, h: h,
      fontSize: 8, color: ctx.theme.textMuted, valign: 'middle', align: 'right',
    });
  }
}

// 紧凑卡: 双层压缩 (0.55 <= h < 0.9)
function addCompactCardDualLine(ctx, slide, x, y, w, h, title, value, sub, accent) {
  addShape(ctx, slide, ctx.pptx.ShapeType.rect, {
    x: x, y: y, w: w, h: h,
    fill: { color: ctx.theme.cardBg },
    line: { color: ctx.theme.cardBorder, width: 1 },
  });
  addShape(ctx, slide, ctx.pptx.ShapeType.rect, {
    x: x, y: y, w: w, h: 0.05,
    fill: { color: accent },
  });
  var isNumeric = /^[\d,.\-+%$]+/.test(value);
  var valueFontSize = isNumeric ? 18 : 14;
  addText(ctx, slide, title, {
    x: x + 0.1, y: y + 0.08, w: w - 0.2, h: 0.2,
    fontSize: 9, color: ctx.theme.textMuted,
  });
  addText(ctx, slide, value, {
    x: x + 0.1, y: y + 0.25, w: w - 0.2, h: 0.25,
    fontSize: valueFontSize, color: accent, bold: true,
  });
  if (sub) {
    addText(ctx, slide, sub, {
      x: x + 0.1, y: y + h - 0.22, w: w - 0.2, h: 0.18,
      fontSize: 8, color: ctx.theme.textMuted,
    });
  }
}

// ============================================================
// 循环元素布局 (规则 4)
// ============================================================

function calcItemLayout(count, startY, endY, gap) {
  gap = gap || 0.06;
  var totalH = endY - startY;
  var itemH = totalH / count;
  var result = [];
  for (var i = 0; i < count; i++) {
    result.push({ y: startY + i * itemH, h: itemH - gap });
  }
  return result;
}

// ============================================================
// 高级页面构建器
// ============================================================

/**
 * 封面页 (规则 13 + 规则 14)
 */
function addCoverSlide(ctx, config) {
  var slide = ctx.pptx.addSlide();
  ctx.slideCount++;

  if (config.imagePath && fs.existsSync(config.imagePath)) {
    // 规则 13: 层叠技法
    // 第1层: 出血背景图
    addImage(ctx, slide, config.imagePath, -0.3, 0, ctx.W + 0.6, ctx.H);
    // 第2层: 深色遮罩
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 0, y: 0, w: ctx.W, h: ctx.H,
      fill: { color: '000000', transparency: 50 },
    });
  } else {
    applyBackground(ctx, slide);
  }

  // 有图片时始终白字（深色遮罩），无图片时根据主题选色
  var hasOverlay = config.imagePath && fs.existsSync(config.imagePath);
  var coverTitleColor = hasOverlay ? 'FFFFFF' : (ctx.isDark ? 'FFFFFF' : ctx.theme.primary);
  var coverSubColor = hasOverlay ? 'CCCCCC' : ctx.theme.textMuted;

  // 左侧强调条
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.12, h: ctx.H,
    fill: { color: ctx.theme.primary },
  });

  // 装饰线
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: 0.5, y: 1.5, w: 1.2, h: 0.04,
    fill: { color: ctx.theme.primary },
  });

  // 标题
  addText(ctx, slide, config.title || '', {
    x: 0.5, y: 1.7, w: 7.5, h: 1.2,
    fontSize: 42, bold: true, color: coverTitleColor,
    fontFace: ctx.theme.fontTitle,
  });

  // 副标题
  if (config.subtitle) {
    addText(ctx, slide, config.subtitle, {
      x: 0.5, y: 3.0, w: 7.5, h: 0.6,
      fontSize: 22, color: coverSubColor,
    });
  }

  // 底部装饰线
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: 0.5, y: 4.8, w: 3, h: 0.03,
    fill: { color: ctx.theme.primary },
  });

  return slide;
}

/**
 * 目录页
 */
function addTocSlide(ctx, config) {
  var slide = ctx.pptx.addSlide();
  ctx.slideCount++;
  applyBackground(ctx, slide, config.bgImagePath);

  addText(ctx, slide, config.title || '目录', {
    x: ctx.SAFE.x, y: 0.3, w: ctx.SAFE.w, h: 0.6,
    fontSize: 28, bold: true, color: ctx.theme.primary,
    fontFace: ctx.theme.fontTitle,
  });

  // 标题下方装饰线
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: ctx.SAFE.x, y: 0.92, w: ctx.SAFE.w, h: 0.04,
    fill: { color: ctx.theme.primary },
  });

  var items = config.items || [];
  var startY = 1.1;
  var itemH = Math.min(0.95, (ctx.H - startY - 0.3) / items.length);

  // 序号字号自适应：条目多时缩小，避免换行堆叠
  var numFontSize = items.length <= 5 ? 26 : items.length <= 7 ? 20 : 16;
  var numW = 0.7;
  var sepX = ctx.SAFE.x + numW + 0.15;
  var titleX = sepX + 0.15;
  var titleW = ctx.SAFE.x + ctx.SAFE.w - titleX - 0.1;

  items.forEach(function(item, i) {
    var y = startY + i * itemH;
    var title = (typeof item === 'string') ? item : (item.title || item);
    var sub = (typeof item === 'object' && item.sub) ? item.sub : null;

    // 行背景
    addShape(ctx, slide, ctx.pptx.ShapeType.rect, {
      x: ctx.SAFE.x, y: y + 0.04, w: ctx.SAFE.w, h: itemH - 0.06,
      fill: { color: ctx.theme.cardBg },
    });

    // 序号
    var numStr = String(i + 1).length < 2 ? '0' + (i + 1) : String(i + 1);
    addText(ctx, slide, numStr, {
      x: ctx.SAFE.x, y: y + 0.04, w: numW, h: itemH - 0.06,
      fontSize: numFontSize, bold: true, color: ctx.theme.primary,
      valign: 'middle', align: 'center',
    });

    // 竖线分隔
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: sepX, y: y + 0.15, w: 0.04, h: Math.max(itemH - 0.3, 0.15),
      fill: { color: ctx.theme.primary },
    });

    // 标题字号自适应
    var titleFontSize = items.length <= 5 ? 16 : items.length <= 7 ? 14 : 12;
    addText(ctx, slide, title, {
      x: titleX, y: y + 0.04, w: titleW, h: sub ? Math.max(itemH * 0.6, 0.25) : (itemH - 0.06),
      fontSize: titleFontSize, bold: true, color: ctx.theme.text,
      valign: sub ? 'bottom' : 'middle',
    });

    // 子标题
    if (sub) {
      var subY = y + 0.04 + Math.max(itemH * 0.6, 0.25);
      addText(ctx, slide, sub, {
        x: titleX, y: subY, w: titleW, h: Math.max(itemH - 0.06 - Math.max(itemH * 0.6, 0.25), 0.2),
        fontSize: Math.min(11, titleFontSize - 3), color: ctx.theme.textMuted,
      });
    }
  });

  addPageNumber(ctx, slide, ctx.slideCount);
  return slide;
}

/**
 * 章节分隔页
 */
function addChapterSlide(ctx, config) {
  var slide = ctx.pptx.addSlide();
  ctx.slideCount++;

  if (config.imagePath && fs.existsSync(config.imagePath)) {
    addImage(ctx, slide, config.imagePath, -0.3, 0, ctx.W + 0.6, ctx.H);
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 0, y: 0, w: ctx.W, h: ctx.H,
      fill: { color: '000000', transparency: 55 },
    });
  } else {
    applyBackground(ctx, slide);
  }

  var chapterHasOverlay = config.imagePath && fs.existsSync(config.imagePath);
  // 奇偶章节交替用 primary / accent，形成章节间的色彩节奏
  var chapterAccent = (config.chapterNum && config.chapterNum % 2 === 0)
    ? (ctx.theme.accent || ctx.theme.primary)
    : ctx.theme.primary;
  var chapterTitleColor = chapterHasOverlay ? 'FFFFFF' : (ctx.isDark ? 'FFFFFF' : chapterAccent);

  // 章节编号
  if (config.chapterNum) {
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 0.5, y: 1.8, w: 0.8, h: 0.5,
      fill: { color: chapterAccent },
    });
    addText(ctx, slide, String(config.chapterNum), {
      x: 0.5, y: 1.8, w: 0.8, h: 0.5,
      fontSize: 22, color: ctx.theme.textOnPrimary, bold: true,
      align: 'center', valign: 'middle',
    });
  }

  addText(ctx, slide, config.title || '', {
    x: 0.5, y: 2.5, w: 9, h: 0.9,
    fontSize: 36, bold: true, color: chapterTitleColor,
    fontFace: ctx.theme.fontTitle,
  });

  // 子页标题列表 — 填充章节页空白区域
  var subPages = config.subPages || [];
  if (subPages.length > 0) {
    var subColor = chapterHasOverlay ? 'CCCCCC' : ctx.theme.textMuted;
    // 装饰分隔线
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 0.5, y: 3.55, w: 2.0, h: 0.03,
      fill: { color: chapterAccent },
    });
    var subStartY = 3.75;
    var subItemH = Math.min(0.35, (ctx.H - subStartY - 0.5) / subPages.length);
    subPages.forEach(function(sp, i) {
      var spTitle = (typeof sp === 'string') ? sp : (sp.title || '');
      addText(ctx, slide, '· ' + spTitle, {
        x: 0.6, y: subStartY + i * subItemH, w: 8.5, h: subItemH,
        fontSize: 13, color: subColor, valign: 'middle',
      });
    });
  }

  addPageNumber(ctx, slide, ctx.slideCount);
  return slide;
}

/**
 * 数据卡片页 - 自动布局 N 张卡片
 */
function addDataCardsSlide(ctx, config) {
  var slide = ctx.pptx.addSlide();
  ctx.slideCount++;
  applyBackground(ctx, slide, config.bgImagePath);

  // 侧边图片（先添加，作为底层）
  var hasSideImage = config.sideImagePath && fs.existsSync(config.sideImagePath);
  var sideImageW = 3.2;
  var contentW = hasSideImage ? (ctx.SAFE.w - sideImageW - 0.15) : ctx.SAFE.w;

  if (hasSideImage) {
    var imgX = ctx.W - sideImageW;
    addImage(ctx, slide, config.sideImagePath, imgX, 0, sideImageW, ctx.H);
    // 半透明遮罩让图片不抢焦
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: imgX, y: 0, w: sideImageW, h: ctx.H,
      fill: { color: '000000', transparency: 45 },
    });
  }

  // 标题
  addText(ctx, slide, config.title || '', {
    x: ctx.SAFE.x, y: 0.3, w: contentW, h: 0.55,
    fontSize: 24, bold: true, color: ctx.theme.text,
    fontFace: ctx.theme.fontTitle,
  });

  // 副标题
  if (config.subtitle) {
    addText(ctx, slide, config.subtitle, {
      x: ctx.SAFE.x, y: 0.8, w: contentW, h: 0.3,
      fontSize: 14, color: ctx.theme.textMuted,
    });
  }

  var cards = config.cards || [];
  var startY = config.subtitle ? 1.2 : 1.0;
  var hasInsight = !!config.insightText;
  var endY = hasInsight ? ctx.contentMaxY : (ctx.H - 0.4);
  var availH = endY - startY;
  var availW = contentW;

  // 自动选择布局（有侧图时最多 2 列）
  var cols, rows;
  var maxCols = hasSideImage ? 2 : 4;
  if (cards.length <= 2) { cols = cards.length; rows = 1; }
  else if (cards.length === 3) { cols = 3; rows = 1; }
  else if (cards.length === 4) { cols = hasSideImage ? 2 : 2; rows = 2; }
  else if (cards.length <= 6) { cols = Math.min(3, maxCols); rows = 2; }
  else { cols = maxCols; rows = Math.ceil(cards.length / maxCols); }

  // 模拟 span 放置，计算真实行数
  var simCol = 0, simRow = 0;
  cards.forEach(function(card) {
    var sp = Math.min(card.span || 1, cols);
    if (simCol + sp > cols) { simCol = 0; simRow++; }
    simCol += sp;
    if (simCol >= cols) { simCol = 0; simRow++; }
  });
  var actualRows = (simCol > 0) ? simRow + 1 : simRow;
  if (actualRows > rows) rows = actualRows;

  // 版面节奏 (借鉴 ppt-master: anchor/dense/breathing)
  // density 覆写: compact → 全部紧凑, spacious → 全部呼吸感
  // 无覆写时: 奇数页dense偶数页breathing交替
  var rhythm;
  if (config.density === 'compact') {
    rhythm = 'dense';
  } else if (config.density === 'spacious') {
    rhythm = 'breathing';
  } else {
    rhythm = getRhythm(config.pageIndex || 0);
  }
  var gap = rhythm === 'dense' ? 0.10 : (rhythm === 'breathing' ? 0.20 : 0.15);
  var baseCardW = (availW - gap * (cols - 1)) / cols;
  var cardH = (availH - gap * (rows - 1)) / rows;

  // 最小卡片高度保护
  var MIN_CARD_H = 0.9;
  if (cardH < MIN_CARD_H && hasInsight) {
    hasInsight = false;
    endY = ctx.H - 0.4;
    availH = endY - startY;
    cardH = (availH - gap * (rows - 1)) / rows;
  }

  var palette = ctx.theme.palette || [ctx.theme.primary];

  // 支持 span 的布局：逐行放置，span>1 的卡片占多列宽度
  var curCol = 0;
  var curRow = 0;
  cards.forEach(function(card, i) {
    var span = Math.min(card.span || 1, cols);
    // 当前行放不下，换行
    if (curCol + span > cols) {
      curCol = 0;
      curRow++;
    }
    var cx = ctx.SAFE.x + curCol * (baseCardW + gap);
    var cy = startY + curRow * (cardH + gap);
    var cw = baseCardW * span + gap * (span - 1);
    if (!card.accent) {
      card = Object.assign({}, card, { accent: palette[i % palette.length] });
    }
    addDataCard(ctx, slide, cx, cy, cw, cardH, card);
    curCol += span;
    if (curCol >= cols) { curCol = 0; curRow++; }
  });

  var finalInsightY = null;

  if (hasInsight) {
    // 洞察条也限制在内容区宽度内（不被侧图遮挡）
    var insightW = hasSideImage ? contentW : ctx.SAFE.w;
    var contentBottom = startY + rows * (cardH + gap) - gap;
    var insightH = BOTTOM.insightH;
    var insightY = Math.max(
      contentBottom + BOTTOM.gapAboveInsight,
      ctx.H - insightH - BOTTOM.reservedBottom
    );
    finalInsightY = insightY;
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: ctx.SAFE.x, y: insightY, w: insightW, h: insightH,
      fill: { color: ctx.theme.primary },
    });
    addText(ctx, slide, config.insightText, {
      x: ctx.SAFE.x + 0.15, y: insightY, w: insightW - 0.3, h: insightH,
      fontSize: 13, color: 'FFFFFF', bold: true, valign: 'middle',
    });
  }

  addPageNumber(ctx, slide, ctx.slideCount, config.totalPages,
    finalInsightY ? { insightBarY: finalInsightY } : {});
  return slide;
}

/**
 * 图文混排页 - 左图右文 或 左文右图
 * 策略：按 2 条/页 自动翻页，超长文字自适应行数
 */
function addImageTextSlide(ctx, config) {
  var points = config.points || [];
  var imgPath = config.imagePath;
  var hasInsight = !!config.insightText;

  // 每页固定放 2 条，避免文字过多溢出
  var ITEMS_PER_PAGE = 2;
  var pageCount = Math.ceil(points.length / ITEMS_PER_PAGE);
  var storedTotal = config.totalPages || 0;

  for (var batch = 0; batch < pageCount; batch++) {
    var batchPoints = points.slice(batch * ITEMS_PER_PAGE, (batch + 1) * ITEMS_PER_PAGE);
    var isFirst = (batch === 0);
    var isLast = (batch === pageCount - 1);

    renderImageTextSlide(ctx, {
      title: isFirst ? config.title : '',
      imagePath: (isFirst && imgPath) ? imgPath : null,
      imagePosition: config.imagePosition,
      points: batchPoints,
      insightText: isLast ? config.insightText : null,
      totalPages: storedTotal,
      pageIndex: ctx.slideCount + 1,
      bgImagePath: config.bgImagePath,
    });
  }
  return ctx.slideCount;
}

/**
 * 内部渲染：渲染一页图文混排内容
 */
function renderImageTextSlide(ctx, config) {
  var slide = ctx.pptx.addSlide();
  ctx.slideCount++;
  applyBackground(ctx, slide, config.bgImagePath);

  var imageLeft = config.imagePosition !== 'right';
  var hasInsight = !!config.insightText;
  var contentEndY = hasInsight ? ctx.contentMaxY : (ctx.H - 0.3);

  // 标题区（仅首页有）
  var titleH = 0;
  if (config.title) {
    addText(ctx, slide, config.title, {
      x: ctx.SAFE.x, y: 0.3, w: ctx.SAFE.w, h: 0.55,
      fontSize: 24, bold: true, color: ctx.theme.text,
      fontFace: ctx.theme.fontTitle,
    });
    titleH = 0.55;
  }

  var bodyY = titleH > 0 ? titleH + 0.2 : 0.35;
  var bodyH = contentEndY - bodyY;
  var hasImage = !!(config.imagePath && fs.existsSync(config.imagePath));

  if (hasImage) {
    var imgW = 3.6;
    var imgH = Math.min(3.6, bodyH);
    var imgY = bodyY + (bodyH - imgH) / 2;
    var textX = ctx.SAFE.x + imgW + 0.3;
    var textW = ctx.SAFE.w - imgW - 0.3;

    addImage(ctx, slide, config.imagePath, ctx.SAFE.x, imgY, imgW, imgH);
    renderTextItems(ctx, slide, config.points, textX, bodyY, textW, bodyH, hasInsight);
  } else {
    renderTextItems(ctx, slide, config.points, ctx.SAFE.x, bodyY, ctx.SAFE.w, bodyH, hasInsight);
  }

  if (hasInsight) {
    addInsightBar(ctx, slide, config.insightText);
  }

  addPageNumber(ctx, slide, ctx.slideCount, config.totalPages);
  return slide;
}

/**
 * 文字要点渲染核心函数 - 自适应高度分配
 * 先计算每条文字所需行数，再弹性分配高度，确保文字不溢出
 */
function renderTextItems(ctx, slide, points, x, startY, availableW, availableH, hasInsight) {
  if (!points || points.length === 0) return;

  var FONT_SIZE = 13;
  var LH = FONT_LINE_HEIGHT[FONT_SIZE] || (FONT_SIZE * 0.018);  // 13pt ≈ 0.26"
  var MARKER_SIZE = 0.1;
  var MARKER_GAP = 0.12;
  var ITEM_PADDING = 0.08;
  var MIN_ITEM_H = LH * 2;  // 最少 2 行
  var ITEM_GAP = 0.12;  // 条目间距

  var ITEM_X = x;
  var ITEM_W = availableW;

  // 智能折行：按固定字符数分段落
  function wrapText(text) {
    var charsPerLine = Math.floor((ITEM_W - MARKER_SIZE - MARKER_GAP - ITEM_PADDING * 2) * 14);
    if (charsPerLine < 10) charsPerLine = 10;
    var result = [];
    var paragraphs = text.split(/\n/);
    paragraphs.forEach(function(para) {
      if (!para.trim()) { result.push(''); return; }
      var sentences = para.split(/(?<=[。；！？．.!?])/);
      sentences.forEach(function(sent) {
        if (!sent.trim()) return;
        // 按句子分：每句不超过 charsPerLine 个字符
        if (sent.length <= charsPerLine) {
          result.push(sent.trim());
        } else {
          for (var i = 0; i < sent.length; i += charsPerLine) {
            var chunk = sent.slice(i, i + charsPerLine);
            if (chunk.trim()) result.push(chunk);
          }
        }
      });
    });
    return result;
  }

  // Step 1: 计算每条文字折行后的行数
  var itemLines = points.map(function(pt) {
    var lines = wrapText(pt);
    return Math.max(lines.length, 1);
  });

  // Step 2: 精确计算最小所需高度
  var minTotalH = 0;
  itemLines.forEach(function(n) { minTotalH += Math.max(n * LH, MIN_ITEM_H) + ITEM_GAP; });
  minTotalH -= ITEM_GAP;  // 最后一条不加间距

  var itemHeights = [];

  if (minTotalH <= availableH) {
    // 能放下：最小高度 + 剩余空间均分给每条
    var extraH = availableH - minTotalH;
    var extraPerItem = extraH / points.length;
    points.forEach(function(_, i) {
      itemHeights.push(Math.max(itemLines[i] * LH, MIN_ITEM_H) + extraPerItem);
    });
  } else {
    // 放不下：严格按行数分配，保证比例
    var totalLines = itemLines.reduce(function(a, b) { return a + b; }, 0);
    var hPerLine = availableH / totalLines;
    // 再从总高中减掉间距
    var gapTotal = (points.length - 1) * ITEM_GAP;
    var remainingForItems = availableH - gapTotal;
    var hPerLine2 = remainingForItems / totalLines;
    hPerLine2 = Math.max(hPerLine2, LH * 0.85);  // 保底行高
    points.forEach(function(_, i) {
      itemHeights.push(Math.max(itemLines[i] * hPerLine2, MIN_ITEM_H * 0.8));
    });
  }

  // Step 3: 渲染
  var currentY = startY;
  points.forEach(function(pt, i) {
    var itemH = itemHeights[i];
    var lines = wrapText(pt);
    var markerY = currentY + (itemH - MARKER_SIZE) / 2;

    // 左侧小方块标记
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: ITEM_X, y: markerY, w: MARKER_SIZE, h: MARKER_SIZE,
      fill: { color: ctx.theme.primary },
    });

    // 文字（多行）
    var textX = ITEM_X + MARKER_SIZE + MARKER_GAP;
    var textW = ITEM_W - MARKER_SIZE - MARKER_GAP;
    addText(ctx, slide, lines.join('\n'), {
      x: textX, y: currentY, w: textW, h: itemH,
      fontSize: FONT_SIZE, color: ctx.theme.text, valign: 'top',
      lineSpacingMultiple: 1.15,
    });

    currentY += itemH + ITEM_GAP;
  });
}

/**
 * 结尾页
 */
function addEndSlide(ctx, config) {
  var slide = ctx.pptx.addSlide();
  ctx.slideCount++;

  if (config.imagePath && fs.existsSync(config.imagePath)) {
    addImage(ctx, slide, config.imagePath, -0.3, 0, ctx.W + 0.6, ctx.H);
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 0, y: 0, w: ctx.W, h: ctx.H,
      fill: { color: '000000', transparency: 55 },
    });
  } else {
    applyBackground(ctx, slide);
  }

  var points = config.points || [];
  var hasPoints = points.length > 0;

  if (hasPoints) {
    // 有要点时：标题在顶部，要点卡片在下方
    // 顶部装饰线
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 0, y: 0, w: ctx.W, h: 0.06,
      fill: { color: ctx.theme.primary },
    });
    // 底部装饰线
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 0, y: ctx.H - 0.06, w: ctx.W, h: 0.06,
      fill: { color: ctx.theme.primary },
    });

    addText(ctx, slide, config.title || '谢谢', {
      x: ctx.SAFE.x, y: 0.35, w: ctx.SAFE.w, h: 0.7,
      fontSize: 30, bold: true, color: ctx.theme.primary,
      align: 'center', fontFace: ctx.theme.fontTitle,
    });

    // 装饰分隔线
    slide.addShape(ctx.pptx.ShapeType.rect, {
      x: 2.5, y: 1.1, w: 5, h: 0.04,
      fill: { color: ctx.theme.primary },
    });

    // 要点卡片
    var startY = 1.3;
    var itemH = (ctx.H - startY - 0.4) / points.length;
    points.forEach(function(pt, i) {
      var y = startY + i * itemH;
      // 卡片背景
      addShape(ctx, slide, ctx.pptx.ShapeType.rect, {
        x: ctx.SAFE.x, y: y + 0.04, w: ctx.SAFE.w, h: itemH - 0.06,
        fill: { color: ctx.theme.cardBg },
        line: { color: ctx.theme.cardBorder, width: 1 },
      });
      // 左侧强调条
      addShape(ctx, slide, ctx.pptx.ShapeType.rect, {
        x: ctx.SAFE.x, y: y + 0.04, w: 0.06, h: itemH - 0.06,
        fill: { color: ctx.theme.primary },
      });
      // 文字
      addText(ctx, slide, pt, {
        x: ctx.SAFE.x + 0.18, y: y + 0.04, w: ctx.SAFE.w - 0.2, h: itemH - 0.06,
        fontSize: 13, color: ctx.theme.text, valign: 'middle',
      });
    });
  } else {
    // 无要点时：居中大标题 + 副标题
    var endTitleColor = ctx.isDark ? 'FFFFFF' : ctx.theme.primary;
    addText(ctx, slide, config.title || '谢谢', {
      x: 0, y: ctx.H / 2 - 0.8, w: ctx.W, h: 1.0,
      fontSize: 42, bold: true, color: endTitleColor,
      align: 'center', valign: 'middle',
      fontFace: ctx.theme.fontTitle,
    });

    if (config.subtitle) {
      addText(ctx, slide, config.subtitle, {
        x: 0, y: ctx.H / 2 + 0.3, w: ctx.W, h: 0.5,
        fontSize: 20, color: ctx.theme.text,
        align: 'center', valign: 'middle',
      });
    }
  }

  return slide;
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  // Context
  createContext: createContext,
  // 基础绘图
  addText: addText,
  addShape: addShape,
  addImage: addImage,
  applyBackground: applyBackground,
  addPageNumber: addPageNumber,
  addInsightBar: addInsightBar,
  addDataCard: addDataCard,
  // 布局计算
  calcItemLayout: calcItemLayout,
  getSafeArea: getSafeArea,
  lineHeight: lineHeight,
  // 高级页面
  addCoverSlide: addCoverSlide,
  addTocSlide: addTocSlide,
  addChapterSlide: addChapterSlide,
  addDataCardsSlide: addDataCardsSlide,
  addImageTextSlide: addImageTextSlide,
  addEndSlide: addEndSlide,
  // 版面节奏 (借鉴 ppt-master: anchor/dense/breathing)
  getRhythm: getRhythm,
  // 常量
  LAYOUTS: LAYOUTS,
  BOTTOM: BOTTOM,
  FONT_LINE_HEIGHT: FONT_LINE_HEIGHT,
};
