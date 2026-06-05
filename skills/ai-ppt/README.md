# AI-PPT 纯净版安装指南

## 环境要求

- **Python**: 3.8+
- **Node.js**: 16+ (仅用于 pptxgenjs)

## 快速安装

### 1. Python 依赖

```bash
pip install -r requirements.txt
```

### 2. Node.js 依赖（可选，仅用于 pptxgenjs）

```bash
npm install
```

## 脚本说明

### Python 脚本

| 脚本 | 用途 |
|------|------|
| `scripts/inventory.py` | 从 PPTX 提取文本内容和结构 |
| `scripts/replace.py` | 批量替换 PPTX 中的文本 |
| `scripts/rearrange.py` | 重排 PPTX 幻灯片顺序 |
| `scripts/thumbnail.py` | 生成 PPTX 缩略图网格 |

### Node.js 脚本

| 脚本 | 用途 |
|------|------|
| `scripts/bento-layouts.js` | Bento Grid 布局计算 |
| `scripts/svg-generator.js` | SVG 页面生成 |

## 使用示例

### 提取 PPTX 文本清单

```bash
python scripts/inventory.py input.pptx output.json
```

### 批量替换文本

```bash
python scripts/replace.py input.pptx replacements.json output.pptx
```

### 重排幻灯片

```bash
python scripts/rearrange.py template.pptx output.pptx 0,2,1,3
```

### 生成缩略图

```bash
python scripts/thumbnail.py input.pptx thumbnails --cols 4
```

## 注意事项

- Python 脚本需要在 `ai-ppt` 目录下运行
- Node.js 脚本使用 CommonJS 模块格式
- 缩略图生成依赖 LibreOffice（需另行安装）和 pdfimages
