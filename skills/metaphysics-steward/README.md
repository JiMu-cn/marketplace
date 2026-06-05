# 🏮 赛博玄学管家 — Metaphysics Steward

> **把七套中国传统术数装进 Python，在终端里把命盘玩明白**
> 7 Chinese metaphysics engines in pure Python — Bazi, Ziwei, Qimen, Liuren, Meihua, Jinkoujue, Liuyao

**免责声明：** 本工具仅供 **传统文化技术研究与学习交流** 使用。命运掌握在自己手中，请理性看待玄学分析结果，切勿据此做出重大人生或财务决策。

**项目特性：**
- ✅ 七套完整术数引擎，命令行一键出盘
- ✅ 真太阳时校正（经度 + 均时差双重校正）
- ✅ 内置全国 30+ 城市经纬度，自动识别城市名
- ✅ JSON 输出模式，方便与其他程序 / AI 集成
- ✅ 纯 Python 3，依赖仅 `lunar-python`
- ✅ 不依赖任何专有平台，CLI / Python API 两用

---

## 🤖 AI Agent / 自动安装为 Skill

> 本仓库内置了完整的 **SKILL.md** 元数据，支持 AI Agent（如 Hermes Agent、Claude Code、Codex CLI 等）访问仓库后**自动识别并安装为 Skill**。

### 自动安装流程

当 AI Agent 打开本仓库时，它会自动检测根目录下的 `SKILL.md` 文件。Agent 会：

1.  读取 `SKILL.md` 中的元数据（名称、描述、标签）
2.  将 `scripts/` 下的所有 Python 模块注册为可用工具
3.  将 `references/` 下的文档加载为参考知识
4.  用户即可直接通过 Agent 调用玄学分析，无需手动安装

### 手动安装（Hermes Agent）

如果你是 Hermes Agent 用户，手动安装也一样简单：

```bash
# 克隆到 Hermes 的 skills 目录
git clone https://github.com/superzhang21/metaphysics-steward.git \
  ~/.hermes/skills/creative/metaphysics-steward

# 安装依赖
pip install lunar-python

# 在 Agent 中加载
# 方式一：对话中手动加载
# skill_view(name='metaphysics-steward')
#
# 方式二：加入自动加载列表（编辑 config.yaml）
# skills:
#   auto_load:
#     - metaphysics-steward
```

### 通用使用（任何 AI Agent）

即使不用 Hermes，任何支持工具调用的 AI Agent 也可以直接调用本项目的 CLI：

```bash
# Agent 通过终端执行
python3 scripts/steward.py --birthdate "1990-05-08 12:00" --sex 1 --mode bazi

# 或使用 JSON 输出模式结构化返回
python3 scripts/steward.py --birthdate "1990-05-08 12:00" --sex 1 --mode json
```

Agent 解析 JSON 输出后，就可以把玄学分析结果融入自己的对话或下游流程中。

---

## 📋 目录

