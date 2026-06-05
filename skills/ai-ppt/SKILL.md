---
name: ai-ppt
description: |
  智能演示文稿创建工具。需求调研 → JSON 大纲 → 图表生成 → build-ppt.js 一键出稿。
category: "design"
tags: "PPT, 演示文稿, 图表, 视觉设计"
---
# AI-PPT v1.3.0

核心原则：**规则在代码里，不在文档里。** AI 只负责写 JSON 大纲，所有布局、配色、边界、对比度规则由代码模块自动执行。

## 唯一合法流程（v1.3.0 简化版）

```bash
# 一口价：三步合一（推荐）
node scripts/make-ppt.js <outline.json> [output.pptx] [--theme <id>] [--preview] [--density compact|spacious]

# 或：分步执行
node scripts/chart-script-gen.js <outline.json>
python generate_charts.py
node scripts/build-ppt.js <outline.json> [output.pptx] [--theme <id>]

# 可选：单独校验大纲
node scripts/validate-outline.js <outline.json>

# 可选：HTML 结构预览（浏览器打开）
node scripts/preview-html.js <outline.json>
```

**禁止绕过 build-ppt.js 手写 pptxgenjs 脚本。**

## 新增功能（v1.3.0）

| 功能 | 说明 | CLI 参数 |
|------|------|---------|
| 一口价管线 | `make-ppt.js` 合并校验→图表→PPTX 三步 | |
| HTML 结构预览 | 借鉴 guizang-ppt-skill，浏览器打开预览幻灯片结构 | `--preview` |
| 版面节奏 | 借鉴 ppt-master，奇数页紧凑/偶数页呼吸感交替 | 自动 |
| 密度覆写 | 借鉴 huashu-design，全局控制卡片间距 | `--density compact\|spacious` |
| end_page.summary | 结尾页渲染 summary 数组（支持 ✓ 前缀） | 自动 |

**禁止绕过 build-ppt.js 手写 pptxgenjs 脚本。** 禁止直接调用 `slide.addText()` / `slide.addShape()` / `slide.addImage()`。禁止手写颜色常量和坐标计算。如果 build-ppt.js 不支持某种页面类型，扩展 `buildPage()` 路由，不要绕过它。

## JSON 大纲格式

AI 的核心产出物。参考 `architect-prompt.md` 调研需求，参考 `planning-guide.md` 规划内容。

```json
{
  "meta": { "theme": "dark-tech", "images_dir": "./slides" },
  "ppt_outline": {
    "cover": { "title": "标题", "sub_title": "副标题", "image": "cover-bg.png" },
    "table_of_contents": { "content": ["章节1", "章节2", "章节3"] },
    "parts": [
      {
        "part_title": "章节1",
        "image": "chapter1.png",
        "pages": [
          {
            "title": "页面标题",
            "render_mode": "chart",
            "chart_spec": {
              "chart_type": "bar",
              "labels": ["A", "B", "C"],
              "series": [{ "name": "系列1", "data": [10, 20, 30] }],
              "unit": "万", "show_data_labels": true
            },
            "insight": "关键洞察文字"
          },
          {
            "render_mode": "cards",
            "title": "数据卡片页",
            "cards": [
              { "title": "指标", "value": "100", "sub": "说明" },
              { "title": "带图卡片", "sub": "描述文字", "cardImage": "workflow.png", "span": 2 },
              { "title": "要点卡片", "points": ["要点1", "要点2", "要点3"] }
            ],
            "insight": "洞察（可选）"
          },
          {
            "render_mode": "image-text",
            "title": "图文页",
            "image": "photo.png",
            "points": ["要点1", "要点2", "要点3"]
          }
        ]
      }
    ],
    "end_page": { "title": "谢谢", "sub_title": "副标题" }
  }
}
```

### render_mode 类型

| render_mode | 必填字段 | 说明 |
|-------------|---------|------|
| `chart` | `chart_spec` | 图表页，支持 bar/line/pie/doughnut/area/scatter/radar |
| `cards` | `cards[]` | 数据卡片页，自动 2×2/3×2 网格布局 |
| `image-text` | `image` + `points[]` | 图文混排页 |
| (不填) | 自动推断 | 有 chart_spec → chart，有 image+points → image-text，有 cards → cards |

### cards 卡片字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 卡片标题 |
| `value` | string | 主值（短指标用大字号，长文本自动缩小） |
| `sub` | string | 副文案 |
| `cardImage` | string | 卡片内嵌图片路径（左文右图布局） |
| `points` | string[] | 要点列表（替代 value/sub，渲染为圆点列表） |
| `span` | number | 占几列宽度（默认 1，设为 2 则占两列） |

混合使用示例：4 张卡片，第 1 张 span:2 带图片占满上半行，第 2-4 张普通卡片排下半行。

### chart_spec 支持的 chart_type

`bar` / `line` / `pie` / `doughnut` / `area` / `scatter` / `radar`

其中 radar 和 scatter 走 pptxgenjs 原生渲染（不生成 Python 图片）。

## 主题系统

12 套内置主题，`build-ppt.js` 根据标题关键词自动推荐，无需 AI 手动选择。

