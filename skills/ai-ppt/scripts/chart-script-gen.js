/**
 * chart-script-gen.js - Python 图表脚本生成器
 *
 * 根据 outline JSON 中的 chart_spec，自动生成 generate_charts.py 脚本。
 * 生成的脚本强制 import chart_style.py，从根源杜绝中文字体问题。
 *
 * 用法:
 *   node chart-script-gen.js <outline.json> [output_dir]
 *
 * 或在代码中:
 *   const csg = require('./chart-script-gen');
 *   const script = csg.generateScript(outlineData, { outputDir: './slides' });
 *   fs.writeFileSync('generate_charts.py', script);
 */

var fs = require('fs');
var NL = String.fromCharCode(10);
var path = require('path');

// ============================================================
// 图表类型 → Python 绘图代码模板
// ============================================================

var CHART_TEMPLATES = {
  bar: function(spec, varName) {
    var lines = [];
    lines.push('def chart_' + varName + '():');
    lines.push('    labels = ' + JSON.stringify(spec.labels));
    spec.series.forEach(function(s, i) {
      lines.push('    data_' + i + ' = ' + JSON.stringify(s.data) + '  # ' + s.name);
    });
    lines.push('    x = np.arange(len(labels))');
    if (spec.series.length === 1) {
      lines.push('    fig, ax = setup()');
      lines.push("    bars = ax.bar(x, data_0, color=SERIES[0], alpha=0.85, label='" + spec.series[0].name + "')");
      lines.push('    ax.set_xticks(x); ax.set_xticklabels(labels)');
      if (spec.show_data_labels) {
        lines.push('    for bar in bars:');
        lines.push('        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.5,');
        lines.push("                f'{bar.get_height():.0f}', ha='center', color=SERIES[0], fontsize=9)");
      }
    } else {
      lines.push('    w = ' + (0.8 / spec.series.length).toFixed(2));
      lines.push('    fig, ax = setup()');
      spec.series.forEach(function(s, i) {
        var offset = (i - (spec.series.length - 1) / 2).toFixed(1);
        lines.push("    ax.bar(x + " + offset + "*w, data_" + i + ", w, color=SERIES[" + i + "], alpha=0.85, label='" + s.name + "')");
      });
      lines.push('    ax.set_xticks(x); ax.set_xticklabels(labels)');
    }
    lines.push("    ax.set_title('" + (spec._title || '') + "', color='white', fontsize=14, pad=10)");
    lines.push('    style_legend(ax)');
    lines.push("    save(fig, os.path.join(OUT, 'chart-" + varName + ".png'))");
    return lines.join(NL);
  },

  line: function(spec, varName) {
    var lines = [];
    lines.push('def chart_' + varName + '():');
    lines.push('    labels = ' + JSON.stringify(spec.labels));
    spec.series.forEach(function(s, i) {
      lines.push('    data_' + i + ' = ' + JSON.stringify(s.data) + '  # ' + s.name);
    });
    lines.push('    fig, ax = setup()');
    spec.series.forEach(function(s, i) {
      lines.push("    ax.plot(labels, data_" + i + ", color=SERIES[" + i + "], lw=2.5, marker='o', ms=5, label='" + s.name + "')");
    });
    lines.push("    ax.set_title('" + (spec._title || '') + "', color='white', fontsize=14, pad=10)");
    lines.push('    style_legend(ax)');
    lines.push("    save(fig, os.path.join(OUT, 'chart-" + varName + ".png'))");
    return lines.join(NL);
  },

  pie: function(spec, varName) {
    var lines = [];
    lines.push('def chart_' + varName + '():');
    lines.push('    labels = ' + JSON.stringify(spec.labels));
    lines.push('    sizes = ' + JSON.stringify(spec.series[0].data));
    lines.push('    colors = SERIES[:len(labels)]');
    lines.push('    fig, ax = setup()');
    lines.push('    ax.grid(visible=False)');
    lines.push("    wedges, texts, autotexts = ax.pie(sizes, labels=labels, colors=colors,");
    lines.push("        autopct='%1.0f%%', startangle=140, pctdistance=0.75,");
    lines.push("        textprops={'color': 'white', 'fontsize': 9},");
    lines.push("        wedgeprops={'linewidth': 1.5, 'edgecolor': COLORS['bg']})");
    lines.push("    for at in autotexts:");
    lines.push("        at.set_color(COLORS['bg']); at.set_fontweight('bold')");
    lines.push("    ax.set_title('" + (spec._title || '') + "', color='white', fontsize=14, pad=10)");
    lines.push("    save(fig, os.path.join(OUT, 'chart-" + varName + ".png'))");
    return lines.join(NL);
  },
};

