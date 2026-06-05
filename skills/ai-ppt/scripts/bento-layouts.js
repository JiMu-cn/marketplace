/**
 * Bento Grid Layout Calculator
 *
 * 根据布局类型和卡片配置，计算每个卡片的精确坐标和尺寸
 */

// 画布规格
var CANVAS = {
  width: 1280,
  height: 720,
  padding: 40,
  gap: 20
};

// 布局计算函数
var layouts = {
  /**
   * 单一焦点 - 一张大卡片覆盖大部分区域
   */
  'single-focus': function(config) {
    config = config || {};
    return [{
      id: 'hero',
      x: CANVAS.padding,
      y: CANVAS.padding,
      w: CANVAS.width - CANVAS.padding * 2,
      h: CANVAS.height - CANVAS.padding * 2
    }];
  },

  /**
   * 两栏对称 - 两张等宽卡片
   */
  'two-col-equal': function(config) {
    config = config || {};
    var availableWidth = CANVAS.width - CANVAS.padding * 2;
    var cardWidth = (availableWidth - CANVAS.gap) / 2;

    return [
      {
        id: 'left',
        x: CANVAS.padding,
        y: CANVAS.padding,
        w: cardWidth,
        h: CANVAS.height - CANVAS.padding * 2
      },
      {
        id: 'right',
        x: CANVAS.padding + cardWidth + CANVAS.gap,
        y: CANVAS.padding,
        w: cardWidth,
        h: CANVAS.height - CANVAS.padding * 2
      }
    ];
  },

  /**
   * 两栏非对称 - 主内容 2/3 + 辅助 1/3
   */
  'two-col-asymmetric': function(config) {
    config = config || {};
    var mainRatio = config.mainRatio || 0.66;
    var availableWidth = CANVAS.width - CANVAS.padding * 2;
    var mainWidth = (availableWidth - CANVAS.gap) * mainRatio;
    var sidebarWidth = availableWidth - mainWidth - CANVAS.gap;

    return [
      {
        id: 'main',
        x: CANVAS.padding,
        y: CANVAS.padding,
        w: mainWidth,
        h: CANVAS.height - CANVAS.padding * 2
      },
      {
        id: 'sidebar',
        x: CANVAS.padding + mainWidth + CANVAS.gap,
        y: CANVAS.padding,
        w: sidebarWidth,
        h: CANVAS.height - CANVAS.padding * 2
      }
    ];
  },

  /**
   * 三栏布局 - 三张等宽卡片
   */
  'three-col': function(config) {
    config = config || {};
    var availableWidth = CANVAS.width - CANVAS.padding * 2;
    var cardWidth = (availableWidth - CANVAS.gap * 2) / 3;

    return [
      {
        id: 'left',
        x: CANVAS.padding,
        y: CANVAS.padding,
        w: cardWidth,
        h: CANVAS.height - CANVAS.padding * 2
      },
      {
        id: 'center',
        x: CANVAS.padding + cardWidth + CANVAS.gap,
        y: CANVAS.padding,
        w: cardWidth,
        h: CANVAS.height - CANVAS.padding * 2
      },
      {
        id: 'right',
        x: CANVAS.padding + (cardWidth + CANVAS.gap) * 2,
        y: CANVAS.padding,
        w: cardWidth,
        h: CANVAS.height - CANVAS.padding * 2
      }
    ];
  },

  /**
   * 主次结合 - 一大居中 + 两侧小卡
   */
  'hero-with-sides': function(config) {
    config = config || {};
    var sideWidth = config.sideWidth || 240;
    var heroWidth = CANVAS.width - CANVAS.padding * 2 - sideWidth * 2 - CANVAS.gap * 2;
    var sideHeight = config.sideHeight || 320;
    var sideY = (CANVAS.height - sideHeight) / 2;

    return [
      {
        id: 'left-small',
        x: CANVAS.padding,
        y: sideY,
        w: sideWidth,
        h: sideHeight
      },
      {
        id: 'hero',
        x: CANVAS.padding + sideWidth + CANVAS.gap,
        y: CANVAS.padding,
        w: heroWidth,
        h: CANVAS.height - CANVAS.padding * 2
      },
      {
        id: 'right-small',
        x: CANVAS.width - CANVAS.padding - sideWidth,
        y: sideY,
        w: sideWidth,
        h: sideHeight
      }
    ];
  },

  /**
   * 顶部英雄式 - 顶部大卡片 + 下方多张小卡片
   */
  'hero-top': function(config) {
    config = config || {};
    var heroHeight = config.heroHeight || 280;
    var bottomCardWidth = (CANVAS.width - CANVAS.padding * 2 - CANVAS.gap * 2) / 3;
    var bottomY = CANVAS.padding + heroHeight + CANVAS.gap;
    var bottomHeight = CANVAS.height - bottomY - CANVAS.padding;

    return [
      {
        id: 'hero',
        x: CANVAS.padding,
        y: CANVAS.padding,
        w: CANVAS.width - CANVAS.padding * 2,
        h: heroHeight
      },
      {
        id: 'item1',
        x: CANVAS.padding,
        y: bottomY,
        w: bottomCardWidth,
        h: bottomHeight
      },
      {
        id: 'item2',
        x: CANVAS.padding + bottomCardWidth + CANVAS.gap,
        y: bottomY,
        w: bottomCardWidth,
        h: bottomHeight
      },
      {
        id: 'item3',
        x: CANVAS.padding + (bottomCardWidth + CANVAS.gap) * 2,
        y: bottomY,
        w: bottomCardWidth,
        h: bottomHeight
      }
    ];
  },

  /**
   * 混合网格 - 自由组合不同尺寸卡片
   */
  'mixed-grid': function(config) {
    config = config || {};
    var availableWidth = CANVAS.width - CANVAS.padding * 2;
    var col1Width = config.col1Width || availableWidth * 0.33;
    var col2Width = availableWidth - col1Width - CANVAS.gap;
    var halfHeight = (CANVAS.height - CANVAS.padding * 2 - CANVAS.gap) / 2;
    var smallWidth = (col1Width - CANVAS.gap) / 2;

    return [
      {
        id: 'medium',
        x: CANVAS.padding,
        y: CANVAS.padding,
        w: col1Width,
        h: halfHeight
      },
      {
        id: 'large-top',
        x: CANVAS.padding + col1Width + CANVAS.gap,
        y: CANVAS.padding,
        w: col2Width,
        h: halfHeight
      },
      {
        id: 'small-1',
        x: CANVAS.padding,
        y: CANVAS.padding + halfHeight + CANVAS.gap,
        w: smallWidth,
        h: halfHeight
      },
      {
        id: 'small-2',
        x: CANVAS.padding + smallWidth + CANVAS.gap,
        y: CANVAS.padding + halfHeight + CANVAS.gap,
        w: smallWidth,
        h: halfHeight
      },
      {
        id: 'large-bottom',
        x: CANVAS.padding + col1Width + CANVAS.gap,
        y: CANVAS.padding + halfHeight + CANVAS.gap,
        w: col2Width,
        h: halfHeight
      }
    ];
  },

  /**
   * 图表 + 摘要卡 - 上方大图表，下方三张摘要卡，底部预留洞察条安全区
   */
  'chart-with-summary-cards': function(config) {
    config = config || {};
    var insightH = config.insightH || 55;
    var gapAboveInsight = config.gapAboveInsight || 12;
    var reservedBottom = config.reservedBottom || 15;
    var summaryH = config.summaryH || 72;
    var summaryGap = config.summaryGap || 18;
    var chartY = CANVAS.padding + 55;
    var chartH = config.chartH || 250;
    var summaryY = chartY + chartH + 20;
    var contentMaxY = CANVAS.height - insightH - gapAboveInsight - reservedBottom;
    var cardWidth = (CANVAS.width - CANVAS.padding * 2 - CANVAS.gap * 2) / 3;

    if (summaryY + summaryH > contentMaxY) {
      summaryY = contentMaxY - summaryH;
    }

    return [
      {
        id: 'chart',
        x: CANVAS.padding,
        y: chartY,
        w: CANVAS.width - CANVAS.padding * 2,
        h: chartH
      },
      {
        id: 'summary-1',
        x: CANVAS.padding,
        y: summaryY,
        w: cardWidth,
        h: summaryH
      },
      {
        id: 'summary-2',
        x: CANVAS.padding + cardWidth + CANVAS.gap,
        y: summaryY,
        w: cardWidth,
        h: summaryH
      },
      {
        id: 'summary-3',
        x: CANVAS.padding + (cardWidth + CANVAS.gap) * 2,
        y: summaryY,
        w: cardWidth,
        h: summaryH
      }
    ];
  }
};

/**
 * 计算布局
 * @param {string} layoutType - 布局类型
 * @param {object} config - 布局配置
 * @returns {array} 卡片数组，包含每个卡片的 x, y, w, h
 */
function calculateLayout(layoutType, config) {
  var calculator = layouts[layoutType];
  if (!calculator) {
    throw new Error('Unknown layout type: ' + layoutType);
  }
  return calculator(config);
}

/**
 * 获取支持的布局类型列表
 */
function getSupportedLayouts() {
  return Object.keys(layouts);
}

/**
 * 根据卡片数量自动推荐布局
 * @param {number} cardCount - 卡片数量
 * @returns {string} 推荐的布局类型
 */
function recommendLayout(cardCount) {
  var recommendations = {
    1: 'single-focus',
    2: 'two-col-equal',
    3: 'three-col',
    4: 'hero-top',
    5: 'mixed-grid'
  };
  return recommendations[cardCount] || 'mixed-grid';
}

// 导出
module.exports = {
  calculateLayout: calculateLayout,
  getSupportedLayouts: getSupportedLayouts,
  recommendLayout: recommendLayout,
  CANVAS: CANVAS,
  layouts: layouts
};
