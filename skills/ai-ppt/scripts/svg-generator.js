/**
 * SVG Page Generator
 *
 * 根据策划稿生成 SVG 格式的 PPT 页面
 * 支持 Bento Grid 布局
 */

var bentoLayouts = require('./bento-layouts');

// 默认样式配置
var DEFAULT_STYLE = {
  background: '#ffffff',
  cardBackground: '#f8f9fa',
  cardBorder: '#e9ecef',
  cardRadius: 12,
  textColor: '#212529',
  accentColor: '#0066ff',
  fontFamily: 'Arial, sans-serif',
  fontSize: {
    title: 28,
    subtitle: 18,
    body: 16,
    caption: 14
  }
};

/**
 * 生成 SVG 页面
 * @param {object} planningDraft - 策划稿对象
 * @param {object} styleConfig - 样式配置（可选）
 * @returns {string} SVG 字符串
 */
function generateSvgPage(planningDraft, styleConfig) {
  var style = Object.assign({}, DEFAULT_STYLE, styleConfig || {});
  var layoutType = planningDraft.layout_type || 'single-focus';
  var cards = planningDraft.cards || [];
  var layoutCards = bentoLayouts.calculateLayout(layoutType, {
    insightH: 55,
    gapAboveInsight: 12,
    reservedBottom: 15,
    chartH: 250,
    summaryH: 72
  });

  // 生成卡片 SVG
  var cardSvgs = [];
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var layoutCard = findLayoutCard(layoutCards, card.id);
    if (layoutCard) {
      cardSvgs.push(generateCardSvg(card, layoutCard, style));
    }
  }

  // 页面标题
  var titleSvg = '';
  if (planningDraft.page_title) {
    titleSvg = '<text x="' + bentoLayouts.CANVAS.padding + '" y="' +
      (bentoLayouts.CANVAS.padding + 30) + '" font-family="' + style.fontFamily +
      '" font-size="' + style.fontSize.title + '" font-weight="bold" fill="' +
      style.textColor + '">' + escapeXml(planningDraft.page_title) + '</text>';
  }

  var insightSvg = generateAdaptiveInsightBar(planningDraft, style);

  // 组装完整 SVG
  var svg = '<?xml version="1.0" encoding="UTF-8"?>\n';
  svg += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    bentoLayouts.CANVAS.width + ' ' + bentoLayouts.CANVAS.height + '" width="' +
    bentoLayouts.CANVAS.width + '" height="' + bentoLayouts.CANVAS.height + '">\n';
  svg += '  <rect width="100%" height="100%" fill="' + style.background + '"/>\n';
  svg += '  <g id="title">' + titleSvg + '</g>\n';
  svg += '  <g id="cards">\n' + cardSvgs.join('\n') + '\n  </g>\n';
  svg += insightSvg;
  svg += '</svg>';
  return svg;
}

/**
 * 查找对应的布局卡片
 */
function findLayoutCard(layoutCards, cardId) {
  for (var i = 0; i < layoutCards.length; i++) {
    if (layoutCards[i].id === cardId) {
      return layoutCards[i];
    }
  }
  return layoutCards[0];
}

/**
 * 生成自适应洞察条
 */
function generateAdaptiveInsightBar(planningDraft, style) {
  if (!planningDraft.insight_text) return '';

  var canvas = bentoLayouts.CANVAS;
  var insightH = 55;
  var gapAboveInsight = 12;
  var reservedBottom = 15;
  var contentBottomY = planningDraft.content_bottom_y || (canvas.height - insightH - gapAboveInsight - reservedBottom);
  var insightY = Math.max(contentBottomY + gapAboveInsight, canvas.height - insightH - reservedBottom);
  var accent = style.accentColor || '#0066ff';

  return [
    '  <g id="insight-bar">',
    '    <rect x="' + canvas.padding + '" y="' + insightY + '" width="' + (canvas.width - canvas.padding * 2) + '" height="' + insightH + '" fill="' + accent + '" rx="8"/>',
    '    <text x="' + (canvas.padding + 16) + '" y="' + (insightY + 32) + '" font-family="' + style.fontFamily + '" font-size="18" font-weight="bold" fill="#ffffff">' + escapeXml(planningDraft.insight_text) + '</text>',
    '  </g>'
  ].join('\n') + '\n';
}

/**
 * 生成单个卡片 SVG
 */
