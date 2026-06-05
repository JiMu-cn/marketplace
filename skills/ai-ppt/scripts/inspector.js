/**
 * inspector.js - PPT 后置质量检查模块
 *
 * 在 build-ppt.js 完成后自动运行，扫描 JSON 大纲，输出质量分数和问题清单。
 * 不阻断生成流程（不会 exit(1)），而是输出警告供 AI 或用户决定是否修正。
 *
 * 6 维评分（每维 0-10 分，满分 60）：
 *   1. 信息密度 - 每页文字量是否合理
 *   2. 布局多样性 - 是否存在连续相同布局
 *   3. 标题质量 - 是否为断言句而非主题词
 *   4. 图表选型 - chart_type 与数据意图是否匹配
 *   5. 视觉一致性 - 卡片数量、insight 使用合理性
 *   6. 叙事完整性 - 是否有开头/中间/结尾结构
 *
 * 用法:
 *   node scripts/inspector.js <outline.json>
 *   或在代码中: require('./inspector').inspect(data)
 */

var fs = require('fs');

// ============================================================
// 主检查函数
// ============================================================

function inspect(data) {
  var score = 60;
  var issues = [];
  var pages = collectAllPages(data);

  // 维度 1: 信息密度
  var densityResult = checkDensity(pages);
  score -= densityResult.penalty;
  issues = issues.concat(densityResult.issues);

  // 维度 2: 布局多样性
  var diversityResult = checkLayoutDiversity(pages);
  score -= diversityResult.penalty;
  issues = issues.concat(diversityResult.issues);

  // 维度 3: 标题质量
  var titleResult = checkTitleQuality(pages);
  score -= titleResult.penalty;
  issues = issues.concat(titleResult.issues);

  // 维度 4: 图表选型
  var chartResult = checkChartSelection(pages);
  score -= chartResult.penalty;
  issues = issues.concat(chartResult.issues);

  // 维度 5: 视觉一致性
  var visualResult = checkVisualConsistency(pages);
  score -= visualResult.penalty;
  issues = issues.concat(visualResult.issues);

  // 维度 6: 叙事完整性
  var narrativeResult = checkNarrativeArc(data, pages);
  score -= narrativeResult.penalty;
  issues = issues.concat(narrativeResult.issues);

  score = Math.max(0, Math.min(60, score));

  return {
    score: score,
    maxScore: 60,
    grade: getGrade(score),
    issues: issues,
    pageCount: pages.length
  };
}

// ============================================================
// 维度 1: 信息密度
// ============================================================

function checkDensity(pages) {
  var penalty = 0;
  var issues = [];

  pages.forEach(function(page, idx) {
    var wordCount = countWords(page);
    if (wordCount > 100) {
      penalty += 2;
      issues.push({ dim: '信息密度', level: 'error', page: idx + 1, msg: '字数 ' + wordCount + '（>100，严重过密）' });
    } else if (wordCount > 70) {
      penalty += 1;
      issues.push({ dim: '信息密度', level: 'warn', page: idx + 1, msg: '字数 ' + wordCount + '（>70，偏密）' });
    }
  });

  // 上限 10 分
  penalty = Math.min(10, penalty);
  return { penalty: penalty, issues: issues };
}

function countWords(page) {
  var text = '';
  if (page.title) text += page.title;
  if (page.insight) text += page.insight;
  if (page.points) text += page.points.join('');
  if (page.cards) {
    page.cards.forEach(function(c) {
      if (c.title) text += c.title;
      if (c.value) text += c.value;
      if (c.sub) text += c.sub;
    });
  }
  if (page.timeline_items) {
    page.timeline_items.forEach(function(t) {
      if (t.title) text += t.title;
      if (t.desc) text += t.desc;
    });
  }
  if (page.steps) {
    page.steps.forEach(function(s) {
      if (s.title) text += s.title;
      if (s.desc) text += s.desc;
    });
  }
  if (page.left && page.left.points) text += page.left.points.join('');
  if (page.right && page.right.points) text += page.right.points.join('');
  if (page.quote_text) text += page.quote_text;
  return text.length;
}

// ============================================================
// 维度 2: 布局多样性
// ============================================================

