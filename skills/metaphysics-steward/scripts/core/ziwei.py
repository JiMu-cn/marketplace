# -*- coding: utf-8 -*-
from core.utils import TIANGAN, DIZHI

class ZiweiEngine:
    """
    紫微斗数引擎。
    根据农历出生日期计算十二宫和十四主星。
    """
    PALACE_NAMES = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "交友", "官禄", "田宅", "福德", "父母"]
    
    def __init__(self, lunar):
        self.lunar = lunar
        self.month = lunar.getMonth()
        self.day = lunar.getDay()
        self.hour_idx = lunar.getTimeZhiIndex() + 1  # 1=子, 2=丑...
        self.year_gan = lunar.getYearGan()
        self.year_zhi = lunar.getYearZhi()
        
    def get_palace_branches(self):
        """获取十二宫对应的地支"""
        # 命宫地支索引：(月 - 时) 相对于寅
        # 寅在地支 DIZHI 中索引为 2
        lp_idx = (2 + self.month - self.hour_idx) % 12
        
        palaces = {}
        for i in range(12):
            # 逆时针排列十二宫
            branch_idx = (lp_idx - i + 12) % 12
            palaces[DIZHI[branch_idx]] = self.PALACE_NAMES[i]
        return palaces

    def get_wu_xing_ju(self, lp_branch, lp_gan):
        """确定五行局"""
        # 1:水二局, 2:木三局, 3:金四局, 4:土五局, 5:火六局
        from lunar_python.util import LunarUtil
        
        # 命宫天干
        # 规则：命宫天干 = (年干 * 2 + (命宫地支 - 2)) % 10
        lp_branch_idx = DIZHI.index(lp_branch)
        start_gan_idx = (TIANGAN.index(self.year_gan) % 5 * 2 + 2) % 10
        lp_gan_idx = (start_gan_idx + (lp_branch_idx - 2 + 12) % 12) % 10
        lp_gan = TIANGAN[lp_gan_idx]
        
        nayin = LunarUtil.NAYIN.get(lp_gan + lp_branch)
        
        # 纳音到五行局的映射
        nayin_to_ju = {
            "金": 4, "木": 3, "水": 2, "火": 6, "土": 5
        }
        for k, v in nayin_to_ju.items():
            if k in nayin:
                return v, lp_gan
        
        return 2, lp_gan  # 默认返回水二局

    def get_ziwei_pos(self, ju, day):
        """计算紫微星的位置"""
        # 紫微位置计算公式
        q = (day + ju - 1) // ju
        r = day % ju
        if r == 0: r = ju
        
        if (q + r) % 2 == 0:  # 偶数
            offset = q + r
        else:  # 奇数
            offset = q - r
            
        return (2 + offset - 1 + 12) % 12

    def analyze(self):
        """执行紫微斗数排盘分析"""
        palace_branches = self.get_palace_branches()
        lp_branch = next(b for b, n in palace_branches.items() if n == "命宫")
        ju, lp_gan = self.get_wu_xing_ju(lp_branch, self.year_gan)
        
        ziwei_idx = self.get_ziwei_pos(ju, self.day)
        ziwei_branch = DIZHI[ziwei_idx]
        
        # 十四主星
        stars = {}
        stars["紫微"] = ziwei_branch
        stars["天机"] = DIZHI[(ziwei_idx - 1 + 12) % 12]
        stars["太阳"] = DIZHI[(ziwei_idx - 3 + 12) % 12]
        stars["武曲"] = DIZHI[(ziwei_idx - 4 + 12) % 12]
        stars["天同"] = DIZHI[(ziwei_idx - 5 + 12) % 12]
        stars["廉贞"] = DIZHI[(ziwei_idx - 8 + 12) % 12]
        
        tianfu_idx = (4 - ziwei_idx + 12) % 12
        stars["天府"] = DIZHI[tianfu_idx]
        stars["太阴"] = DIZHI[(tianfu_idx + 1) % 12]
        stars["贪狼"] = DIZHI[(tianfu_idx + 2) % 12]
        stars["巨门"] = DIZHI[(tianfu_idx + 3) % 12]
        stars["天相"] = DIZHI[(tianfu_idx + 4) % 12]
        stars["天梁"] = DIZHI[(tianfu_idx + 5) % 12]
        stars["七杀"] = DIZHI[(tianfu_idx + 6) % 12]
        stars["破军"] = DIZHI[(tianfu_idx + 10) % 12]
        
        # 四化星映射表（年干→化禄、化权、化科、化忌）
        si_hua_map = {
            "甲": ["廉贞", "破军", "武曲", "太阳"],
            "乙": ["天机", "天梁", "紫微", "太阴"],
            "丙": ["天同", "天机", "文昌", "廉贞"],
            "丁": ["太阴", "天同", "天机", "巨门"],
            "戊": ["贪狼", "太阴", "右弼", "天机"],
            "己": ["武曲", "贪狼", "天梁", "文曲"],
            "庚": ["太阳", "武曲", "太阴", "天同"],
            "辛": ["巨门", "太阳", "文曲", "文昌"],
            "壬": ["天梁", "紫微", "左辅", "武曲"],
            "癸": ["破军", "巨门", "太阴", "贪狼"]
        }
        si_hua = si_hua_map.get(self.year_gan, ["", "", "", ""])

        # 五行局名称
        ju_names = {2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局"}
        
        branch_stars = {b: [] for b in DIZHI}
        for s, b in stars.items():
            branch_stars[b].append(s)
            
        grid = [
            [5, 6, 7, 8],
            [4, -1, -1, 9],
            [3, -1, -1, 10],
            [2, 1, 0, 11]
        ]
        
        lines = []
        lines.append(f"紫微命盘 [{ju_names[ju]}]")
        lines.append("┌──────────┬──────────┬──────────┬──────────┐")
        
        for r_idx, row in enumerate(grid):
            # 每个格子有三行：宫位名称、星曜、地支
            l1, l2, l3 = "│", "│", "│"
            for b_idx in row:
                if b_idx == -1:
                    l1 += "          │"
                    l2 += "          │"
                    l3 += "          │"
                else:
                    b = DIZHI[b_idx]
                    p_name = palace_branches[b]
                    s_list = branch_stars[b]
                    stars_str = "".join([s[0] for s in s_list[:4]])
                    l1 += f" {p_name:^8} │"
                    l2 += f" {stars_str:^8} │"
                    l3 += f" {b:^8} │"
            lines.append(l1)
            lines.append(l2)
            lines.append(l3)
            if r_idx < 3:
                lines.append("├──────────┼──────────┼──────────┼──────────┤")
        lines.append("└──────────┴──────────┴──────────┴──────────┘")
        
        render_str = "\n".join(lines)
        summary = f"命宫在{lp_branch}，{ju_names[ju]}。四化：{' '.join([s+h for s,h in zip(si_hua, ['禄','权','科','忌'])])}"
        
        return {
            "summary": summary,
            "render": render_str,
            "stars": stars,
            "palaces": palace_branches,
            "ju": ju_names[ju]
        }
