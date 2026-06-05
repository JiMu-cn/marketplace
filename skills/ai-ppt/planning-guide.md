# PPT 策划稿指南

> 策划稿 = 内容 + 版面规划，设计师的施工蓝图

## 策划稿 vs 设计稿

| 阶段 | 负责人 | 职责 | 输出 |
|------|--------|------|------|
| **策划稿** | 策划师 | 内容填充 + 版面规划 | 文字内容 + 卡片布局 |
| **设计稿** | 设计师 | 风格样式 + 视觉呈现 | SVG 页面 |

## 策划稿工作流程（策划闸门）

```
JSON 大纲（来自架构师）
    │
    ▼
内容填充 ──→ 每页内容细化
    │
    ▼
版面规划 ──→ 卡片布局设计
    │
    ▼
页面类型决策 ──→ page_type / render_mode / chart_spec
    │
    ▼
视觉资产规划 ──→ 哪些页需要生图/配图/图标/图表
    │
    ▼
策划闸门检查 ──→ 字段齐全才允许进入设计阶段
    │
    ▼
策划稿输出
```

## 视觉资产规划

视觉资产不是设计师的临时发挥，而是策划稿的正式组成部分。

### 必须回答的问题

策划师在出稿时，必须明确：
1. 哪些页面必须有图（封面、章节页、正文重点页、案例页）
2. 哪些页面只需要程序化背景，不需要生图
3. 哪些页面需要真实图表，而不是抽象插图
4. 若用户尚未确认是否需要生图，必须先回到需求确认阶段，不得直接生成完整成品

### 视觉资产规划输出示例

```json
{
  "visual_asset_plan": {
    "cover": { "asset_type": "generated-image", "required": true },
    "chapter_pages": { "asset_type": "generated-image", "required": true },
    "page-3": { "asset_type": "generated-image", "required": true, "reason": "重点趋势页" },
    "page-5": { "asset_type": "chart", "required": true, "reason": "数据页不能只用抽象图" },
    "page-6": { "asset_type": "background-only", "required": false }
  }
}
```

### 强制规则

- 若用户明确需要生图/配图，则策划稿必须输出 `visual_asset_plan`
- 若用户尚未确认视觉资产需求，**禁止直接生成只有首尾有图、正文无图的完整 PPT**
- 封面图和结尾图不能被视为“已经使用了生图能力”的充分证明
- 正文重点页若按内容逻辑需要视觉资产支撑，必须先向用户确认是否补图，再进入成稿
- 若 `page_type`、`render_mode`、`visual_asset_plan`、`chart_spec`（图表页）任一缺失，则**策划闸门不通过，不得进入设计阶段**
- 若页面同时存在图表/摘要卡/洞察条，必须额外输出 `content_bottom_y` 与 `insight_bar_mode`

### 洞察条联动字段

| 字段 | 说明 |
|------|------|
| `content_bottom_y` | 上方内容区的实际底部 y 值，用于计算洞察条避让 |
| `insight_bar_mode` | `adaptive` / `fixed`。复合页型必须使用 `adaptive` |

### 复合页型强制规则

只要页面属于以下任一情况：
- 图表 + 摘要卡 + 洞察条
- 时间线 + 事件卡 + 洞察条
- 图文混排 + 底部补充卡 + 洞察条

则：
1. `insight_bar_mode` 必须为 `adaptive`
2. 必须输出 `content_bottom_y`
3. 不得使用固定写死的洞察条 y 值

## 内容填充

### 每页内容细化

基于 JSON 大纲中的 `content` 数组，进行内容细化：

```json
{
  "title": "处理器性能",
  "content": [
    "4.3GHz 超大核 × 2，性能提升 40%",
    "3nm 制程工艺，能效比大幅提升",
    "安兔兔跑分 331 万+，登顶旗舰榜首"
  ]
}
```

细化后：

