/**
 * preview-html.js - 幻灯片结构预览生成器
 *
 * 灵感来源: guizang-ppt-skill 的单文件 HTML 预览
 *
 * 读取 outline JSON，生成一个独立的 HTML 文件，
 * 浏览器打开即可预览所有幻灯片的标题、内容结构和排版类型。
 * 作为 build-ppt 之前的"第二眼确认"。
 *
 * 用法:
 *   node preview-html.js <outline.json> [output.html]
 */

var fs = require('fs');
var path = require('path');

// ============================================================
// 渲染模式 → 图标映射
// ============================================================

var MODE_ICONS = {
  chart: '\u{1F4CA}',
  cards: '\u{1F4CB}',
  'image-text': '\u{1F5BC}',
  'text-list': '\u{1F4DD}',
};

var MODE_LABELS = {
  chart: '图表页',
  cards: '数据卡片页',
  'image-text': '图文混排页',
  'text-list': '纯文字页',
};

// ============================================================
// 颜色主题
// ============================================================

var COLORS = {
  bg: '#0D1B2A',
  panel: '#1A2D42',
  card: '#1E3348',
  border: '#2A4A6A',
  accent: '#4A9EFF',
  accent2: '#FFD166',
  accent3: '#06D6A0',
  accent4: '#FF4D6D',
  text: '#E2E8F0',
  muted: '#94A3B8',
  cover: '#1E3A5F',
};

// ============================================================
// HTML 模板
// ============================================================

function render(outlineData, outputPath) {
  var data = outlineData.ppt_outline || outlineData;

  var slides = [];
  var slideNum = 0;

  // 封面
  if (data.cover) {
    slideNum++;
    slides.push({
      num: slideNum,
      type: 'cover',
      title: data.cover.title || '未命名',
      subtitle: data.cover.sub_title || '',
      image: data.cover.image || null,
    });
  }

  // 目录
  if (data.table_of_contents) {
    slideNum++;
    var tocItems = data.table_of_contents.content || [];
    slides.push({
      num: slideNum,
      type: 'toc',
      title: data.table_of_contents.title || '目录',
      items: tocItems,
    });
  }

  // 各部分
  var parts = data.parts || [];
  parts.forEach(function(part, partIdx) {
    var pages = part.pages || [];

    // 章节分隔页
    if (pages.length >= 3) {
      slideNum++;
      slides.push({
        num: slideNum,
        type: 'chapter',
        title: part.part_title || '',
        chapterNum: partIdx + 1,
        image: part.image || null,
        subPages: pages.map(function(p) { return p.title || ''; }),
      });
    }

    // 各页面
    pages.forEach(function(page) {
      slideNum++;
      var renderMode = page.render_mode || inferMode(page);
      slides.push({
        num: slideNum,
        type: 'content',
        renderMode: renderMode,
        title: page.title || '未命名',
        cards: page.cards || null,
        chartSpec: page.chart_spec || null,
        points: page.points || page.content || [],
        image: page.image || null,
        insight: page.insight || null,
        summaryCards: page.summary_cards || null,
        partIdx: partIdx,
      });
    });
  });

  // 结尾
  if (data.end_page) {
    slideNum++;
    var endPoints = data.end_page.points && data.end_page.points.length > 0
      ? data.end_page.points
      : (data.end_page.summary || []);
    slides.push({
      num: slideNum,
      type: 'end',
      title: data.end_page.title || '谢谢',
      subtitle: data.end_page.sub_title || '',
      points: endPoints,
      image: data.end_page.image || null,
    });
  }

  // 计算统计
  var stats = {
    total: slides.length,
    chartPages: slides.filter(function(s) { return s.renderMode === 'chart'; }).length,
    cardsPages: slides.filter(function(s) { return s.renderMode === 'cards'; }).length,
    imageTextPages: slides.filter(function(s) { return s.renderMode === 'image-text' || s.renderMode === 'text-list'; }).length,
    hasImages: slides.filter(function(s) { return s.image; }).length,
    hasCharts: slides.filter(function(s) { return s.chartSpec; }).length,
    parts: parts.length,
  };

  // 生成 HTML
  var html = buildHtml(slides, stats, data);

  if (outputPath) {
    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log('Preview HTML generated: ' + outputPath);
  }
  return html;
}

// ============================================================
// HTML 构建
// ============================================================

