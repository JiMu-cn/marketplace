/**
 * chart-builder.js - 图表构建器
 *
 * 消费 planning-guide 中定义的 chart_spec，
 * 生成 pptxgenjs 原生图表，不再依赖外部 matplotlib。
 *
 * 用法:
 *   const cb = require('./chart-builder');
 *   cb.addChart(ctx, slide, chartSpec, { x, y, w, h });
 */

// ============================================================
// chart_spec → pptxgenjs 图表类型映射
// ============================================================

function getPptxChartType(pptx, specType) {
  var map = {
    'bar': pptx.ChartType.bar,
    'bar3d': pptx.ChartType.bar3D,
    'column': pptx.ChartType.bar,
    'line': pptx.ChartType.line,
    'area': pptx.ChartType.area,
    'pie': pptx.ChartType.pie,
    'doughnut': pptx.ChartType.doughnut,
    'scatter': pptx.ChartType.scatter,
    'radar': pptx.ChartType.radar,
  };
  return map[specType] || pptx.ChartType.bar;
}

// ============================================================
// 默认图表样式
// ============================================================

function getDefaultChartOpts(ctx, rect) {
  var isDark = ctx.isDark;
  return {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    showLegend: true,
    legendPos: 'b',
    legendFontSize: 10,
    legendColor: isDark ? 'CBD5E1' : '64748B',
    showTitle: false,
    // 坐标轴
    catAxisLabelColor: isDark ? 'CBD5E1' : '64748B',
    catAxisLabelFontSize: 10,
    catAxisLineShow: true,
    catAxisLineColor: isDark ? '334155' : 'E2E8F0',
    valAxisLabelColor: isDark ? 'CBD5E1' : '64748B',
    valAxisLabelFontSize: 10,
    valAxisLineShow: false,
    valAxisMajorGridColor: isDark ? '1E293B' : 'F1F5F9',
    // 背景 — 从主题取色，不硬编码
    plotArea: { fill: { color: isDark ? ctx.theme.background : 'FFFFFF', transparency: 100 } },
    chartArea: { fill: { color: isDark ? ctx.theme.background : 'FFFFFF', transparency: 100 } },
  };
}

// ============================================================
// 默认颜色序列
// ============================================================

var DEFAULT_COLORS = [
  '3B82F6', 'EF4444', '22C55E', 'F59E0B', '8B5CF6',
  'EC4899', '06B6D4', 'F97316', '14B8A6', '6366F1',
];

// ============================================================
// 核心函数: 添加图表
// ============================================================

/**
 * 根据 chart_spec 在 slide 上添加原生图表
 *
 * @param {object} ctx - slide-builder 的 context
 * @param {object} slide - pptxgenjs slide 对象
 * @param {object} spec - chart_spec 对象，格式见 planning-guide.md
 * @param {object} rect - { x, y, w, h } 图表区域
 * @param {object} [extraOpts] - 额外的 pptxgenjs 图表选项
 */
function addChart(ctx, slide, spec, rect, extraOpts) {
  if (!spec || !spec.chart_type) {
    console.warn('[chart-builder] Invalid chart_spec: missing chart_type');
    return;
  }

  var chartType = getPptxChartType(ctx.pptx, spec.chart_type);
  var opts = getDefaultChartOpts(ctx, rect);

  // 颜色
  var colors = spec.colors || DEFAULT_COLORS;
  opts.chartColors = colors;

  // 数据标签
  if (spec.show_data_labels) {
    opts.showValue = true;
    opts.dataLabelColor = ctx.isDark ? 'FFFFFF' : '1E293B';
    opts.dataLabelFontSize = 10;
  }

  // 单位后缀
  if (spec.unit) {
    opts.valAxisLabelFormatCode = '#,##0"' + spec.unit + '"';
  }

  // 饼图/环形图特殊处理
  if (spec.chart_type === 'pie' || spec.chart_type === 'doughnut') {
    opts.showLegend = true;
    opts.legendPos = 'r';
    opts.showPercent = true;
    opts.showValue = false;
    if (spec.show_data_labels) {
      opts.showPercent = true;
      opts.dataLabelColor = ctx.isDark ? 'FFFFFF' : '1E293B';
    }
  }

  // 折线图特殊处理
  if (spec.chart_type === 'line') {
    opts.lineSize = 2.5;
    opts.lineSmooth = false;
    opts.showMarker = true;
    opts.markerSize = 6;
  }

  // 合并额外选项
  if (extraOpts) {
    Object.assign(opts, extraOpts);
  }

  // 构建数据
  var chartData = buildChartData(spec);

  // 添加图表
  slide.addChart(chartType, chartData, opts);
}

/**
 * 将 chart_spec 转换为 pptxgenjs 数据格式
 */