// area/doughnut/column 降级为对应的 matplotlib 模板
CHART_TEMPLATES.area = CHART_TEMPLATES.line;
CHART_TEMPLATES.doughnut = CHART_TEMPLATES.pie;
CHART_TEMPLATES.column = CHART_TEMPLATES.bar;

// pptxgenjs 原生支持好的类型，不生成 Python 图片（避免降级失真）
var NATIVE_ONLY_TYPES = { 'radar': true, 'scatter': true };

// ============================================================
// 核心函数
// ============================================================

/**
 * 从 outline 中提取所有 chart_spec，生成完整的 Python 脚本
 */
function generateScript(outlineData, opts) {
  opts = opts || {};
  var outputDir = opts.outputDir || './slides';
  var skillDir = opts.skillDir || '~/.jimu/skills/ai-ppt/scripts';

  var charts = extractCharts(outlineData);
  if (charts.length === 0) return null;

  var lines = [];

  // 文件头 — 强制 import chart_style
  lines.push('"""Auto-generated chart script — DO NOT manually configure fonts/colors."""');
  lines.push('import sys, os');
  lines.push("sys.path.insert(0, os.path.expanduser('" + skillDir + "'))");
  lines.push('from chart_style import setup, setup_dual, save, COLORS, style_legend, SERIES_COLORS');
  lines.push('import numpy as np');
  lines.push('');
  lines.push("OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '" + outputDir + "')");
  lines.push('os.makedirs(OUT, exist_ok=True)');
  lines.push('SERIES = SERIES_COLORS');
  lines.push('');

  // 各图表函数
  var callLines = [];
  charts.forEach(function(chart) {
    // 跳过 pptxgenjs 原生支持好的类型（radar/scatter），避免降级失真
    if (NATIVE_ONLY_TYPES[chart.spec.chart_type]) return;
    var template = CHART_TEMPLATES[chart.spec.chart_type];
    if (!template) {
      template = CHART_TEMPLATES.bar; // 降级
    }
    lines.push(template(chart.spec, chart.id));
    lines.push('');
    callLines.push('chart_' + chart.id + '()');
  });

  // 调用
  callLines.forEach(function(c) { lines.push(c); });
  lines.push("print('all charts done')");

  return lines.join(NL);
}

/**
 * 从 outline 中提取所有带 chart_spec 的页面
 */
function extractCharts(data) {
  var charts = [];
  var pageNum = 3; // 封面=1, 目录=2, 从3开始
  var parts = data.parts || [];
  parts.forEach(function(part) {
    pageNum++; // 章节页
    var pages = part.pages || [];
    pages.forEach(function(page) {
      pageNum++;
      if (page.chart_spec) {
        var spec = JSON.parse(JSON.stringify(page.chart_spec)); // deep copy
        spec._title = page.title || '';
        charts.push({
          id: 'p' + pageNum,
          pageTitle: page.title,
          spec: spec,
        });
      }
    });
  });
  return charts;
}

// ============================================================
// CLI
// ============================================================

function main() {
  var args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node chart-script-gen.js <outline.json> [output_dir]');
    process.exit(1);
  }

  var outline = JSON.parse(fs.readFileSync(args[0], 'utf-8'));
  var data = outline.ppt_outline || outline;
  var outputDir = args[1] || './slides';

  var script = generateScript(data, { outputDir: outputDir });
  if (!script) {
    console.log('No chart_spec found in outline.');
    process.exit(0);
  }

  var outPath = path.join(path.dirname(args[0]), 'generate_charts.py');
  fs.writeFileSync(outPath, script, 'utf-8');
  console.log('Generated: ' + outPath);
  console.log('Charts found: ' + extractCharts(data).length);
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  generateScript: generateScript,
  extractCharts: extractCharts,
  CHART_TEMPLATES: CHART_TEMPLATES,
};

if (require.main === module) {
  main();
}
