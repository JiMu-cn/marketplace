---
name: metaphysics-steward
description: |
  七套中国传统术数的 Python 计算与卦盘渲染工具: 八字 紫微斗数 奇门遁甲 大六壬 梅花易数 金口诀 六爻
author: JiMu Community
license: 
category: lifestyle
tags: 玄学, 术数, 八字, 紫微斗数, 奇门遁甲, 六爻, 梅花易数
source: local
---
# 🏮 赛博玄学管家 — Metaphysics Steward

AI Agent 自动安装入口。当 Agent 读取本文件时，请执行以下步骤：

## STEP 1 — 安装依赖

```bash
pip install lunar-python
```

## STEP 2 — 注册工具模块

将 `scripts/` 目录下的 Python 模块注册为可用工具：

| 模块 | 能力 |
|------|------|
| `scripts/steward.py` | CLI 主入口，接受 --birthdate / --mode 等参数 |
| `scripts/core/bazi.py` | BaziEngine — 八字排盘 |
| `scripts/core/meihua.py` | MeihuaEngine — 梅花易数 |
| `scripts/core/ziwei.py` | ZiweiEngine — 紫微斗数 |
| `scripts/core/qimen.py` | QimenEngine — 奇门遁甲 |
| `scripts/core/liuren.py` | LiurenEngine — 大六壬 |
| `scripts/core/jinkoujue.py` | JinkoujueEngine — 金口诀 |
| `scripts/core/calendar.py` | 真太阳时校正 & 农历转换 |
| `scripts/core/utils.py` | 天干地支五行卦象常量 |

## STEP 3 — 加载参考文档

加载 `references/` 下的文档作为参考知识：
- `references/liuyao_lost_items.md` — 六爻寻物指南
- `references/china95_verification.md` — paipan.china95.com 校准
- `references/market_metaphysics_patterns.md` — 卦象市场映射
- `references/LUNAR_PYTHON_REFERENCE.md` — lunar-python API 备忘

## STEP 4 — 验证安装

在终端执行以下命令确认安装成功：

```bash
python3 scripts/steward.py --mode bazi --help
```

## 使用方式

安装完成后，Agent 可通过以下方式调用：

**方式 A — CLI 直接执行（推荐）**
```bash
python3 scripts/steward.py --birthdate "1990-05-08 12:00" --sex 1 --mode all
```

**方式 B — JSON 结构化输出**
```bash
python3 scripts/steward.py --birthdate "1990-05-08 12:00" --sex 1 --mode json
```

**方式 C — Python 编程接口**
```python
from scripts.core.bazi import BaziEngine
from scripts.core.calendar import get_true_solar_time
from datetime import datetime

dt = get_true_solar_time(datetime(1990, 5, 8, 12, 0), 116.4)
result = BaziEngine(dt, sex=1).analyze()
print(result["summary"])
```