```json
{
  "title": "处理器性能",
  "type": "data-highlight",
  "cards": [
    {
      "id": "core-speed",
      "title": "超大核频率",
      "value": "4.3GHz",
      "sub": "× 2 核心"
    },
    {
      "id": "process",
      "title": "制程工艺",
      "value": "3nm",
      "sub": "能效比大幅提升"
    },
    {
      "id": "benchmark",
      "title": "安兔兔跑分",
      "value": "331万+",
      "sub": "登顶旗舰榜首"
    }
  ],
  "notes": "使用数据卡片突出关键性能指标"
}
```

### 内容类型

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `data-highlight` | 数据卡片 | 性能参数、统计数据 |
| `feature-list` | 特性列表 | 功能介绍、优势说明 |
| `comparison` | 对比表格 | 产品对比、方案比较 |
| `timeline` | 时间线 | 发展历程、项目计划 |
| `quote` | 引言卡片 | 领导讲话、客户评价 |
| `gallery` | 图片画廊 | 产品展示、案例分享 |
| `chart-placeholder` | 图表占位 | 需要数据可视化的内容 |

### 卡片增强字段（Bento Grid 混合布局）

除了基础的 `title` / `value` / `sub`，卡片还支持以下字段实现混合内容布局：

| 字段 | 类型 | 说明 |
|------|------|------|
| `cardImage` | string | 卡片内嵌图片路径，自动切换为左文右图布局 |
| `points` | string[] | 要点列表，替代 value/sub，渲染为圆点列表 |
| `span` | number | 占几列宽度（默认 1，设为 2 则占两列） |

**混合布局示例（参考 Bento Grid 风格）：**

```json
{
  "title": "核心价值",
  "render_mode": "cards",
  "cards": [
    {
      "title": "开发效率革命",
      "value": "10倍",
      "sub": "标准化流水线替代手工作坊",
      "span": 1
    },
    {
      "title": "可视化编排引擎",
      "sub": "零代码拖拽实现 RAG 与 Agent 逻辑",
      "cardImage": "workflow-diagram.png",
      "span": 1
    },
    {
      "title": "业务与技术深度解耦",
      "points": [
        "后端即服务 (BaaS)：RESTful API 快速增强现有业务",
        "全员参与生产：非技术人员可直接调优 Prompt"
      ],
      "span": 1
    },
    {
      "title": "生产级闭环支持",
      "value": "200+",
      "sub": "已集成模型数量及覆盖范围",
      "span": 1
    }
  ]
}
```

**使用原则：**
- 当页面需要展示多种内容类型（指标+图片+要点）时，使用混合卡片
- `span: 2` 适合带图片的卡片或需要更多空间的内容
- 同一页卡片总数建议 3-4 张，避免过于拥挤

## 页面类型与渲染模式

策划稿不能只告诉设计师“这一页有什么内容”，还必须告诉设计师“这一页应该怎么被渲染”。

### 必填字段

| 字段 | 说明 |
|------|------|
| `page_type` | 页面任务类型，如 `data-chart` / `data-highlight` / `timeline` / `summary` |
| `render_mode` | 页面渲染模式，如 `chart` / `cards` / `mixed` / `illustration` |
| `chart_spec` | 若 `render_mode=chart`，必须提供图表类型、标签、数列、单位 |
| `visual_asset_plan` | 该页是否需要生图/配图/图标/背景模板 |

### 强制规则

1. 只要页面核心信息是“趋势 / 对比 / 占比 / 排名 / 结构变化”，默认 `page_type = data-chart`
2. `data-chart` 页面默认 `render_mode = chart`，不得退化成抽象示意图
3. 只有在用户明确不要图表、或数据不足以成图时，才允许改为 `render_mode = cards`
4. 若 `render_mode = chart`，必须输出 `chart_spec`
5. 若 `chart_spec` 缺失，策划闸门不得通过

### chart_spec 示例

```json
{
  "chart_spec": {
    "chart_type": "bar",
    "labels": ["2017", "2021", "2023"],
    "series": [
      { "name": "算力", "data": [10, 200, 500] }
    ],
    "unit": "EH/s",
    "show_data_labels": true
  }
}
```

### 复合页型示例：图表 + 摘要卡 + 洞察条

