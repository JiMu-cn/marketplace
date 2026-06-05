/**
 * validate-outline.js - JSON 大纲校验器
 *
 * 在 build-ppt.js 之前运行，拦截结构性错误。
 * 用法:
 *   node scripts/validate-outline.js <outline.json>
 *   或在代码中: require('./validate-outline').validate(data)
 */

var fs = require('fs');

function validate(data) {
  var errors = [];
  var warnings = [];

  // ========== cover ==========
  if (!data.cover) {
    errors.push('[cover] 缺少封面');
  } else {
    if (!data.cover.title) errors.push('[cover] 缺少 title');
  }

  // ========== table_of_contents ==========
  if (!data.table_of_contents) {
    warnings.push('[toc] 缺少目录页（可选）');
  } else if (!data.table_of_contents.content || data.table_of_contents.content.length === 0) {
    warnings.push('[toc] 目录内容为空');
  }

  // ========== parts ==========
  if (!data.parts || data.parts.length === 0) {
    errors.push('[parts] 缺少内容章节');
  } else {
    data.parts.forEach(function(part, pi) {
      var prefix = '[part ' + (pi + 1) + '] ';
      if (!part.part_title) warnings.push(prefix + '缺少 part_title');
      if (!part.pages || part.pages.length === 0) {
        errors.push(prefix + '没有任何页面');
        return;
      }

      part.pages.forEach(function(page, pgi) {
        var pp = prefix + 'page ' + (pgi + 1) + ': ';
        if (!page.title) warnings.push(pp + '缺少 title');

        // chart_spec 校验
        if (page.chart_spec) {
          var cs = page.chart_spec;
          if (!cs.chart_type) errors.push(pp + 'chart_spec 缺少 chart_type');
          if (!cs.labels || cs.labels.length === 0) errors.push(pp + 'chart_spec 缺少 labels');
          if (!cs.series || cs.series.length === 0) errors.push(pp + 'chart_spec 缺少 series');
          if (cs.labels && cs.series) {
            cs.series.forEach(function(s, si) {
              if (s.data && s.data.length !== cs.labels.length) {
                errors.push(pp + 'series[' + si + '].data 长度(' + s.data.length + ')与 labels 长度(' + cs.labels.length + ')不一致');
              }
            });
          }
        }

        // cards 校验
        if (page.cards) {
          if (page.cards.length > 8) {
            warnings.push(pp + '卡片数量 ' + page.cards.length + ' 过多（建议 ≤ 6）');
          }
          page.cards.forEach(function(card, ci) {
            if (!card.title && !card.value && !card.points) {
              warnings.push(pp + 'card[' + ci + '] 缺少 title/value/points，内容为空');
            }
            if (card.value && card.value.length > 100) {
              warnings.push(pp + 'card[' + ci + '].value 长度 ' + card.value.length + '（超过 100 字，字号会很小）');
            }
          });
        }

        // render_mode 与字段匹配
        var rm = page.render_mode;
        if (rm === 'chart' && !page.chart_spec) {
          errors.push(pp + 'render_mode=chart 但缺少 chart_spec');
        }
        if (rm === 'cards' && (!page.cards || page.cards.length === 0)) {
          errors.push(pp + 'render_mode=cards 但缺少 cards');
        }
        if (rm === 'image-text' && !page.image) {
          warnings.push(pp + 'render_mode=image-text 但缺少 image（将无图渲染）');
        }
      });
    });
  }

  // ========== end_page ==========
  if (!data.end_page) {
    warnings.push('[end] 缺少结尾页（可选）');
  }

  return { errors: errors, warnings: warnings, valid: errors.length === 0 };
}

// CLI
if (require.main === module) {
  var args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node validate-outline.js <outline.json>');
    process.exit(1);
  }
  var raw = JSON.parse(fs.readFileSync(args[0], 'utf-8'));
  var data = raw.ppt_outline || raw;
  var result = validate(data);

  if (result.warnings.length > 0) {
    console.log('Warnings (' + result.warnings.length + '):');
    result.warnings.forEach(function(w) { console.log('  ⚠ ' + w); });
  }
  if (result.errors.length > 0) {
    console.log('Errors (' + result.errors.length + '):');
    result.errors.forEach(function(e) { console.log('  ✗ ' + e); });
    process.exit(1);
  }
  console.log('✓ Outline valid (' + result.warnings.length + ' warnings)');
}

module.exports = { validate: validate };
