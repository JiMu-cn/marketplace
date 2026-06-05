# -*- coding: utf-8 -*-
from core.utils import TIANGAN, DIZHI, WUXING, YINYANG

class LiurenEngine:
    """
    大六壬引擎。
    计算天地盘、四课和三传。
    """
    GODS = ["贵人", "腾蛇", "朱雀", "六合", "勾陈", "青龙", "天空", "白虎", "太常", "玄武", "太阴", "天后"]
    
    def __init__(self, lunar):
        self.lunar = lunar
        self.day_gan = lunar.getDayGan()
        self.day_zhi = lunar.getDayZhi()
        self.hour_zhi = lunar.getTimeZhi()
        
    def get_yue_jiang(self):
        """根据当前月份获取月将。"""
        m_zhi_idx = DIZHI.index(self.lunar.getMonthZhi())
        # 太阳位于与月支相对的位置（简化处理）
        # 传统上：月建寅（正月），月将在亥，以此类推
        target_jiang = DIZHI[(14 - m_zhi_idx) % 12]
        return target_jiang

    def get_heaven_plate(self, jiang, hour):
        """将地支映射到天盘。"""
        h_idx = DIZHI.index(hour)
        j_idx = DIZHI.index(jiang)
        plate = {}
        for i in range(12):
            # 天盘支 = 月将支 + (地盘支 - 时辰支)
            plate[DIZHI[i]] = DIZHI[(j_idx + (i - h_idx) + 12) % 12]
        return plate

    def get_four_classes(self, heaven_plate):
        """计算四课。"""
        # 干上寄生（寄宫）
        gan_parasite = {"甲": "寅", "乙": "辰", "丙": "巳", "丁": "未", "戊": "巳", "己": "未", "庚": "申", "辛": "戌", "壬": "亥", "癸": "丑"}
        p1_earth = gan_parasite[self.day_gan]
        p1_heaven = heaven_plate[p1_earth]
        
        p2_earth = p1_heaven
        p2_heaven = heaven_plate[p2_earth]
        
        p3_earth = self.day_zhi
        p3_heaven = heaven_plate[p3_earth]
        
        p4_earth = p3_heaven
        p4_heaven = heaven_plate[p4_earth]
        
        return [(p1_heaven, self.day_gan), (p2_heaven, p1_heaven), (p3_heaven, self.day_zhi), (p4_heaven, p3_heaven)]

    def get_three_transmissions(self, classes, heaven_plate):
        """使用贼克法计算三传。"""
        ke_list = []
        # 五行克关系
        ke_map = {"金": "木", "木": "土", "土": "水", "水": "火", "火": "金"}
        
        for i, (up, down) in enumerate(classes):
            u_w = WUXING.get(up)
            d_w = WUXING.get(down)
            if not u_w or not d_w: continue
            
            if ke_map[u_w] == d_w: # 上克下（克）
                ke_list.append((i, "ke"))
            if ke_map[d_w] == u_w: # 下克上（贼）
                ke_list.append((i, "zei"))
        
        chu = ""
        if any(k[1] == "zei" for k in ke_list):
            zei_items = [k for k in ke_list if k[1] == "zei"]
            # 简化处理：取第一个
            chu = classes[zei_items[0][0]][0]
        elif ke_list:
            chu = classes[ke_list[0][0]][0]
        else:
            # 兜底（简化比用法）
            chu = classes[0][0]
            
        zhong = heaven_plate[chu]
        mo = heaven_plate[zhong]
        return [chu, zhong, mo]

    def analyze(self):
        jiang = self.get_yue_jiang()
        h_plate = self.get_heaven_plate(jiang, self.hour_zhi)
        classes = self.get_four_classes(h_plate)
        trans = self.get_three_transmissions(classes, h_plate)
        
        res = []
        res.append(f"大六壬盘 [月将: {jiang}]")
        res.append("-" * 30)
        res.append(f"三传: {'  '.join(trans)}")
        res.append("\n四课:")
        # 显示为上下两行排列
        # 顺序 4  3  2  1（从右到左）
        line1 = "  ".join([c[0] for c in classes[::-1]])
        line2 = "  ".join([c[1] for c in classes[::-1]])
        res.append(line1)
        res.append(line2)
        
        res.append("\n天地盘:")
        # 4x4 网格布局
        grid = [[5, 6, 7, 8], [4, -1, -1, 9], [3, -1, -1, 10], [2, 1, 0, 11]]
        res.append("┌──────┬──────┬──────┬──────┐")
        for r_idx, row in enumerate(grid):
            r_str = "│"
            for idx in row:
                if idx == -1: r_str += "      │"
                else:
                    e = DIZHI[idx]
                    h = h_plate[e]
                    r_str += f"  {h}{e}  │"
            res.append(r_str)
            if r_idx < 3:
                res.append("├──────┼──────┼──────┼──────┤")
        res.append("└──────┴──────┴──────┴──────┘")

        return {
            "summary": f"月将{jiang}，三传{''.join(trans)}。四课：{''.join([c[0] for c in classes])}。",
            "render": "\n".join(res)
        }