function generateCardSvg(card, layoutCard, style) {
  var x = layoutCard.x;
  var y = layoutCard.y;
  var w = layoutCard.w;
  var h = layoutCard.h;
  var padding = 20;
  var innerX = x + padding;
  var innerY = y + padding;

  var svgParts = [];

  // 卡片背景
  svgParts.push('    <rect x="' + x + '" y="' + y + '" width="' + w +
    '" height="' + h + '" fill="' + style.cardBackground + '" rx="' +
    style.cardRadius + '" stroke="' + style.cardBorder + '" stroke-width="1"/>');

  // 卡片标题
  if (card.title) {
    svgParts.push('    <text x="' + innerX + '" y="' + (innerY + 24) +
      '" font-family="' + style.fontFamily + '" font-size="' + style.fontSize.subtitle +
      '" font-weight="bold" fill="' + style.textColor + '">' +
      escapeXml(card.title) + '</text>');
  }

  // 卡片内容
  if (card.content) {
    var content = card.content;
    var contentY = innerY + (card.title ? 60 : 30);
    var isSummaryCard = card.role === 'summary-card' || h <= 90;

    if (typeof content === 'string') {
      svgParts.push('    <text x="' + innerX + '" y="' + contentY +
        '" font-family="' + style.fontFamily + '" font-size="' + style.fontSize.body +
        '" fill="' + style.textColor + '">' + escapeXml(content) + '</text>');
    } else if (content.value) {
      if (isSummaryCard) {
        svgParts.push('    <text x="' + innerX + '" y="' + (innerY + 26) +
          '" font-family="' + style.fontFamily + '" font-size="14" font-weight="bold" fill="' + style.textColor + '">' +
          escapeXml(card.title || '') + '</text>');
        svgParts.push('    <text x="' + innerX + '" y="' + (innerY + 52) +
          '" font-family="' + style.fontFamily + '" font-size="24" font-weight="bold" fill="' + style.accentColor + '">' +
          escapeXml(content.value) + '</text>');
        if (content.sub) {
          svgParts.push('    <text x="' + innerX + '" y="' + (innerY + 72) +
            '" font-family="' + style.fontFamily + '" font-size="11" fill="#6c757d">' + escapeXml(content.sub) + '</text>');
        }
      } else {
        // 数据卡片格式
        var valueY = contentY + 30;
        svgParts.push('    <text x="' + innerX + '" y="' + valueY +
          '" font-family="' + style.fontFamily + '" font-size="36" font-weight="bold" fill="' +
          style.accentColor + '">' + escapeXml(content.value) + '</text>');

        if (content.sub) {
          svgParts.push('    <text x="' + innerX + '" y="' + (valueY + 30) +
            '" font-family="' + style.fontFamily + '" font-size="' + style.fontSize.caption +
            '" fill="#6c757d">' + escapeXml(content.sub) + '</text>');
        }
      }
    } else if (Array.isArray(content)) {
      // 列表格式
      for (var i = 0; i < content.length; i++) {
        var lineY = contentY + (i * 24);
        svgParts.push('    <text x="' + innerX + '" y="' + lineY +
          '" font-family="' + style.fontFamily + '" font-size="' + style.fontSize.body +
          '" fill="' + style.textColor + '">&#x2022; ' + escapeXml(content[i]) + '</text>');
      }
    }
  }

  return svgParts.join('\n');
}

/**
 * 转义 XML 特殊字符
 */
function escapeXml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 生成封面页 SVG
 */
function generateCoverSvg(coverData, styleConfig) {
  var style = Object.assign({}, DEFAULT_STYLE, styleConfig || {});
  var canvas = bentoLayouts.CANVAS;

  var titleSvg = '';
  if (coverData.title) {
    titleSvg = '<text x="' + canvas.width / 2 + '" y="' + (canvas.height / 2 - 20) +
      '" text-anchor="middle" font-family="' + style.fontFamily + '" font-size="48" font-weight="bold" fill="' +
      style.textColor + '">' + escapeXml(coverData.title) + '</text>';
  }

  var subtitleSvg = '';
  if (coverData.sub_title) {
    subtitleSvg = '<text x="' + canvas.width / 2 + '" y="' + (canvas.height / 2 + 30) +
      '" text-anchor="middle" font-family="' + style.fontFamily + '" font-size="24" fill="#6c757d">' +
      escapeXml(coverData.sub_title) + '</text>';
  }

  var svg = '<?xml version="1.0" encoding="UTF-8"?>\n';
  svg += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    canvas.width + ' ' + canvas.height + '" width="' +
    canvas.width + '" height="' + canvas.height + '">\n';
  svg += '  <rect width="100%" height="100%" fill="' + style.background + '"/>\n';
  svg += '  <g id="cover-content">\n';
  svg += '    ' + titleSvg + '\n';
  svg += '    ' + subtitleSvg + '\n';
  svg += '  </g>\n';
  svg += '</svg>';
  return svg;
}

/**
 * 生成目录页 SVG
 */
function generateTocSvg(tocData, styleConfig) {
  var style = Object.assign({}, DEFAULT_STYLE, styleConfig || {});
  var canvas = bentoLayouts.CANVAS;

  var itemsSvg = [];
  if (tocData.content && Array.isArray(tocData.content)) {
    var startY = 150;
    var itemHeight = 60;
    for (var i = 0; i < tocData.content.length; i++) {
      var y = startY + i * itemHeight;
      itemsSvg.push('    <text x="' + canvas.padding + '" y="' + y +
        '" font-family="' + style.fontFamily + '" font-size="20" fill="' +
        style.textColor + '">' + (i + 1) + '. ' + escapeXml(tocData.content[i]) + '</text>');
    }
  }

  var svg = '<?xml version="1.0" encoding="UTF-8"?>\n';
  svg += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    canvas.width + ' ' + canvas.height + '" width="' +
    canvas.width + '" height="' + canvas.height + '">\n';
  svg += '  <rect width="100%" height="100%" fill="' + style.background + '"/>\n';
  svg += '  <g id="toc-content">\n' + itemsSvg.join('\n') + '\n  </g>\n';
  svg += '</svg>';
  return svg;
}

// 导出
module.exports = {
  generateSvgPage: generateSvgPage,
  generateCoverSvg: generateCoverSvg,
  generateTocSvg: generateTocSvg,
  escapeXml: escapeXml,
  DEFAULT_STYLE: DEFAULT_STYLE
};
