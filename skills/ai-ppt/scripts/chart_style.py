"""
chart_style.py - 图表样式基础模块

所有 generate_charts.py 脚本必须 import 此模块。
字体、配色、深色背景等配置自动生效，不再依赖 AI 手动添加。

用法:
    from chart_style import setup, save, COLORS

    fig, ax = setup()
    ax.bar([1,2,3], [4,5,6], color=COLORS['blue'])
    ax.set_title('标题')  # 中文自动正常显示
    save(fig, 'output.png')
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import os

# ============================================================
# 中文字体配置 (规则 15 - 编码在此，不再依赖 AI 记忆)
# ============================================================
plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'PingFang SC', 'Noto Sans CJK SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# ============================================================
# 深色主题配色 (与 themes.js 对齐)
# ============================================================
COLORS = {
    'bg':      '#0D1B2A',
    'panel':   '#1E293B',
    'grid':    '#1E3A5F',
    'text':    '#E2E8F0',
    'muted':   '#94A3B8',
    'blue':    '#4A9EFF',
    'gold':    '#FFD166',
    'green':   '#06D6A0',
    'red':     '#FF4D6D',
    'orange':  '#FF8C42',
    'purple':  '#9B72CF',
    'cyan':    '#06B6D4',
}

# 按顺序的系列颜色（多系列图表自动取色）
SERIES_COLORS = [
    COLORS['blue'], COLORS['gold'], COLORS['green'],
    COLORS['red'], COLORS['orange'], COLORS['purple'], COLORS['cyan'],
]


def setup(figsize=(11, 5), bg=None):
    """创建已配置好深色主题的 fig, ax。

    Args:
        figsize: 图表尺寸，默认 (11, 5)
        bg: 背景色，默认使用 COLORS['bg']

    Returns:
        (fig, ax) 元组
    """
    bg = bg or COLORS['bg']
    fig, ax = plt.subplots(figsize=figsize, facecolor=bg)
    ax.set_facecolor(bg)
    ax.tick_params(colors=COLORS['muted'], labelsize=9)
    ax.xaxis.label.set_color(COLORS['muted'])
    ax.yaxis.label.set_color(COLORS['muted'])
    for spine in ax.spines.values():
        spine.set_edgecolor(COLORS['grid'])
    ax.grid(axis='y', color=COLORS['grid'], linewidth=0.6, linestyle='--')
    ax.set_axisbelow(True)
    return fig, ax


def setup_dual(figsize=(11, 5), bg=None):
    """创建双 Y 轴图表（如 GDP 总量 + 增速）。

    Returns:
        (fig, ax1, ax2) 元组
    """
    bg = bg or COLORS['bg']
    fig, ax1 = plt.subplots(figsize=figsize, facecolor=bg)
    ax1.set_facecolor(bg)
    ax1.tick_params(colors=COLORS['muted'], labelsize=9)
    for spine in ax1.spines.values():
        spine.set_edgecolor(COLORS['grid'])
    ax1.grid(axis='y', color=COLORS['grid'], linewidth=0.6, linestyle='--')
    ax1.set_axisbelow(True)

    ax2 = ax1.twinx()
    ax2.set_facecolor(bg)
    ax2.tick_params(colors=COLORS['muted'], labelsize=9)
    for spine in ax2.spines.values():
        spine.set_edgecolor(COLORS['grid'])

    return fig, ax1, ax2


def style_legend(ax, **kwargs):
    """统一图例样式。"""
    defaults = dict(
        facecolor=COLORS['bg'],
        edgecolor=COLORS['grid'],
        labelcolor=COLORS['text'],
        fontsize=10,
    )
    defaults.update(kwargs)
    return ax.legend(**defaults)


def save(fig, filepath, dpi=150):
    """保存图表，自动创建目录。"""
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    fig.savefig(filepath, dpi=dpi, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f'Saved: {os.path.basename(filepath)}')