function buildChartData(spec) {
  var labels = spec.labels || [];
  var series = spec.series || [];

  if (spec.chart_type === 'pie' || spec.chart_type === 'doughnut') {
    // 饼图: 单系列，labels + values
    var firstSeries = series[0] || { name: '', data: [] };
    return [{
      name: firstSeries.name || '',
      labels: labels,
      values: firstSeries.data || [],
    }];
  }

  if (spec.chart_type === 'scatter') {
    // 散点图: x/y 数据对
    return series.map(function(s) {
      return {
        name: s.name || '',
        values: s.data || [],
      };
    });
  }

  // 柱状图/折线图/面积图: 多系列
  return series.map(function(s) {
    return {
      name: s.name || '',
      labels: labels,
      values: s.data || [],
    };
  });
}

// ============================================================
// 便捷函数: 图表 + 摘要卡 + 洞察条 组合页
// ============================================================

/**
 * 创建完整的图表页（图表 + 可选摘要卡 + 可选洞察条）
 *
 * @param {object} ctx - slide-builder context
 * @param {object} config - 页面配置
 * @param {string} config.title - 页面标题
 * @param {object} config.chartSpec - chart_spec 对象
 * @param {Array}  [config.summaryCards] - 摘要卡数组 [{title, value, sub}]
 * @param {string} [config.insightText] - 洞察条文字
 * @param {string} [config.chartImagePath] - 如果有预生成的图表图片，优先使用
 */
function addChartSlide(ctx, config) {
  var sb = require('./slide-builder');
  var slide = ctx.pptx.addSlide();
  ctx.slideCount++;
  sb.applyBackground(ctx, slide, config.bgImagePath);

  // 标题栏：全宽面板 + 左侧强调条（从 palette 取色增加页面间变化）
  var palette = ctx.theme.palette || [ctx.theme.primary];
  var pageIdx = config.pageIndex || 0;
  var titleAccent = palette[pageIdx % palette.length];

  var titleBarH = 0.62;
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: 0, y: 0, w: ctx.W, h: titleBarH,
    fill: { color: ctx.theme.cardBg },
  });
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.08, h: titleBarH,
    fill: { color: titleAccent },
  });
  sb.addText(ctx, slide, config.title || '', {
    x: 0.22, y: 0, w: ctx.W - 0.4, h: titleBarH,
    fontSize: 18, bold: true, color: ctx.theme.text,
    fontFace: ctx.theme.fontTitle, valign: 'middle',
  });

  var hasCards = config.summaryCards && config.summaryCards.length > 0;
  var hasInsight = !!config.insightText;

  // 计算区域分配
  var chartY = titleBarH + 0.1;
  var cardsH = hasCards ? 0.75 : 0;
  var cardsGap = hasCards ? 0.12 : 0;
  var insightH = hasInsight ? ctx.BOTTOM.insightH : 0;
  var insightGap = hasInsight ? ctx.BOTTOM.gapAboveInsight + ctx.BOTTOM.reservedBottom : 0.3;
  var chartH = ctx.H - chartY - cardsH - cardsGap - insightH - insightGap;

  // 图表区域
  var chartRect = { x: ctx.SAFE.x, y: chartY, w: ctx.SAFE.w, h: chartH };

  if (config.chartImagePath && require('fs').existsSync(config.chartImagePath)) {
    // 使用预生成图片 (规则 7: 数据图表用 contain)
    sb.addImage(ctx, slide, config.chartImagePath,
      chartRect.x, chartRect.y, chartRect.w, chartRect.h,
      { sizingType: 'contain' });
  } else if (config.chartSpec) {
    // 使用原生图表
    addChart(ctx, slide, config.chartSpec, chartRect);
  }

  // 摘要卡
  if (hasCards) {
    var cardsY = chartY + chartH + cardsGap;
    var cardCount = config.summaryCards.length;
    var cardGap = 0.12;
    var cardW = (ctx.SAFE.w - cardGap * (cardCount - 1)) / cardCount;

    config.summaryCards.forEach(function(card, i) {
      var cx = ctx.SAFE.x + i * (cardW + cardGap);
      // palette 循环取色
      if (!card.accent) {
        card = Object.assign({}, card, { accent: palette[(pageIdx + i) % palette.length] });
      }
      sb.addDataCard(ctx, slide, cx, cardsY, cardW, cardsH, card);
    });
  }

  // 洞察条
  var chartInsightY = null;
  if (hasInsight) {
    var contentBottom = hasCards ? (chartY + chartH + cardsGap + cardsH) : (chartY + chartH);
    var iH = ctx.BOTTOM.insightH;
    chartInsightY = Math.max(
      contentBottom + ctx.BOTTOM.gapAboveInsight,
      ctx.H - iH - ctx.BOTTOM.reservedBottom
    );
    sb.addInsightBar(ctx, slide, config.insightText, { contentBottomY: contentBottom });
  }

  sb.addPageNumber(ctx, slide, ctx.slideCount, config.totalPages,
    chartInsightY ? { insightBarY: chartInsightY } : {});
  return slide;
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  addChart: addChart,
  addChartSlide: addChartSlide,
  buildChartData: buildChartData,
  getPptxChartType: getPptxChartType,
  DEFAULT_COLORS: DEFAULT_COLORS,
};