- [安装](#-安装)
- [快速上手：一条命令跑七套](#️-快速上手一条命令跑七套)
- [各术数详解与示例](#-各术数详解与示例)
  - [八字（Bazi / Four Pillars）](#1-八字-bazi)
  - [紫微斗数（Ziwei Doushu）](#2-紫微斗数-ziwei)
  - [奇门遁甲（Qimen Dun Jia）](#3-奇门遁甲-qimen)
  - [大六壬（Da Liuren）](#4-大六壬-da-liuren)
  - [梅花易数（Meihua Yishu）](#5-梅花易数-meihua)
  - [金口诀（Jinkoujue）](#6-金口诀-jinkoujue)
  - [六爻（Liuyao · 参考指南）](#7-六爻-liuyao--参考指南)
- [JSON 输出模式](#-json-模式与其他程序集成)
- [Python 编程接口](#-python-编程接口)
- [经度与城市名支持](#-经度与城市名支持)
- [精度说明](#-精度说明)
- [项目结构](#-项目结构)
- [常见问题 FAQ](#-常见问题)
- [许可证](#-许可证)

---

## 🛠️ 安装

```bash
# 克隆项目
git clone https://github.com/superzhang21/metaphysics-steward.git
cd metaphysics-steward

# 安装依赖（仅 lunar-python）
pip install lunar-python

# 验证安装
python3 scripts/steward.py --help
```

> 国内用户安装依赖可加镜像：`pip install lunar-python -i https://pypi.tuna.tsinghua.edu.cn/simple`

---

## ⚡ 快速上手：一条命令跑七套

```bash
# 用当前时间跑所有术数，全自动
python3 scripts/steward.py

# 指定出生信息，全量输出
python3 scripts/steward.py --birthdate "1990-05-08 12:00" --sex 1 --birthplace "北京" --mode all
```

---

## 🔮 各术数详解与示例

### 1️⃣ 八字（Bazi）

**命令格式：**
```bash
python3 scripts/steward.py --birthdate "YYYY-MM-DD HH:MM" --sex [0|1] --birthplace [经度|城市名] --mode bazi
```

**示例 1：男性八字**
```bash
python3 scripts/steward.py --birthdate "1990-05-08 12:00" --sex 1 --mode bazi
```
输出：
```
八字排盘 [乾造]
公历: 1990-05-08 12:00:00
农历: 一九九〇年四月十四
------------------------------------------
       年柱        月柱        日柱        时柱
 十神   食神        正财        日主        偏财
 天干   庚          戊          壬          丙
 地支   午          辰          午          午
 纳音   路旁土      大林木      杨柳木      天河水
------------------------------------------
 藏干  丁己        戊乙癸      丁己        丁己
------------------------------------------
起运: 2年9个月9天起运
时间: 1993-02-17 21:09:00
大运: 己巳(3) 庚午(13) 辛未(23) 壬申(33) 癸酉(43) 甲戌(53) 乙亥(63) 丙子(73)
```

**示例 2：女性八字 + 指定城市（自动校正真太阳时）**
```bash
python3 scripts/steward.py --birthdate "1995-12-25 08:30" --sex 0 --birthplace "上海" --mode bazi
```

**示例 3：直接指定经度**
```bash
python3 scripts/steward.py --birthdate "2000-01-15 14:20" --sex 1 --birthplace 106.5 --mode bazi
```

**示例 4：只看当前时辰的八字（默认值）**
```bash
python3 scripts/steward.py --mode bazi
```

**示例 5：西部城市（乌鲁木齐经度 87.6°E，与东八区差约 2 小时）**
```bash
python3 scripts/steward.py --birthdate "1990-05-08 12:00" --sex 1 --birthplace "乌鲁木齐" --mode bazi
```

**参数说明：**
| 参数 | 说明 | 必填 | 默认值 |
|------|------|------|--------|
| `--birthdate` | 出生时间，格式 `YYYY-MM-DD HH:MM` | 否 | 当前时间 |
| `--sex` | 性别：1 = 男（乾造），0 = 女（坤造） | 否 | 1 |
| `--birthplace` | 城市名或经度数值，如 "北京" 或 116.4 | 否 | 120.0（东八区） |
| `--mode` | 分析模式 | 是 | — |

---

### 2️⃣ 紫微斗数（Ziwei）

**命令格式：**
```bash
python3 scripts/steward.py --birthdate "YYYY-MM-DD HH:MM" --mode ziwei
```

**示例 6：紫微斗数全盘**
```bash
python3 scripts/steward.py --birthdate "1988-08-08 20:00" --mode ziwei
```
输出：
```
紫微命盘 [水二局]
┌──────────┬──────────┬──────────┬──────────┐
│ 交友     │ 官禄     │ 田宅     │ 福德     │
│ 天同     │ 武曲     │ 太阳     │ 天府     │
│ 辰       │ 巳       │ 午       │ 未       │
├──────────┼──────────┼──────────┼──────────┤
│ 迁移     │          │          │ 父母     │
│ 破军     │          │          │ 太阴     │
│ 卯       │          │          │ 申       │
├──────────┼──────────┼──────────┼──────────┤
│ 疾厄     │          │          │ 命宫     │
│          │          │          │ 贪狼     │
│ 寅       │          │          │ 酉       │
├──────────┼──────────┼──────────┼──────────┤
│ 财帛     │ 子女     │ 夫妻     │ 兄弟     │
│ 廉贞     │          │ 天相     │ 七杀     │
│ 丑       │ 子       │ 亥       │ 戌       │
└──────────┴──────────┴──────────┴──────────┘
命宫在酉，水二局。四化：武曲禄 破军权 廉贞科 贪狼忌
```

**示例 7：查看当前时间的紫微盘**
```bash
python3 scripts/steward.py --mode ziwei
```

**示例 8：指定城市（时区校正会影响农历日）**
```bash
python3 scripts/steward.py --birthdate "1988-08-08 20:00" --birthplace "台北" --mode ziwei
```

---

### 3️⃣ 奇门遁甲（Qimen）

> 采用 **拆补法** 起局，这是国内最广泛使用的标准方法。

**命令格式：**
```bash
python3 scripts/steward.py --birthdate "YYYY-MM-DD HH:MM" --mode qimen
```

**示例 9：当前时间的奇门局**
```bash
python3 scripts/steward.py --mode qimen
```

**示例 10：指定时间排盘**
```bash
python3 scripts/steward.py --birthdate "2026-06-04 10:00" --mode qimen
```
输出：
```
奇门遁甲 [阳遁 6局]
值符: 心星  值使: 开门
┌────┬────┬────┐
│ 天 │ 符 │ 蛇 │
│ 壬庚│ 戊 │ 乙 │
├────┼────┼────┤
│ 地 │     │ 阴 │
│ 辛 │ 癸 │ 己 │
├────┼────┼────┤
│ 武 │ 虎 │ 合 │
│ 丙 │ 丁 │ 庚 │
└────┴────┴────┘
```

**示例 11：不同时辰对比（阳遁 vs 阴遁）**
```bash
# 冬至后阳遁局
python3 scripts/steward.py --birthdate "2026-01-15 10:00" --mode qimen

# 夏至后阴遁局
python3 scripts/steward.py --birthdate "2026-07-15 10:00" --mode qimen
```

**九宫格解读说明：**
每个宫位显示两行信息：
- 第 1 行：`神 星 门`（如 `天辅杜` = 天辅星 + 杜门）
- 第 2 行：`天盘干 地盘干`（如 `壬庚` = 天盘壬 + 地盘庚）

---

### 4️⃣ 大六壬（Liuren）

**命令格式：**
```bash
python3 scripts/steward.py --birthdate "YYYY-MM-DD HH:MM" --mode liuren
```

**示例 12：大六壬排盘**
```bash
python3 scripts/steward.py --birthdate "2026-06-04 09:00" --mode liuren
```
输出：
```
大六壬盘 [月将: 申]
------------------------------
三传: 午  戌  寅

四课:
 酉  巳  巳  丑
 丑  酉  亥  巳

天地盘:
┌──────┬──────┬──────┬──────┐
│  巳巳 │  午午 │  未未 │  申申 │
├──────┼──────┼──────┼──────┤
│  辰辰 │  　   │  　   │  酉酉 │
├──────┼──────┼──────┼──────┤
│  卯卯 │  　   │  　   │  戌戌 │
├──────┼──────┼──────┼──────┤
│  寅寅 │  丑丑 │  子子 │  亥亥 │
└──────┴──────┴──────┴──────┘
月将申，三传午戌寅。四课：酉丑巳亥巳酉丑亥。
```

**示例 13：不同时辰对比**
```bash
# 子时
python3 scripts/steward.py --birthdate "2026-06-04 23:00" --mode liuren

# 午时
python3 scripts/steward.py --birthdate "2026-06-04 12:00" --mode liuren
```

**示例 14：月将变化（跨月中气）**
```bash
# 小满后（约5月20日后），月将为申
python3 scripts/steward.py --birthdate "2026-05-25 10:00" --mode liuren
```

---

### 5️⃣ 梅花易数（Meihua）

> 支持报数起卦和时间起卦两种方式。

**命令格式：**
```bash
# 报数起卦
python3 scripts/steward.py --mode meihua --numbers "上卦数,下卦数,动爻数"

# 时间起卦（用 --birthdate 指定，或省略则用当前时间）
python3 scripts/steward.py --birthdate "YYYY-MM-DD HH:MM" --mode meihua
```

**示例 15：报数起卦（推荐方式）**
```bash
python3 scripts/steward.py --mode meihua --numbers "123,456,7"
```
输出：
```
梅花易数卦象
------------------------------
本卦：雷风恒 (震上巽下)
互卦：乾为天 (乾上乾下)
变卦：雷天大壮 (震上乾下)
动爻：5爻 (体卦在下，用卦在上)
------------------------------
━━━━━━━━ (动)
━━━  ━━━
━━━  ━━━
━━━━━━━━
━━━━━━━━
━━━━━━━━
```

**示例 16：时间起卦**
```bash
# 指定时间
python3 scripts/steward.py --birthdate "2026-06-04 15:30" --mode meihua

# 用当前时间
python3 scripts/steward.py --mode meihua
```

**示例 17：测数字吉凶（提供任意三位数）**
```bash
python3 scripts/steward.py --mode meihua --numbers "3,6,9"
python3 scripts/steward.py --mode meihua --numbers "250,380,1"
```

**体用生克说明：**
- **体卦**：不动的一方，代表问卦主体（你）
- **用卦**：变动的一方，代表所问之事（事）
- **体克用**：主动可控，吉
- **用克体**：外部阻力，凶
- **体生用**：付出消耗
- **用生体**：有助益

---

### 6️⃣ 金口诀（Jinkoujue）

> 金口诀四层结构：人元（天）→ 贵神（神）→ 月将（将）→ 地分（方）

**命令格式：**
```bash
python3 scripts/steward.py --birthdate "YYYY-MM-DD HH:MM" --mode jinkoujue --difen "地支"
```

**示例 18：默认地分（子位）**
```bash
python3 scripts/steward.py --mode jinkoujue
```

**示例 19：指定地分方位**
```bash
python3 scripts/steward.py --mode jinkoujue --difen "午"
python3 scripts/steward.py --mode jinkoujue --difen "申"
python3 scripts/steward.py --mode jinkoujue --difen "卯"
```
输出：
```
金口诀课式 [地分: 午]
------------------------------
  人元: 庚 (金)
  贵神: 青龙 (木 - 寅)
  月将: 丁酉 (金)
  地分: 午 (火)
------------------------------
```

**示例 20：十二地支全部可用**
```bash
# 子丑寅卯辰巳午未申酉戌亥
python3 scripts/steward.py --mode jinkoujue --difen "亥"
```

**解读说明：**
- **人元**：天干，代表天时、外部大环境
- **贵神**：十二天官之一，代表神煞、中介因素
- **月将**：根据中气确定的月将地支，代表月令能量
- **地分**：指定方位地支，代表地域、具体事件

---

### 7️⃣ 六爻（Liuyao · 参考指南）

六爻分析在这个项目中以 **参考文档** 形式提供，详见 `references/liuyao_lost_items.md`。

内容涵盖：
- **用神定位**：不同失物类型对应的卦位（妻财 / 父母 / 子孙 / 官鬼）
- **位置判断**：基于 6 爻层级（内卦 vs 外卦）判断失物在室内还是室外
- **房间映射**：第 1 爻到第 6 爻对应地面 → 天花板
- **方位指南**：八宫八卦对应的方位（离 = 南 / 坎 = 北 / 震 = 东...）
- **颜色属性**：六神对应的颜色特征（玄武 = 黑 / 朱雀 = 红...）

---

## 📡 JSON 模式：与其他程序集成

适合对接 AI Agent、自动化脚本、Web 后端等场景：

```bash
# 全量 JSON 输出
python3 scripts/steward.py --birthdate "1990-05-08 12:00" --sex 1 --birthplace "北京" --mode json
```

输出示例（截取关键部分）：
```json
{
  "config": {
    "input_time": "1990-05-08 12:00",
    "true_solar_time": "1990-05-08 11:46",
    "longitude": 116.4,
    "sex": "男"
  },
  "bazi": {
    "summary": "八字排盘 [乾造]...",
    "pillars": {
      "Year": { "gan": "庚", "zhi": "午", "shishen": "食神", "nayin": "路旁土" },
      "Month": { "gan": "戊", "zhi": "辰", "shishen": "正财", "nayin": "大林木" },
      "Day": { "gan": "壬", "zhi": "午", "shishen": "日主", "nayin": "杨柳木" },
      "Hour": { "gan": "丙", "zhi": "午", "shishen": "偏财", "nayin": "天河水" }
    },
    "yun": {
      "start_desc": "2年9个月9天起运",
      "start_time": "1993-02-17 21:09:00",
      "da_yun": [
        {"index": 1, "pillar": "己巳", "start_age": 3, "start_year": 1993, "end_year": 2002}
      ]
    }
  },
  "meihua": {
    "original": { "name": "雷风恒", "upper": "震", "lower": "巽" },
    "mutual": { "name": "乾为天", "upper": "乾", "lower": "乾" },
    "changed": { "name": "雷天大壮", "upper": "震", "lower": "乾" },
    "moving_line": 5
  },
  "qimen": { "ju": 6, "render": "..." },
  "ziwei": { "ju": "水二局", "stars": {"紫微": "酉", ...}, "palaces": {...} },
  "liuren": { "summary": "...", "render": "..." },
  "jinkoujue": { "summary": "...", "render": "..." }
}
```

**实用技巧：**

```bash
# JSON 输出配合 jq 解析（需要安装 jq）
python3 scripts/steward.py --mode json | jq '.bazi.pillars.Year'
# 输出: {"gan":"庚","zhi":"午","shishen":"食神","nayin":"路旁土"}

# 只抽取特定字段
python3 scripts/steward.py --mode json | jq '.bazi.yun.da_yun[] | {pillar, start_age}'

# 保存到文件
python3 scripts/steward.py --mode json > analysis_result.json
```

---

## 🐍 Python 编程接口

将引擎作为 Python 模块导入，在自己的代码里自由调用：

```python
# 导入历法工具
from scripts.core.calendar import get_true_solar_time, get_lunar
from datetime import datetime

# 设定出生时间（公历）
dt = datetime(1990, 5, 8, 12, 0)

# 真太阳时校正（北京 116.4°E）
true_dt = get_true_solar_time(dt, 116.4)

# 转换为农历
lunar = get_lunar(true_dt)
print(f"农历日期：{lunar.toString()}")
```

### 八字引擎

```python
from scripts.core.bazi import BaziEngine

bazi = BaziEngine(true_dt, sex=1)
result = bazi.analyze()

# 文本化输出
print(result["summary"])

# 结构化数据
print(result["pillars"]["Year"]["gan"])   # 年干
print(result["pillars"]["Year"]["zhi"])   # 年支
print(result["yun"]["da_yun"])            # 大运列表
```

### 梅花易数引擎

```python
from scripts.core.meihua import MeihuaEngine

# 报数起卦
meihua = MeihuaEngine(numbers=[12, 34, 5])
result = meihua.analyze()

print(f"本卦：{result['original']['name']}")
print(f"互卦：{result['mutual']['name']}")
print(f"变卦：{result['changed']['name']}")
print(f"动爻：{result['moving_line']}爻")
print(f"体卦：{result['ti']}　用卦：{result['yong']}")
print(result["render"])
```

### 紫微斗数引擎

```python
from scripts.core.ziwei import ZiweiEngine

ziwei = ZiweiEngine(lunar)
result = ziwei.analyze()

print(result["render"])
print(result["summary"])     # 命宫 + 五行局 + 四化
print(result["stars"])       # 十四主星分布
print(result["palaces"])     # 十二宫对应地支
```

### 奇门遁甲引擎

```python
from scripts.core.qimen import QimenEngine

qimen = QimenEngine(lunar)
result = qimen.analyze()

print(f"当前局：{'阳' if result['ju'] > 0 else '阴'}遁 {abs(result['ju'])}局")
print(result["render"])
```

### 大六壬引擎

```python
from scripts.core.liuren import LiurenEngine

liuren = LiurenEngine(lunar)
result = liuren.analyze()
print(result["render"])
```

### 金口诀引擎

```python
from scripts.core.jinkoujue import JinkoujueEngine

jkj = JinkoujueEngine(lunar, difen="午")
result = jkj.analyze()
print(result["render"])
```

### 全引擎串联输出

```python
from scripts.core.calendar import get_true_solar_time, get_lunar
from scripts.core.bazi import BaziEngine
from scripts.core.ziwei import ZiweiEngine
from datetime import datetime

dt = datetime(1990, 5, 8, 12, 0)
true_dt = get_true_solar_time(dt, 116.4)
lunar = get_lunar(true_dt)

bazi = BaziEngine(true_dt, 1).analyze()
ziwei = ZiweiEngine(lunar).analyze()

print("=== 八字 ===")
print(bazi["summary"])
print("\n=== 紫微 ===")
print(ziwei["summary"])
```

---

## 🌍 经度与城市名支持

`--birthplace` 参数支持三种输入方式：

| 方式 | 示例 | 说明 |
|------|------|------|
| 东经数值 | `--birthplace 116.4` | 直接输入经度 |
| 城市名（内置） | `--birthplace "北京"` | 自动匹配内置城市表 |
| 城市名（未内置） | `--birthplace "洛阳"` | 回退到东八区 120°E |

### 内置城市表（42 个，含港澳台及国际）

| 区域 | 城市 | 经度 |
|------|------|------|
| 华北 | 北京 116.4°E / 天津 117.2°E / 石家庄 114.5°E / 太原 112.5°E / 呼和浩特 111.8°E | |
| 华东 | 上海 121.4°E / 南京 118.8°E / 杭州 120.2°E / 济南 117.0°E / 合肥 117.3°E / 南昌 115.9°E / 福州 119.3°E / 苏州 120.6°E / 青岛 120.3°E / 厦门 118.1°E | |
| 华南 | 广州 113.3°E / 深圳 114.1°E / 南宁 108.4°E / 海口 110.3°E | |
| 华中 | 武汉 114.3°E / 长沙 112.9°E / 郑州 113.7°E | |
| 西南 | 成都 104.1°E / 重庆 106.5°E / 昆明 102.7°E / 贵阳 106.6°E / 拉萨 91.1°E | |
| 西北 | 西安 108.9°E / 兰州 103.8°E / 西宁 101.8°E / 银川 106.3°E / 乌鲁木齐 87.6°E | |
| 东北 | 沈阳 123.4°E / 大连 121.6°E / 哈尔滨 126.6°E | |
| 港澳台 | 香港 114.1°E / 澳门 113.5°E / 台北 121.5°E / 台南 120.2°E / 高雄 120.3°E | |
| 国际 | Tokyo 139.7°E / Seoul 127.0°E / Singapore 103.8°E / Sydney 151.2°E | |
| 国际 | NewYork 74.0°W / London 0.1°W / Paris 2.4°E / LosAngeles 118.2°W | |

---

## ⚡ 精度说明

| 维度 | 说明 |
|------|------|
| **节气换柱** | 精确到分钟级别。比如 1990 年立春发生在 2 月 4 日 10:14，10:13 还是己巳年，10:14 之后才是庚午年 |
| **真太阳时** | 公式：`真太阳时 = 民用时 + 4×(本地经度 - 120) + 均时差`。全年均时差波动可达 ±16 分钟 |
| **东八区校准** | `--birthplace` 不传或传未知城市时，默认使用东八区标准时（120°E），不计均时差 |
| **奇门起局** | 采用 **拆补法（Chai Bu）**，这是 paipan.china95.com 使用的标准方法 |
| **大运起运** | 阳男阴女顺行、阴男阳女逆行，按三天 = 一年的规则计算 |
| **交叉验证** | 推荐使用 https://paipan.china95.com/ 进行结果对照 |

---

## 📁 项目结构

```
metaphysics-steward/
│
├── README.md                          # 🏮 本文件（中文文档）
├── README_EN.md                       # English version（英文精简版）
├── SKILL.md                           # Hermes Agent 元数据（可选加载项）
├── requirements.txt                   # 依赖清单：lunar-python
│
├── scripts/
│   ├── steward.py                     # 🎯 CLI 入口，命令行解析 + 输出渲染
│   └── core/                          # 🔧 引擎核心
│       ├── __init__.py
│       ├── calendar.py                # 历法：真太阳时校正、公历转农历
│       ├── bazi.py                    # 📜 八字引擎：四柱、十神、大运
│       ├── meihua.py                  # 🔰 梅花易数引擎：起卦、互卦、变卦
│       ├── ziwei.py                   # ⭐ 紫微斗数引擎：十二宫、十四主星
│       ├── qimen.py                   # 🔱 奇门遁甲引擎：九宫格、八门九星
│       ├── liuren.py                  # 🌀 大六壬引擎：月将、四课、三传
│       ├── jinkoujue.py              # ⚜️ 金口诀引擎：人元贵神月将地分
│       └── utils.py                   # 🧰 工具：天干地支五行卦象常量表
│
└── references/                        # 📚 参考文档
    ├── liuyao_lost_items.md           # 六爻寻物要义
    ├── china95_verification.md        # 与 paipan.china95.com 的校准说明
    ├── market_metaphysics_patterns.md # 卦象与市场动态映射
    └── LUNAR_PYTHON_REFERENCE.md      # lunar-python API 要点
```

---

## ❓ 常见问题

### Q：跟微信小程序排出来的不一样？

最常见的原因是 **真太阳时校正差异**：
- 很多小程序直接用东八区标准时（120°E），不考虑用户所在地的经度偏差
- 本项目同时校正经度偏移和均时差，两地差 1° 经度就有 4 分钟差距
- 建议用 `--birthplace` 指定城市，然后去 https://paipan.china95.com 交叉验证

### Q：`--mode json` 有什么用？

JSON 输出可以把分析结果直接喂给其他程序、AI Agent 或者存数据库。比文本输出更适合自动化场景。

### Q：梅花易数的三个数字怎么填？

`--numbers "上卦数,下卦数,动爻数"`，三个整数逗号分隔。取值范围无所谓，引擎会做模运算（按 8 取上卦下卦，按 6 取动爻）。

例如随口说三个数 "365, 42, 7"：
- `365 % 8 = 5` → 上卦为巽（☴）
- `42 % 8 = 2` → 下卦为兑（☱）
- `7 % 6 = 1` → 动爻为初爻

起卦得到：䷈ 风泽中孚（本卦）→ ䷼（变卦）

### Q：想加一个新的城市？

打开 `scripts/steward.py`，在 `KNOWN_LOCATIONS` 字典里加一行即可：
```python
# 格式："城市名": 经度数值
"洛阳": 112.5,
"苏州": 120.6,
```

### Q：结果全看不懂怎么办？

正常——玄学术数需要系统学习才能解读。本项目的目标是 **提供准确的技术计算结果**，而非替代多年的术数学习。建议：
1. 从八字入门，先理解天干地支和五行生克
2. 用本项目的 JSON 输出，配合 AI 辅助解读
3. 对照 paipan.china95.com 等专业排盘网站学习

### Q：可以商用吗？

MIT 许可证，随便用。但请保留原作者信息，且 **不得虚假宣传为"AI 算命"或"智能玄学大师"等营销概念**。

---

## 📄 许可证

**MIT License** — 可自由使用、修改、分发，需保留版权声明。

由 [superzhang21](https://github.com/superzhang21) 维护 · ⭐ 欢迎 Star