function buildHtml(slides, stats, data) {
  var slideCards = slides.map(function(s) { return renderSlideCard(s); }).join('
');

  return '<!DOCTYPE html>
<html lang="zh-CN">
<head>
' +
    '<meta charset="UTF-8">
' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">
' +
    '<title>PPT 结构预览 — ' + escHtml((data.cover && data.cover.title) || 'Untitled') + '</title>
' +
    '<style>
' +
    '  * { box-sizing: border-box; margin: 0; padding: 0; }
' +
    '  body { background: ' + COLORS.bg + '; color: ' + COLORS.text + '; font-family: "Microsoft YaHei", sans-serif; padding: 24px; }
' +
    '  .header { max-width: 1100px; margin: 0 auto 32px; padding: 24px 32px; background: ' + COLORS.panel + '; border-radius: 12px; border-left: 4px solid ' + COLORS.accent + '; }
' +
    '  .header h1 { font-size: 24px; color: ' + COLORS.accent + '; }
' +
    '  .header .meta { margin-top: 8px; font-size: 14px; color: ' + COLORS.muted + '; }
' +
    '  .header .stats { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
' +
    '  .header .stat { background: ' + COLORS.card + '; padding: 6px 14px; border-radius: 6px; font-size: 13px; }
' +
    '  .header .stat strong { color: ' + COLORS.accent2 + '; }
' +
    '  .slides { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
' +
    '  .slide-card { background: ' + COLORS.card + '; border-radius: 8px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start; border: 1px solid ' + COLORS.border + '; transition: transform 0.15s, border-color 0.15s; }
' +
    '  .slide-card:hover { transform: translateX(4px); border-color: ' + COLORS.accent + '; }
' +
    '  .slide-card.cover { background: ' + COLORS.cover + '; border-left: 4px solid ' + COLORS.accent + '; }
' +
    '  .slide-card.chapter { background: ' + COLORS.cover + '; border-left: 4px solid ' + COLORS.accent2 + '; }
' +
    '  .slide-card.end { background: ' + COLORS.cover + '; border-left: 4px solid ' + COLORS.accent3 + '; }
' +
    '  .slide-num { min-width: 56px; text-align: center; }
' +
    '  .slide-num .num { font-size: 28px; font-weight: bold; color: ' + COLORS.accent + '; }
' +
    '  .slide-num .type-badge { font-size: 11px; color: ' + COLORS.muted + '; margin-top: 2px; padding: 2px 6px; background: ' + COLORS.bg + '; border-radius: 4px; display: inline-block; }
' +
    '  .slide-body { flex: 1; min-width: 0; }
' +
    '  .slide-body .title { font-size: 16px; font-weight: bold; color: ' + COLORS.text + '; margin-bottom: 8px; }
' +
    '  .slide-body .mode-tag { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-right: 8px; }
' +
    '  .mode-chart { background: ' + COLORS.accent + '22; color: ' + COLORS.accent + '; }
' +
    '  .mode-cards { background: ' + COLORS.accent2 + '22; color: ' + COLORS.accent2 + '; }
' +
    '  .mode-image { background: ' + COLORS.accent3 + '22; color: ' + COLORS.accent3 + '; }
' +
    '  .slide-body .detail { font-size: 13px; color: ' + COLORS.muted + '; margin-top: 6px; line-height: 1.6; }
' +
    '  .slide-body .detail li { margin-left: 16px; }
' +
    '  .slide-body .tags { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
' +
    '  .slide-body .tag { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: ' + COLORS.bg + '; color: ' + COLORS.muted + '; }
' +
    '  .slide-body .tag.warn { color: ' + COLORS.accent2 + '; }
' +
    '  .slide-body .tag.info { color: ' + COLORS.accent + '; }
' +
    '  .toc-items { display: flex; gap: 8px; flex-wrap: wrap; }
' +
    '  .toc-items .toc-item { background: ' + COLORS.bg + '; padding: 4px 10px; border-radius: 4px; font-size: 13px; color: ' + COLORS.muted + '; }
' +
    '  @media (max-width: 768px) {
' +
    '    body { padding: 12px; }
' +
    '    .header .stats { flex-direction: column; gap: 6px; }
' +
    '  }
' +
    '</style>
</head>
<body>
' +
    buildHeader(stats, data) +
    '<div class="slides">
' + slideCards + '
</div>
</body>
</html>';
}

function buildHeader(stats, data) {
  var title = escHtml((data.cover && data.cover.title) || 'Untitled PPT');
  return '<div class="header">
' +
    '  <h1>' + title + ' — 结构预览</h1>
' +
    '  <div class="meta">共计 ' + stats.total + ' 页幻灯片</div>
' +
    '  <div class="stats">
' +
    '    <div class="stat">\u{1F4CA} 图表页: <strong>' + stats.chartPages + '</strong></div>
' +
    '    <div class="stat">\u{1F4CB} 卡片页: <strong>' + stats.cardsPages + '</strong></div>
' +
    '    <div class="stat">\u{1F5BC} 图文页: <strong>' + stats.imageTextPages + '</strong></div>
' +
    '    <div class="stat">\u{1F4E6} 章节: <strong>' + stats.parts + '</strong></div>
' +
    '  </div>
' +
    '</div>
';
}

function renderSlideCard(slide) {
  var typeClass = slide.type || '';
  var badge = '';
  var details = '';

  if (slide.type === 'cover') {
    badge = '<span class="type-badge">封面</span>';
    if (slide.subtitle) {
      details = '<div class="detail">' + escHtml(slide.subtitle) + '</div>';
    }
  } else if (slide.type === 'toc') {
    badge = '<span class="type-badge">目录</span>';
    if (slide.items && slide.items.length > 0) {
      details = '<div class="toc-items">' +
        slide.items.map(function(item) {
          var text = typeof item === 'string' ? item : (item.title || item);
          return '<span class="toc-item">' + escHtml(text) + '</span>';
        }).join('') + '</div>';
    }
  } else if (slide.type === 'chapter') {
    badge = '<span class="type-badge">Ch ' + slide.chapterNum + '</span>';
    if (slide.subPages.length > 0) {
      details = '<div class="detail">' + slide.subPages.map(function(p) { return '\u2022 ' + escHtml(p); }).join('<br>') + '</div>';
    }
  } else if (slide.type === 'end') {
    badge = '<span class="type-badge">结尾</span>';
    if (slide.subtitle) {
      details = '<div class="detail">' + escHtml(slide.subtitle) + '</div>';
    }
    if (slide.points.length > 0) {
      details += '<div class="detail">' + slide.points.slice(0, 4).map(function(p) { return '\u2022 ' + escHtml(p); }).join('<br>') + '</div>';
    }
  } else {
    // 内容页
    var mode = slide.renderMode || 'auto';
    var icon = MODE_ICONS[mode] || '';
    var label = MODE_LABELS[mode] || mode;
    var modeClass = 'mode-chart';
    if (mode === 'cards') modeClass = 'mode-cards';
    else if (mode === 'image-text' || mode === 'text-list') modeClass = 'mode-image';

    badge = '<span class="type-badge">' + icon + ' ' + label + '</span>';

    // 详情
    var tags = [];
    if (slide.chartSpec) {
      tags.push('<span class="tag info">图表: ' + escHtml(slide.chartSpec.chart_type || 'bar') + '</span>');
    }
    if (slide.cards && slide.cards.length > 0) {
      tags.push('<span class="tag">' + slide.cards.length + ' 张卡片</span>');
      if (slide.cards.length > 6) tags.push('<span class="tag warn">卡片偏多</span>');
    }
    if (slide.image) {
      tags.push('<span class="tag">含配图</span>');
    }
    if (slide.points && slide.points.length > 0) {
      tags.push('<span class="tag">' + slide.points.length + ' 个要点</span>');
      if (slide.points.length > 4) tags.push('<span class="tag warn">要点偏多</span>');
    }
    if (slide.insight) {
      tags.push('<span class="tag info">含洞察</span>');
    }
    if (slide.summaryCards) {
      tags.push('<span class="tag">' + slide.summaryCards.length + ' 张摘要卡</span>');
    }

    // 卡片预览
    if (slide.cards && slide.cards.length <= 6) {
      var cardList = slide.cards.map(function(c) {
        var parts = [];
        if (c.title) parts.push(escHtml(c.title));
        if (c.value) parts.push('<strong>' + escHtml(String(c.value).substring(0, 20)) + '</strong>');
        return parts.join(': ');
      }).join(' | ');
      details += '<div class="detail">' + cardList + '</div>';
    }

    if (slide.points && slide.points.length > 0 && slide.points.length <= 4) {
      details += '<div class="detail">' +
        slide.points.map(function(p) { return '\u2022 ' + escHtml(String(p).substring(0, 80)); }).join('<br>') +
        '</div>';
    }

    if (tags.length > 0) {
      details += '<div class="tags">' + tags.join('') + '</div>';
    }
  }

  return '<div class="slide-card ' + typeClass + '">
' +
    '  <div class="slide-num">
' +
    '    <div class="num">' + slide.num + '</div>
' +
    '    ' + badge + '
' +
    '  </div>
' +
    '  <div class="slide-body">
' +
    '    <div class="title">' + escHtml(slide.title) + '</div>
' +
    '    ' + details + '
' +
    '  </div>
' +
    '</div>';
}

// ============================================================
// 辅助
// ============================================================

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inferMode(page) {
  if (page.chart_spec || page.chart_image) return 'chart';
  if (page.image && (page.points || page.content)) return 'image-text';
  if (page.cards) return 'cards';
  return 'text-list';
}

// ============================================================
// CLI
// ============================================================

function main() {
  var args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node preview-html.js <outline.json> [output.html]');
    process.exit(1);
  }

  var jsonPath = args[0];
  if (!fs.existsSync(jsonPath)) {
    console.error('Error: File not found: ' + jsonPath);
    process.exit(1);
  }

  var outputPath = args[1] || jsonPath.replace(/\.json$/, '_preview.html');
  var outline = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  render(outline, outputPath);
  console.log('Done! Open in browser: ' + outputPath);
}

module.exports = { render: render };

if (require.main === module) {
  main();
}
