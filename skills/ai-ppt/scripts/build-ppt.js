/**
 * build-ppt.js - PPT 主管线脚本
 *
 * 读取 outline JSON，自动生成完整 PPTX。
 * JSON 格式详见 SKILL.md。
 *
 * 用法:
 *   node build-ppt.js <outline.json> [output.pptx] [--theme dark-gold]
 */

var fs = require('fs');
var path = require('path');
var pptxgen = require('pptxgenjs');
var sb = require('./slide-builder');
var cb = require('./chart-builder');
var themes = require('./themes');
var sp = require('./safe-path');
var validator = require('./validate-outline');

// ============================================================
// CLI 入口
// ============================================================

function main() {
  var args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node build-ppt.js <outline.json> [output.pptx] [--theme <id>]');
    console.log('Available themes: ' + themes.listThemes().map(function(t) { return t.id; }).join(', '));
    process.exit(1);
  }

  var jsonPath = args[0];
  var outputPath = args[1] || jsonPath.replace(/\.json$/, '.pptx');
  var themeId = null;

  // 解析 --theme 参数
  for (var i = 0; i < args.length; i++) {
    if (args[i] === '--theme' && args[i + 1]) {
      themeId = args[i + 1];
    }
  }

  if (!fs.existsSync(jsonPath)) {
    console.error('Error: File not found: ' + jsonPath);
    process.exit(1);
  }

  var outline = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  var meta = outline.meta || {};
  var data = outline.ppt_outline || outline;

  // 大纲校验 — 在生成前拦截结构性错误
  var vResult = validator.validate(data);
  if (vResult.warnings.length > 0) {
    vResult.warnings.forEach(function(w) { console.log('  ⚠ ' + w); });
  }
  if (!vResult.valid) {
    vResult.errors.forEach(function(e) { console.error('  ✗ ' + e); });
    console.error('Outline validation failed. Fix errors above before generating.');
    process.exit(1);
  }

  // 主题优先级: CLI --theme > 代码自动推荐 > meta.theme 兜底
  // 核心原则：代码决定主题，不依赖 AI 在 outline 里选对
  if (!themeId) {
    var title = (data.cover ? data.cover.title : '') || '';
    var autoTheme = themes.recommendTheme(title);
    // 只有当自动推荐返回默认值（没匹配到关键词）时，才用 meta.theme
    if (autoTheme !== 'dark-gold' || !meta.theme) {
      themeId = autoTheme;
    } else {
      themeId = meta.theme;
    }
    if (meta.theme && meta.theme !== themeId) {
      console.log('Theme override: "' + meta.theme + '" -> "' + themeId + '" (auto-recommended from title)');
    }
  }

  console.log('Theme: ' + themeId);
  console.log('Output: ' + outputPath);

  buildPptx(data, meta, themeId, outputPath, jsonPath);
}

// ============================================================
// 核心构建函数
// ============================================================

function buildPptx(data, meta, themeId, outputPath, jsonPath) {
  var pptx = new pptxgen();
  // 用封面标题作为变体种子 — 不同标题自动选不同配色变体
  var seed = (data.cover && data.cover.title) || '';
  var ctx = sb.createContext(pptx, themeId, null, seed);

  // 使用 safe-path 解析图片路径（绕过 MSYS2 中文 CWD 乱码）
  var projectDir = jsonPath ? sp.resolveProjectDir(jsonPath) : process.cwd();
  var imagesDir = meta.images_dir || './slides';

  function resolveImg(imgName) {
    if (!imgName) return null;
    if (path.isAbsolute(imgName)) return fs.existsSync(imgName) ? imgName : null;
    // 优先从项目目录解析，不依赖 CWD
    var p = path.resolve(projectDir, imagesDir, imgName);
    if (fs.existsSync(p)) return p;
    // 兜底：直接从 imagesDir 解析
    p = path.resolve(projectDir, imgName);
    return fs.existsSync(p) ? p : null;
  }

  // 计算总页数
  var totalPages = countPages(data);

  // ========== 封面 ==========
  if (data.cover) {
    sb.addCoverSlide(ctx, {
      title: data.cover.title || '',
      subtitle: data.cover.sub_title || '',
      imagePath: resolveImg(data.cover.image),
    });
  }

  // ========== 目录 ==========
  if (data.table_of_contents) {
    var tocItems = data.table_of_contents.content || [];
    sb.addTocSlide(ctx, {
      title: data.table_of_contents.title || '目录',
      items: tocItems,
      bgImagePath: resolveImg('toc-bg.jpg')
    });
  }

  // ========== 各部分 ==========
  var parts = data.parts || [];
  var pageIndex = 0; // 全局页面计数器，用于 palette 取色
  parts.forEach(function(part, partIdx) {
    var pages = part.pages || [];
    var hasChapterImage = !!resolveImg(part.image || part.part_image);

    // 章节分隔页策略：
    // - 1 页内容：跳过章节页（避免空旷）
    // - 2 页内容：有章节图才显示
    // - 3+ 页内容：始终显示
    var showChapter = pages.length >= 3 || (pages.length === 2 && hasChapterImage);

    if (showChapter) {
      var subPageTitles = pages.map(function(p) { return p.title || ''; });
      sb.addChapterSlide(ctx, {
        title: part.part_title || '',
        chapterNum: partIdx + 1,
        imagePath: resolveImg(part.image || part.part_image),
        subPages: subPageTitles,
      });
    }

    // 各页面
    pages.forEach(function(page) {
      buildPage(ctx, page, resolveImg, totalPages, pageIndex, null, meta.density || null);
      pageIndex++;
    });
  });

  // ========== 结尾 ==========
  if (data.end_page) {
    sb.addEndSlide(ctx, {
      title: data.end_page.title || '谢谢',
      subtitle: data.end_page.sub_title || '',
      points: (data.end_page.points && data.end_page.points.length > 0)
        ? data.end_page.points
        : (data.end_page.summary || []),
      imagePath: resolveImg(data.end_page.image),
    });
  }

  // 写入文件
  pptx.writeFile({ fileName: outputPath }).then(function() {
    console.log('Done! ' + ctx.slideCount + ' slides generated.');
  }).catch(function(err) {
    console.error('Error writing PPTX:', err);
    process.exit(1);
  });
}