| 类型 | 主题ID | 适用场景 |
|------|--------|---------|
| 深色 | `dark-gold` | 金融、贵金属 |
| 深色 | `dark-tech` | 科技、GPU、加密 |
| 深色 | `dark-green` | 环保、新能源 |
| 深色 | `dark-red` | 医药、健康 |
| 深色 | `dark-purple` | AI、创新 |
| 浅色 | `light-playful` | 玩具、儿童、亲子 |
| 浅色 | `light-nature` | 旅游、户外、景区 |
| 浅色 | `light-food` | 餐饮、咖啡、烘焙 |
| 浅色 | `light-fashion` | 服装、美妆 |
| 浅色 | `light-festival` | 开业、庆典、促销 |
| 通用 | `light-business` | 商务汇报 |
| 通用 | `light-warm` | 教育、文化 |

每套主题包含：6 色 palette（卡片循环取色）、渐变背景、独立背景色、配色变体。

**主题优先级**：CLI `--theme` > 标题关键词自动推荐 > `meta.theme` 兜底。

## 图片生成

使用 `image-prompt-builder.js` 构建 prompt，封面图自动添加 "no text" 后缀。

```javascript
const ipb = require('./scripts/image-prompt-builder');
const prompt = ipb.buildCoverPrompt('绿色经济', { style: 'cinematic' });
const manifest = ipb.buildImageManifest(outlineData, { style: 'cinematic' });
```

支持 4 种风格：`gradient-glass` / `vector-illustration` / `cinematic` / `minimal`

## 图表脚本

`chart-script-gen.js` 从 outline 自动生成 `generate_charts.py`，强制 import `chart_style.py`（中文字体 + 深色主题配色）。AI 不需要手写图表脚本。

## 核心模块

| 文件 | 职责 |
|------|------|
| `scripts/make-ppt.js` | **入口：一口价管线**（校验→图表→PPTX 三步合一） |
| `scripts/build-ppt.js` | 主管线：JSON → PPTX |
| `scripts/slide-builder.js` | 页面构建器（所有布局规则+版面节奏编码于此） |
| `scripts/chart-builder.js` | 图表构建器（chart_spec → 原生图表） |
| `scripts/themes.js` | 12 套主题 + palette + 渐变 + 关键词推荐 |
| `scripts/image-prompt-builder.js` | 图片 prompt 构建（规则 14 编码于此） |
| `scripts/chart_style.py` | Python 图表样式（中文字体 + 深色主题） |
| `scripts/chart-script-gen.js` | 从 outline 自动生成 Python 图表脚本 |
| `scripts/safe-path.js` | 中文路径安全（绕过 MSYS2 乱码） |
| `scripts/validate-outline.js` | 大纲校验器（字段缺失/类型错误/数据长度不一致拦截） |
| `scripts/preview-html.js` | HTML 结构预览（借鉴 guizang-ppt-skill） |

### 辅助工具（非管线核心）

| 文件 | 用途 |
|------|------|
| `scripts/inventory.py` | PPTX 文本提取 |
| `scripts/replace.py` | PPTX 文本替换 |
| `scripts/rearrange.py` | 幻灯片重排 |
| `scripts/thumbnail.py` | 缩略图生成 |
| `scripts/bento-layouts.js` | Bento Grid 布局计算（备用） |
| `scripts/svg-generator.js` | SVG 页面生成（备用） |

## 代码已自动处理的规则（AI 无需关心）

以下规则全部编码在模块中，build-ppt.js 管线自动执行，AI 不需要记忆或手动遵守：

- 布局尺寸 + 安全区 + 边界检查
- 图片强制 sizing（cover/contain 自动选择）
- 文字高度计算 + 循环元素均分
- 对比度保障（洞察条不透明 + 浅色主题自动选深色文字）
- pptxgenjs 参数类型安全（line.width 强制 number）
- 卡片 palette 循环取色 + 渐变背景
- 章节色彩节奏（奇偶交替 primary/accent）
- 卡片内容垂直居中 + 2×2/3×2 网格布局
- 章节页自动显示子页标题列表
- 目录页序号/标题字号自适应
- 页码避让洞察条
- 中文路径安全 + JS 中文内容安全
- 版面节奏：奇数页紧凑(dense) / 偶数页呼吸感(breathing) 交替
- 密度覆写：--density compact|spacious 全局控制卡片间距
- end_page.summary：结尾页支持 summary 数组渲染
- HTML 结构预览：--preview 生成浏览器可查看的幻灯片索引

## AI 需要做的事

1. **需求调研**（参考 `architect-prompt.md`）
2. **写 JSON 大纲**（参考 `planning-guide.md`，含 chart_spec / render_mode）
3. **生成图片**（用 `image-prompt-builder.js` 构建 prompt）
4. **跑三步命令**（chart-script-gen → python → build-ppt.js）

## AI 不能做的事

1. 手写 pptxgenjs 脚本
2. 手写颜色常量或坐标计算
3. 手写 `plt.rcParams` 或 matplotlib 字体配置
4. 绕过 build-ppt.js 直接调用 slide-builder API

## 洞察条使用原则

- 不是每页必须，只在有关键数据洞察时使用
- 活动策划类 PPT 中，卡片页通常不需要洞察条
- 图表页可以加洞察条总结数据趋势
- 空间不足时代码自动取消洞察条

## 依赖

```bash
# Python
pip install matplotlib numpy python-pptx pillow markitdown defusedxml

# Node.js
npm install pptxgenjs
```