```json
{
  "planning_draft": {
    "page_id": "gold-etf-holdings",
    "page_type": "data-chart",
    "layout_type": "chart-with-summary-cards",
    "render_mode": "chart",
    "insight_bar_mode": "adaptive",
    "content_bottom_y": 4.05,
    "chart_spec": {
      "chart_type": "line",
      "labels": ["2012", "2015", "2019"],
      "series": [{ "name": "ETF持仓", "data": [2700, 1500, 1600] }],
      "unit": "吨"
    },
    "summary_cards": [
      { "title": "2012峰值", "value": "~2,700吨", "sub": "SPDR持仓创纪录" },
      { "title": "2015谷底", "value": "~1,500吨", "sub": "市场情绪低迷" },
      { "title": "2019", "value": "~1,600吨", "sub": "开始回升" }
    ]
  }
}
```

## 版面规划：Bento Grid 布局

### 策划稿中的布局指定

在策划稿中，需要为每页指定 Bento Grid 布局：

```json
{
  "page_id": "performance",
  "layout": "two-col-asymmetric",
  "cards": [
    {
      "id": "main-content",
      "position": "left",
      "width": "2/3",
      "height": "full"
    },
    {
      "id": "supporting-data",
      "position": "right",
      "width": "1/3",
      "height": "full"
    }
  ]
}
```

### 布局类型与策划稿写法

#### 1. 单一焦点 (single-focus)

```
┌─────────────────────────────┐
│                             │
│        大卡片（整页）        │
│                             │
└─────────────────────────────┘
```

策划稿写法：
```json
{
  "layout": "single-focus",
  "cards": [
    {
      "id": "hero-content",
      "position": "center",
      "width": "full",
      "height": "full"
    }
  ]
}
```

#### 2. 两栏对称 (two-col-equal)

```
┌───────────┬───────────┐
│           │           │
│   左卡片   │   右卡片   │
│           │           │
└───────────┴───────────┘
```

策划稿写法：
```json
{
  "layout": "two-col-equal",
  "cards": [
    { "id": "left", "position": "left", "width": "50%" },
    { "id": "right", "position": "right", "width": "50%" }
  ]
}
```

#### 3. 两栏非对称 (two-col-asymmetric)

```
┌─────────────────┬───────┐
│                 │       │
│     主内容       │ 辅助  │
│    (2/3 宽度)   │ (1/3) │
│                 │       │
└─────────────────┴───────┘
```

策划稿写法：
```json
{
  "layout": "two-col-asymmetric",
  "cards": [
    { "id": "main", "position": "left", "width": "66%" },
    { "id": "sub", "position": "right", "width": "34%" }
  ]
}
```

#### 4. 三栏布局 (three-col)

```
┌───────┬───────┬───────┐
│       │       │       │
│  左   │  中   │  右   │
│       │       │       │
└───────┴───────┴───────┘
```

策划稿写法：
```json
{
  "layout": "three-col",
  "cards": [
    { "id": "left", "position": "left", "width": "33%" },
    { "id": "center", "position": "center", "width": "34%" },
    { "id": "right", "position": "right", "width": "33%" }
  ]
}
```

#### 5. 主次结合 (hero-with-sides)

```
┌─────┬───────────┬─────┐
│     │           │     │
│ 小  │   主体    │  小  │
│     │  (居中)   │     │
│     │           │     │
└─────┴───────────┴─────┘
```

策划稿写法：
```json
{
  "layout": "hero-with-sides",
  "cards": [
    { "id": "left-small", "position": "left", "width": "20%", "height": "partial" },
    { "id": "hero-main", "position": "center", "width": "60%" },
    { "id": "right-small", "position": "right", "width": "20%", "height": "partial" }
  ]
}
```

#### 6. 顶部英雄式 (hero-top)

```
┌─────────────────────────────┐
│       顶部大卡片            │
│       (英雄区域)            │
└─────────────────────────────┘
┌───────┬───────┬───────┐
│  小   │  小   │  小   │
└───────┴───────┴───────┘
```

策划稿写法：
```json
{
  "layout": "hero-top",
  "cards": [
    { "id": "hero", "position": "top", "width": "full", "height": "50%" },
    { "id": "grid", "position": "bottom", "width": "33%", "repeat": 3 }
  ]
}
```

