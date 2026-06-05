# -*- coding: utf-8 -*-
from .utils import TIANGAN, DIZHI

class QimenEngine:
    """
    奇门遁甲引擎（拆补法）。
    计算九宫格中的星、门、神以及天盘/地盘天干。
    """
    def __init__(self, lunar):
        self.lunar = lunar
        self.solar = lunar.getSolar()
        self.day_ganzhi = lunar.getDayInGanZhi()
        self.hour_ganzhi = lunar.getTimeInGanZhi()
        
    def get_ju(self):
        """用拆补法确定当前的局（Pattern）。"""
        jq = self.lunar.getPrevJieQi(True)
        jq_name = jq.getName()
        
        ju_map = {
            "冬至": [1, 7, 4], "小寒": [2, 8, 5], "大寒": [3, 9, 6],
            "立春": [8, 5, 2], "雨水": [9, 6, 3], "惊蛰": [1, 4, 7],
            "春分": [3, 9, 6], "清明": [4, 1, 7], "谷雨": [5, 2, 8],
            "立夏": [4, 1, 7], "小满": [5, 2, 8], "芒种": [6, 3, 9],
            "夏至": [-9, -3, -6], "小暑": [-8, -2, -5], "大暑": [-7, -1, -4],
            "立秋": [-2, -5, -8], "处暑": [-1, -4, -7], "白露": [-9, -3, -6],
            "秋分": [-7, -1, -4], "寒露": [-6, -9, -3], "霜降": [-5, -8, -2],
            "立冬": [-6, -9, -3], "小雪": [-5, -8, -2], "大雪": [-4, -7, -1]
        }
        
        if jq_name not in ju_map:
            return 1
            
        base_jus = ju_map[jq_name]
        
        # 根据日符头确定上、中、下元
        temp_lunar = self.lunar
        while temp_lunar.getDayGan() not in ["甲", "己"]:
            temp_lunar = temp_lunar.next(-1)
        
        futou_zhi = temp_lunar.getDayZhi()
        if futou_zhi in ["子", "午", "卯", "酉"]:
            yuan_idx = 0
        elif futou_zhi in ["寅", "申", "巳", "亥"]:
            yuan_idx = 1
        else:
            yuan_idx = 2
            
        return base_jus[yuan_idx]

    def get_di_pan(self, ju):
        """生成地盘。"""
        order = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"]
        grid = {}
        is_yang = ju > 0
        abs_ju = abs(ju)
        path = [1, 2, 3, 4, 5, 6, 7, 8, 9] if is_yang else [9, 8, 7, 6, 5, 4, 3, 2, 1]
        
        start_house = abs_ju
        current_house = start_house
        for stem in order:
            grid[current_house] = stem
            idx = path.index(current_house)
            current_house = path[(idx + 1) % 9]
        return grid

    def analyze(self):
        ju = self.get_ju()
        di_pan = self.get_di_pan(ju)
        
        # 旬首（时辰的领导者）
        xun_shou_map = {"甲子": "戊", "甲戌": "己", "甲申": "庚", "甲午": "辛", "甲辰": "壬", "甲寅": "癸"}
        hg = self.hour_ganzhi[0]
        hz = self.hour_ganzhi[1]
        h_idx = TIANGAN.index(hg)
        z_idx = DIZHI.index(hz)
        
        xun_start_zhi = DIZHI[(z_idx - h_idx) % 12]
        xun_shou_gz = "甲" + xun_start_zhi
        shou_stem = xun_shou_map.get(xun_shou_gz, "戊")
        
        shou_house = [k for k, v in di_pan.items() if v == shou_stem][0]
        
        # 九星与八门映射表
        star_map = {1: "蓬", 2: "芮", 3: "冲", 4: "辅", 5: "禽", 6: "心", 7: "柱", 8: "任", 9: "英"}
        door_map = {1: "休", 2: "死", 3: "伤", 4: "杜", 6: "开", 7: "惊", 8: "生", 9: "景"}
        
        zhi_fu_star = star_map[shou_house]
        zhi_shi_door = door_map.get(shou_house, "死")
        
        # 值符的目标宫位
        target_stem = hg if hg != "甲" else shou_stem
        target_house = [k for k, v in di_pan.items() if v == target_stem][0]
        if target_house == 5: target_house = 2
        
        rim = [1, 8, 3, 4, 9, 2, 7, 6]
        try:
            shou_idx = rim.index(shou_house) if shou_house != 5 else rim.index(2)
            target_idx = rim.index(target_house)
            diff = (target_idx - shou_idx) % 8
        except ValueError:
            diff = 0
            
        heaven_pan, stars = {}, {}
        for i, house in enumerate(rim):
            old_house = rim[(i - diff) % 8]
            stars[house] = star_map[old_house]
            heaven_pan[house] = di_pan[old_house]
        
        # 八门转动
        path = [1, 2, 3, 4, 5, 6, 7, 8, 9] if ju > 0 else [9, 8, 7, 6, 5, 4, 3, 2, 1]
        hour_offset = TIANGAN.index(hg)
        shi_idx = path.index(shou_house)
        shi_target_house = path[(shi_idx + hour_offset) % 9]
        if shi_target_house == 5: shi_target_house = 2
        
        door_rim = [1, 8, 3, 4, 9, 2, 7, 6]
        try:
            d_shou_idx = door_rim.index(shou_house) if shou_house != 5 else door_rim.index(2)
            d_target_idx = door_rim.index(shi_target_house)
            d_diff = (d_target_idx - d_shou_idx) % 8
        except:
            d_diff = 0
            
        doors = {}
        for i, house in enumerate(door_rim):
            old_house = door_rim[(i - d_diff) % 8]
            doors[house] = door_map.get(old_house, "  ")
            
        # 八神
        gods_list = ["符", "蛇", "阴", "合", "虎", "武", "地", "天"] if ju > 0 else ["符", "天", "地", "武", "虎", "合", "阴", "蛇"]
        gods = {}
        for i, house in enumerate(rim):
            idx = (i - target_idx) % 8
            gods[house] = gods_list[idx]

        layout = [4, 9, 2, 3, 5, 7, 8, 1, 6]
        grid_data = []
        for h in layout:
            if h == 5:
                grid_data.append(f"  {di_pan[5]}  ")
            else:
                g, s, d = gods.get(h, " "), stars.get(h, " "), doors.get(h, " ")
                tp, dp = heaven_pan.get(h, " "), di_pan.get(h, " ")
                grid_data.append(f"{g}{s}{d}\n{tp}{dp}")

        render = f"奇门遁甲 [{'阳' if ju > 0 else '阴'}遁 {abs(ju)}局]\n"
        render += f"值符: {zhi_fu_star}星  值使: {zhi_shi_door}门\n"
        render += "┌────┬────┬────┐\n"
        for i in range(0, 9, 3):
            r1, r2 = "│", "│"
            for j in range(3):
                cell = grid_data[i+j].split('\n')
                if len(cell) == 1:
                    r1 += f" {cell[0]} │"
                    r2 += "      │"
                else:
                    r1 += f" {cell[0]} │"
                    r2 += f"  {cell[1]}  │"
            render += r1 + "\n" + r2 + "\n"
            if i < 6: render += "├────┼────┼────┤\n"
        render += "└────┴────┴────┘"
        
        return {"ju": ju, "render": render}