function checkLayoutDiversity(pages) {
  var penalty = 0;
  var issues = [];

  var modes = pages.map(function(p) { return p.render_mode || inferMode(p); });

  // 检测最长连续相同布局
  var maxRun = 1;
  var runStart = 0;
  var currentMode = modes[0];
  var currentRun = 1;

  for (var i = 1; i < modes.length; i++) {
    if (modes[i] === currentMode) {
      currentRun++;
      if (currentRun > maxRun) {
        maxRun = currentRun;
        runStart = i - currentRun + 1;
      }
    } else {
      currentMode = modes[i];
      currentRun = 1;
    }
  }

  if (maxRun >= 5) {
    penalty += 4;
    issues.push({ dim: '布局多样性', level: 'error', page: runStart + 1, msg: '连续 ' + maxRun + ' 页使用 "' + modes[runStart] + '" 布局（严重单调）' });
  } else if (maxRun >= 4) {
    penalty += 3;
    issues.push({ dim: '布局多样性', level: 'warn', page: runStart + 1, msg: '连续 ' + maxRun + ' 页使用 "' + modes[runStart] + '" 布局' });
  } else if (maxRun >= 3) {
    penalty += 1;
    issues.push({ dim: '布局多样性', level: 'info', page: runStart + 1, msg: '连续 ' + maxRun + ' 页使用 "' + modes[runStart] + '" 布局（可接受但建议穿插）' });
  }

  // 检测布局类型总数
  var uniqueModes = [];
  modes.forEach(function(m) { if (uniqueModes.indexOf(m) === -1) uniqueModes.push(m); });
  if (pages.length >= 8 && uniqueModes.length <= 2) {
    penalty += 2;
    issues.push({ dim: '布局多样性', level: 'warn', page: null, msg: pages.length + ' 页内容只用了 ' + uniqueModes.length + ' 种布局，建议增加变化' });
  }

  penalty = Math.min(10, penalty);
  return { penalty: penalty, issues: issues };
}

// ============================================================
// 维度 3: 标题质量
// ============================================================

function checkTitleQuality(pages) {
  var penalty = 0;
  var issues = [];

  pages.forEach(function(page, idx) {
    if (!page.title) return;
    if (isTopicLabel(page.title)) {
      penalty += 1;
      issues.push({ dim: '标题质量', level: 'warn', page: idx + 1, msg: '"' + page.title + '" 是主题词，建议改为断言句（含数据或结论）' });
    }
  });

  penalty = Math.min(10, penalty);
  return { penalty: penalty, issues: issues };
}

function isTopicLabel(title) {
  if (!title) return false;
  // 纯主题词特征：<=8 字、无数字、无动词标记
  var hasNumber = /\d/.test(title);
  var len = title.length;

  if (len <= 6 && !hasNumber) return true;

  // 常见主题词后缀
  var suffixes = ['分析', '概述', '总结', '介绍', '背景', '现状', '趋势', '对比', '规划', '策略', '方案', '建议', '展望', '回顾'];
  if (len <= 10 && !hasNumber) {
    for (var i = 0; i < suffixes.length; i++) {
      if (title.endsWith(suffixes[i])) return true;
    }
  }

  return false;
}

// ============================================================
// 维度 4: 图表选型
// ============================================================

function checkChartSelection(pages) {
  var penalty = 0;
  var issues = [];

  pages.forEach(function(page, idx) {
    if (!page.chart_spec) return;
    var violation = validateChartType(page.chart_spec);
    if (violation) {
      penalty += violation.penalty;
      issues.push({ dim: '图表选型', level: violation.penalty >= 3 ? 'error' : 'warn', page: idx + 1, msg: violation.msg });
    }
  });

  penalty = Math.min(10, penalty);
  return { penalty: penalty, issues: issues };
}

/**
 * 校验图表类型与数据意图是否匹配
 * 返回 null 表示无问题，否则返回 { penalty, msg }
 */
function validateChartType(chartSpec) {
  var labels = chartSpec.labels || [];
  var type = chartSpec.chart_type;
  if (!type || labels.length === 0) return null;

  // 检测时间序列标签
  var timePatterns = /\d{4}|Q[1-4]|[一二三四]季度|\d+月|\d+年/;
  var timeCount = 0;
  labels.forEach(function(l) { if (timePatterns.test(l)) timeCount++; });
  var isTimeSeries = timeCount >= labels.length * 0.6;

  // 时间趋势 + 饼图/环形图 = 严重错误
  if (isTimeSeries && (type === 'pie' || type === 'doughnut')) {
    return { penalty: 3, msg: '时间趋势数据不应使用 ' + type + '，建议 line 或 bar' };
  }

  // 单系列分类数据 + line = 轻微不当
  var seriesCount = (chartSpec.series || []).length;
  if (!isTimeSeries && seriesCount === 1 && type === 'line') {
    return { penalty: 1, msg: '分类对比数据建议使用 bar 而非 line' };
  }

  // 过多分类 + 饼图 = 不当（>8 个分类饼图难以阅读）
  if (labels.length > 8 && (type === 'pie' || type === 'doughnut')) {
    return { penalty: 2, msg: labels.length + ' 个分类使用 ' + type + ' 难以阅读，建议 bar' };
  }

  return null;
}

// ============================================================
// 维度 5: 视觉一致性
// ============================================================