// ============================================================
// 页面路由 - 根据 page_type / render_mode 选择构建器
// ============================================================

function buildPage(ctx, page, resolveImg, totalPages, pageIndex, bgImagePath, density) {
  var renderMode = page.render_mode || inferRenderMode(page);

  switch (renderMode) {
    case 'chart':
      cb.addChartSlide(ctx, {
        title: page.title,
        chartSpec: page.chart_spec,
        chartImagePath: resolveImg(page.chart_image),
        summaryCards: page.summary_cards,
        insightText: page.insight,
        totalPages: totalPages,
        pageIndex: pageIndex || 0,
        bgImagePath: resolveImg(bgImagePath)
      });
      break;

    case 'cards':
      // 解析每张卡片的 cardImage 路径
      var resolvedCards = normalizeCards(page).map(function(card) {
        if (card.cardImage) {
          var resolved = resolveImg(card.cardImage);
          if (resolved) return Object.assign({}, card, { cardImage: resolved });
          var c2 = Object.assign({}, card);
          delete c2.cardImage;
          return c2;
        }
        return card;
      });
      sb.addDataCardsSlide(ctx, {
        title: page.title,
        subtitle: page.subtitle,
        cards: resolvedCards,
        insightText: page.insight,
        sideImagePath: resolveImg(page.side_image || page.image),
        totalPages: totalPages,
        pageIndex: pageIndex,
        density: density,
        bgImagePath: resolveImg(bgImagePath)
      });
      break;

    case 'image-text':
      sb.addImageTextSlide(ctx, {
        title: page.title,
        imagePath: resolveImg(page.image),
        imagePosition: page.image_position || 'left',
        points: page.points || page.content || [],
        insightText: page.insight,
        totalPages: totalPages,
        pageIndex: pageIndex,
        density: density,
        bgImagePath: resolveImg(bgImagePath)
      });
      break;

    case 'text-list':
      // 纯文字列表页：走同一渲染器，无图片
      sb.addImageTextSlide(ctx, {
        title: page.title,
        imagePath: null,
        points: page.points || page.content || [],
        insightText: page.insight,
        totalPages: totalPages,
        pageIndex: pageIndex,
        density: density,
        bgImagePath: resolveImg(bgImagePath)
      });
      break;

    default:
      // 默认: 有图片用图文混排，有卡片用卡片页，否则用要点页
      if (page.image) {
        sb.addImageTextSlide(ctx, {
          title: page.title,
          imagePath: resolveImg(page.image),
          imagePosition: page.image_position || 'left',
          points: page.points || page.content || [],
          insightText: page.insight,
          totalPages: totalPages,
          pageIndex: pageIndex,
        density: density,
          bgImagePath: resolveImg(bgImagePath)
        });
      } else if (page.cards && page.cards.length > 0) {
        sb.addDataCardsSlide(ctx, {
          title: page.title,
          cards: page.cards,
          insightText: page.insight,
          totalPages: totalPages,
          pageIndex: pageIndex,
        density: density,
          bgImagePath: resolveImg(bgImagePath)
        });
      } else {
        // 纯文字要点 → 转为卡片
        sb.addDataCardsSlide(ctx, {
          title: page.title,
          cards: contentToCards(page.content || page.points || []),
          insightText: page.insight,
          totalPages: totalPages,
          pageIndex: pageIndex,
        density: density,
          bgImagePath: resolveImg(bgImagePath)
        });
      }
  }
}

// ============================================================
// 辅助函数
// ============================================================

function inferRenderMode(page) {
  if (page.chart_spec || page.chart_image) return 'chart';
  if (page.image && (page.points || page.content)) return 'image-text';
  if (page.cards) return 'cards';
  return 'auto';
}

function normalizeCards(page) {
  if (page.cards && page.cards.length > 0) return page.cards;
  return contentToCards(page.content || []);
}

function contentToCards(contentArr) {
  if (!Array.isArray(contentArr)) return [];
  return contentArr.map(function(item, i) {
    if (typeof item === 'string') {
      // 尝试解析 "标题:内容" 格式
      var parts = item.split(/[:：]/);
      if (parts.length >= 2) {
        return { title: parts[0].trim(), value: parts.slice(1).join(':').trim(), sub: '' };
      }
      return { title: '要点 ' + (i + 1), value: item, sub: '' };
    }
    return item;
  });
}

function countPages(data) {
  var count = 0;
  if (data.cover) count++;
  if (data.table_of_contents) count++;
  var parts = data.parts || [];
  parts.forEach(function(part) {
    var pLen = (part.pages || []).length;
    var hasImg = !!(part.image || part.part_image);
    // 与 buildPptx 中的章节页策略一致
    if (pLen >= 3 || (pLen === 2 && hasImg)) count++;
    count += pLen;
  });
  if (data.end_page) count++;
  return count;
}

// ============================================================
// 模块导出 (供外部脚本调用)
// ============================================================

module.exports = {
  buildPptx: buildPptx,
  buildPage: buildPage,
  countPages: countPages,
  contentToCards: contentToCards,
};

// CLI 执行
if (require.main === module) {
  main();
}