#### 7. 混合网格 (mixed-grid)

```
┌─────────┬───────────────┐
│         │               │
│   中卡   │    大卡       │
│         │               │
├─────────┼───────────────┤
│ 小 (x2) │               │
│         │    大卡        │
└─────────┴───────────────┘
```

策划稿写法：
```json
{
  "layout": "mixed-grid",
  "cards": [
    { "id": "medium-1", "position": [0, 0], "width": "33%", "height": "50%" },
    { "id": "large-1", "position": [1, 0], "width": "67%", "height": "50%" },
    { "id": "small-1", "position": [0, 1], "width": "33%", "height": "25%" },
    { "id": "small-2", "position": [0, 2], "width": "33%", "height": "25%" },
    { "id": "large-2", "position": [1, 1], "width": "67%", "height": "50%" }
  ]
}
```

## 策划稿完整输出格式

```json
{
  "planning_draft": {
    "page_id": "processor-performance",
    "page_title": "处理器性能",
    "layout": "data-highlight",
    "layout_type": "three-col",

    "cards": [
      {
        "id": "core-speed",
        "title": "超大核频率",
        "content": {
          "value": "4.3GHz",
          "sub": "× 2 核心",
          "icon": "zap"
        }
      },
      {
        "id": "process",
        "title": "制程工艺",
        "content": {
          "value": "3nm",
          "sub": "能效比大幅提升",
          "icon": "cpu"
        }
      },
      {
        "id": "benchmark",
        "title": "安兔兔跑分",
        "content": {
          "value": "331万+",
          "sub": "登顶旗舰榜首",
          "icon": "trophy"
        }
      }
    ],

    "notes": "使用三栏数据卡片布局，突出三个关键性能指标",
    "design_hints": {
      "background": "浅色背景",
      "accent_color": "科技蓝 #0066FF",
      "font": "现代简约"
    }
  }
}
```

## 策划稿输出规范

1. 每页输出一个 `planning_draft` 对象
2. 明确指定 `layout_type`
3. 每个卡片必须有 `id` 和 `content`
4. 添加 `design_hints` 为设计师提供参考
5. 使用 `notes` 说明策划意图
6. 若页面存在侧栏小卡 / 紧凑指标卡，必须在策划稿中显式标注 `card_density: "compact"`
7. 当单卡高度预计小于 `0.9"` 时，策划稿不得沿用标准数据卡模板，必须注明使用紧凑指标卡布局
8. 若主值不是纯数字，而是中文短词或长文本值（如“谨慎”“增速放缓”“重构”），策划稿必须额外标注 `value_style: "compact-text"`，提醒设计师降低字号并改用紧凑布局

### 紧凑指标卡标注示例

```json
{
  "id": "policy-stance",
  "card_density": "compact",
  "title": "政策基调",
  "content": {
    "value": "谨慎",
    "sub": "维持观望"
  }
}
```

## 从大纲到策划稿的转换示例

### 输入：JSON 大纲（来自架构师）

```json
{
  "title": "处理器性能",
  "content": [
    "4.3GHz 超大核 × 2，性能提升 40%",
    "3nm 制程工艺，能效比大幅提升",
    "安兔兔跑分 331 万+，登顶旗舰榜首"
  ]
}
```

### 输出：策划稿

```json
{
  "planning_draft": {
    "page_id": "processor-performance",
    "page_title": "处理器性能",
    "layout": "data-highlight",
    "layout_type": "three-col",
    "cards": [
      {
        "id": "core-speed",
        "title": "超大核频率",
        "content": {
          "value": "4.3GHz",
          "sub": "× 2 核心",
          "detail": "性能提升 40%"
        }
      },
      {
        "id": "process",
        "title": "制程工艺",
        "content": {
          "value": "3nm",
          "sub": "能效比大幅提升"
        }
      },
      {
        "id": "benchmark",
        "title": "安兔兔跑分",
        "content": {
          "value": "331万+",
          "sub": "登顶旗舰榜首"
        }
      }
    ],
    "notes": "三栏数据卡片，每张卡片突出一个核心数据，配合图标增强视觉冲击"
  }
}
```