function checkVisualConsistency(pages) {
  var penalty = 0;
  var issues = [];

  pages.forEach(function(page, idx) {
    // 卡片过多
    if (page.cards && page.cards.length > 6) {
      penalty += 2;
      issues.push({ dim: '视觉一致性', level: 'warn', page: idx + 1, msg: '卡片 ' + page.cards.length + ' 张（>6），信息过载' });
    }

    // 图表页缺少 insight
    if (page.chart_spec && !page.insight) {
      penalty += 1;
      issues.push({ dim: '视觉一致性', level: 'info', page: idx + 1, msg: '图表页缺少 insight 总结' });
    }

    // timeline 条目过多
    if (page.timeline_items && page.timeline_items.length > 7) {
      penalty += 1;
      issues.push({ dim: '视觉一致性', level: 'warn', page: idx + 1, msg: '时间轴 ' + page.timeline_items.length + ' 项（>7），建议拆分' });
    }

    // process-steps 过多
    if (page.steps && page.steps.length > 6) {
      penalty += 1;
      issues.push({ dim: '视觉一致性', level: 'warn', page: idx + 1, msg: '流程步骤 ' + page.steps.length + ' 步（>6），建议精简' });
    }
  });

  penalty = Math.min(10, penalty);
  return { penalty: penalty, issues: issues };
}

// ============================================================
// 维度 6: 叙事完整性
// ============================================================

function checkNarrativeArc(data, pages) {
  var penalty = 0;
  var issues = [];

  // 检查是否有封面
  if (!data.cover || !data.cover.title) {
    penalty += 1;
    issues.push({ dim: '叙事完整性', level: 'warn', page: null, msg: '缺少封面标题' });
  }

  // 检查是否有结尾页
  if (!data.end_page) {
    penalty += 2;
    issues.push({ dim: '叙事完整性', level: 'warn', page: null, msg: '缺少结尾页（总结/行动号召）' });
  }

  // 检查内容页数量
  if (pages.length < 3) {
    penalty += 2;
    issues.push({ dim: '叙事完整性', level: 'warn', page: null, msg: '内容页仅 ' + pages.length + ' 页，内容过少' });
  }

  // 检查是否有数据支撑（至少 1 个图表或数据卡片）
  var hasData = pages.some(function(p) {
    return p.chart_spec || (p.cards && p.cards.some(function(c) { return /\d/.test(c.value || ''); }));
  });
  if (!hasData && pages.length >= 5) {
    penalty += 2;
    issues.push({ dim: '叙事完整性', level: 'warn', page: null, msg: '无数据支撑（无图表或数据卡片），说服力不足' });
  }

  // 检查章节结构
  var parts = data.parts || [];
  if (parts.length === 0) {
    penalty += 2;
    issues.push({ dim: '叙事完整性', level: 'error', page: null, msg: '无章节结构' });
  } else if (parts.length === 1 && pages.length >= 8) {
    penalty += 1;
    issues.push({ dim: '叙事完整性', level: 'info', page: null, msg: pages.length + ' 页内容只有 1 个章节，建议拆分为 2-4 个章节' });
  }

  penalty = Math.min(10, penalty);
  return { penalty: penalty, issues: issues };
}

// ============================================================
// 辅助函数
// ============================================================

function collectAllPages(data) {
  var pages = [];
  var parts = data.parts || [];
  parts.forEach(function(part) {
    (part.pages || []).forEach(function(page) {
      pages.push(page);
    });
  });
  return pages;
}

function inferMode(page) {
  if (page.chart_spec || page.chart_image) return 'chart';
  if (page.timeline_items) return 'timeline';
  if (page.left && page.right) return 'comparison';
  if (page.table_data) return 'table';
  if (page.steps) return 'process-steps';
  if (page.quote_text) return 'quote';
  if (page.image && (page.points || page.content)) return 'image-text';
  if (page.cards) return 'cards';
  return 'text-list';
}

function getGrade(score) {
  if (score >= 50) return 'A';
  if (score >= 40) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}

// ============================================================
// 格式化输出
// ============================================================

function formatReport(result) {
  var lines = [];
  lines.push('[Inspector] Score: ' + result.score + '/' + result.maxScore + ' (' + result.grade + ')');

  if (result.issues.length === 0) {
    lines.push('[Inspector] No issues found.');
  } else {
    result.issues.forEach(function(issue) {
      var prefix = issue.level === 'error' ? '  ✗' : issue.level === 'warn' ? '  ⚠' : '  ℹ';
      var pageStr = issue.page ? 'P' + issue.page + ' ' : '';
      lines.push(prefix + ' [' + issue.dim + '] ' + pageStr + issue.msg);
    });
  }

  return lines.join('
');
}

// ============================================================
// CLI
// ============================================================

if (require.main === module) {
  var args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node inspector.js <outline.json>');
    process.exit(1);
  }
  var raw = JSON.parse(fs.readFileSync(args[0], 'utf-8'));
  var data = raw.ppt_outline || raw;
  var result = inspect(data);
  console.log(formatReport(result));
  process.exit(result.grade === 'D' ? 1 : 0);
}

// ============================================================
// 模块导出
// ============================================================

module.exports = {
  inspect: inspect,
  formatReport: formatReport,
  validateChartType: validateChartType,
  isTopicLabel: isTopicLabel
};
