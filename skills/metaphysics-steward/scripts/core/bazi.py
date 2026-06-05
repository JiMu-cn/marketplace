# -*- coding: utf-8 -*-
from lunar_python import Solar, EightChar, Lunar
from .utils import TIANGAN, DIZHI, WUXING, SHISHEN, HIDDEN_GANS, get_shishen

class BaziEngine:
    """
    八字（四柱）引擎。
    执行完整的八字排盘，包括大运、十神和纳音。
    """
    def __init__(self, dt, sex):
        """
        dt: datetime 对象
        sex: 1 为男，0 为女
        """
        self.dt = dt
        self.sex = sex
        self.solar = Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
        self.lunar = self.solar.getLunar()
        self.eight_char = self.lunar.getEightChar()

    def get_all_pillars(self):
        """获取四柱全部信息（年、月、日、时柱的天干、地支、十神、纳音、藏干）。"""
        ec = self.eight_char
        return {
            "Year": {
                "gan": ec.getYearGan(), "zhi": ec.getYearZhi(), 
                "shishen": ec.getYearShiShenGan(),
                "nayin": ec.getYearNaYin(),
                "hidden": [{"gan": g, "shishen": s} for g, s in zip(ec.getYearHideGan(), ec.getYearShiShenZhi())]
            },
            "Month": {
                "gan": ec.getMonthGan(), "zhi": ec.getMonthZhi(), 
                "shishen": ec.getMonthShiShenGan(),
                "nayin": ec.getMonthNaYin(),
                "hidden": [{"gan": g, "shishen": s} for g, s in zip(ec.getMonthHideGan(), ec.getMonthShiShenZhi())]
            },
            "Day": {
                "gan": ec.getDayGan(), "zhi": ec.getDayZhi(), 
                "shishen": "日主",
                "nayin": ec.getDayNaYin(),
                "hidden": [{"gan": g, "shishen": s} for g, s in zip(ec.getDayHideGan(), ec.getDayShiShenZhi())]
            },
            "Hour": {
                "gan": ec.getTimeGan(), "zhi": ec.getTimeZhi(), 
                "shishen": ec.getTimeShiShenGan(),
                "nayin": ec.getTimeNaYin(),
                "hidden": [{"gan": g, "shishen": s} for g, s in zip(ec.getTimeHideGan(), ec.getTimeShiShenZhi())]
            }
        }

    def get_precise_da_yun(self):
        """计算精确的起运时间和十年大运列表。"""
        yun = self.eight_char.getYun(self.sex)
        start_solar = yun.getStartSolar()
        
        da_yun_list = []
        dys = yun.getDaYun()
        # 索引 1-10 对应十年一大运的十个大运
        for i in range(1, min(11, len(dys))):
            dy = dys[i]
            da_yun_list.append({
                "index": i,
                "pillar": dy.getGanZhi(),
                "start_age": dy.getStartAge(),
                "start_year": dy.getStartYear(),
                "end_year": dy.getEndYear()
            })
        
        return {
            "start_time": f"{start_solar.toYmdHms()}",
            "start_desc": f"{yun.getStartYear()}年{yun.getStartMonth()}个月{yun.getStartDay()}天起运",
            "da_yun": da_yun_list
        }

    def render_table(self):
        """生成八字排盘的文本表格（含十神、天干、地支、纳音、藏干、起运、大运）。"""
        p = self.get_all_pillars()
        
        lines = []
        lines.append(f"八字排盘 [{ '乾' if self.sex == 1 else '坤' }造]")
        lines.append(f"公历: {self.solar.toYmdHms()}")
        lines.append(f"农历: {self.lunar.toString()}")
        lines.append("-" * 42)
        
        headers = ["      ", "年柱", "月柱", "日柱", "时柱"]
        rows = [
            ["十神", p["Year"]["shishen"], p["Month"]["shishen"], "日主", p["Hour"]["shishen"]],
            ["天干", p["Year"]["gan"], p["Month"]["gan"], p["Day"]["gan"], p["Hour"]["gan"]],
            ["地支", p["Year"]["zhi"], p["Month"]["zhi"], p["Day"]["zhi"], p["Hour"]["zhi"]],
            ["纳音", p["Year"]["nayin"][:2], p["Month"]["nayin"][:2], p["Day"]["nayin"][:2], p["Hour"]["nayin"][:2]]
        ]
        
        # 格式化行实现对齐
        lines.append("  ".join(f"{h:^6}" for h in headers))
        for row in rows:
            lines.append("  ".join(f"{item:^6}" for item in row))
            
        lines.append("-" * 42)
        
        # 藏干
        hidden_row = ["藏干"]
        for pillar in ["Year", "Month", "Day", "Hour"]:
            hg = "".join([h["gan"] for h in p[pillar]["hidden"]])
            hidden_row.append(hg)
        lines.append("  ".join(f"{item:^6}" for item in hidden_row))
        
        lines.append("-" * 42)
        yun_data = self.get_precise_da_yun()
        lines.append(f"起运: {yun_data['start_desc']}")
        lines.append(f"时间: {yun_data['start_time']}")
        
        dy_line = "大运: "
        for dy in yun_data["da_yun"][:8]:
            dy_line += f"{dy['pillar']}({dy['start_age']}) "
        lines.append(dy_line)
        
        return "\n".join(lines)

    def analyze(self):
        """返回八字分析的完整结果（概要、四柱详细信息、大运）。"""
        return {
            "summary": self.render_table(),
            "pillars": self.get_all_pillars(),
            "yun": self.get_precise_da_yun()
        }
