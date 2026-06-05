# 🏮 Metaphysics Steward

> 7 Chinese metaphysics engines in Python — Bazi, Ziwei, Qimen, Liuren, Meihua, Jinkoujue, Liuyao

**Disclaimer:** This tool is for **educational and cultural research purposes only**. Do not make life or financial decisions based on its output.

---

## Features

| Method | Description |
|--------|-------------|
| **Bazi (八字)** | 4 Pillars with minute-precise Jieqi transitions, 10 Gods, Da Yun |
| **Ziwei Doushu (紫微斗数)** | 12 Palaces, 14 Major Stars, Si Hua transformations |
| **Qimen Dun Jia (奇门遁甲)** | Chai Bu Ju, 8 Gods/9 Stars/8 Doors, Heaven & Earth plates |
| **Da Liuren (大六壬)** | Moon General, 4 Classes, 3 Transmissions, Heaven/Earth grid |
| **Meihua Yishu (梅花易数)** | Number/time-based hexagrams, Ti-Yong analysis |
| **Jinkoujue (金口诀)** | 4-level structure: RY, Noble God, Moon General, DF |
| **Liuyao (六爻) ~Ref** | Lost item logic guide in `references/` |

## Install

```bash
pip install lunar-python
```

## Quick Start

```bash
# Bazi
python3 scripts/steward.py --birthdate "1990-05-08 12:00" --sex 1 --mode bazi

# Plum Blossom divination
python3 scripts/steward.py --mode meihua --numbers "123,456,7"

# Qimen Dun Jia
python3 scripts/steward.py --mode qimen

# All modes as JSON
python3 scripts/steward.py --birthdate "1990-05-08 12:00" --sex 1 --mode json
```

## Documentation

**Full Chinese documentation:** [README.md](./README.md) — detailed usage, 20+ examples, Python API guide, FAQ, city longitude table.

## Project Structure

```
metaphysics-steward/
├── README.md              # 中文文档 (Chinese)
├── README_EN.md           # This file (English)
├── SKILL.md               # (Optional) Hermes Agent metadata
├── requirements.txt
├── scripts/
│   ├── steward.py         # CLI entry point
│   └── core/              # Engines
│       ├── calendar.py    # True solar time, lunar conversion
│       ├── bazi.py        # Four Pillars
│       ├── meihua.py      # Plum Blossom
│       ├── ziwei.py       # Ziwei Doushu
│       ├── qimen.py       # Qimen Dun Jia
│       ├── liuren.py      # Da Liuren
│       ├── jinkoujue.py   # Jin Kou Jue
│       └── utils.py       # Shared constants
└── references/
```

## License

MIT — Maintained by [superzhang21](https://github.com/superzhang21)