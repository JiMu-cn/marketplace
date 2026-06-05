# -*- coding: utf-8 -*-
from core.utils import TIANGAN, DIZHI, WUXING

class JinkoujueEngine:
    """金口诀引擎。
    计算人元、贵神、月将和地分。
    """
    GODS = ["贵人", "腾蛇", "朱雀", "六合", "勾陈", "青龙", "天空", "白虎", "太常", "玄武", "太阴", "天后"]
    
    def __init__(self, lunar, difen="子"):
        self.lunar = lunar
        self.difen = difen
        self.day_gan = lunar.getDayGan()
        self.day_zhi = lunar.getDayZhi()
        self.hour_zhi = lunar.getTimeZhi()
        
    def get_yue_jiang(self):
        """获取当前月将。"""
        m_zhi_idx = DIZHI.index(self.lunar.getMonthZhi())
        return DIZHI[(14 - m_zhi_idx) % 12]

    def analyze(self):
        """执行完整的金口诀分析。"""
        jiang_name = self.get_yue_jiang()
        df = self.difen
        h_idx = DIZHI.index(self.hour_zhi)
        j_idx = DIZHI.index(jiang_name)
        df_idx = DIZHI.index(df)
        
        # 1. 人元
        # 公式：(日干索引 × 2 + 地分索引) % 10
        ry_idx = (TIANGAN.index(self.day_gan) * 2 + df_idx) % 10
        ry = TIANGAN[ry_idx]

        # 2. 贵神
        guiren_map = {
            "甲": ("丑", "未"), "戊": ("丑", "未"), "庚": ("丑", "未"),
            "乙": ("子", "申"), "己": ("子", "申"),
            "丙": ("亥", "酉"), "丁": ("亥", "酉"),
            "壬": ("卯", "巳"), "癸": ("卯", "巳"),
            "辛": ("午", "寅")
        }
        # 简化的昼夜判断
        hour = self.lunar.getSolar().getHour()
        is_day = 5 <= hour < 17
        gui_pos_zhi = guiren_map.get(self.day_gan, ("丑", "未"))[0] if is_day else guiren_map.get(self.day_gan, ("丑", "未"))[1]
        gui_pos_idx = DIZHI.index(gui_pos_zhi)
        
        # 根据贵人位置旋转计算神煞索引
        god_zhi_idx = (gui_pos_idx + (df_idx - h_idx) + 12) % 12
        god_zhi = DIZHI[god_zhi_idx]
        god_name = self.GODS[(god_zhi_idx - gui_pos_idx + 12) % 12]

        # 3. 月将
        target_j_idx = (j_idx + (df_idx - h_idx) + 12) % 12
        moon_general = DIZHI[target_j_idx]
        j_gan_idx = (TIANGAN.index(self.day_gan) * 2 + target_j_idx) % 10
        j_gan = TIANGAN[j_gan_idx]

        res = []
        res.append(f"金口诀课式 [地分: {df}]")
        res.append("-" * 30)
        res.append(f"  人元: {ry:^2} ({WUXING[ry]})")
        res.append(f"  贵神: {god_name:^2} ({WUXING[god_zhi]} - {god_zhi})")
        res.append(f"  月将: {j_gan}{moon_general} ({WUXING[moon_general]})")
        res.append(f"  地分: {df:^2} ({WUXING[df]})")
        res.append("-" * 30)
        
        # 计算五行关系（简化版）
        wuxing_list = [WUXING[ry], WUXING[god_zhi], WUXING[moon_general], WUXING[df]]
        # 金口诀中，分析这四个要素之间的生克关系
        
        return {
            "summary": f"金口诀：{ry}、{god_name}、{j_gan}{moon_general}、{df}。",
            "render": "\n".join(res)
        }
