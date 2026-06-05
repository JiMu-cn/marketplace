# -*- coding: utf-8 -*-
import argparse
import json
import sys
from datetime import datetime
from core.calendar import get_true_solar_time, get_lunar
from core.bazi import BaziEngine
from core.meihua import MeihuaEngine
from core.qimen import QimenEngine
from core.ziwei import ZiweiEngine
from core.liuren import LiurenEngine
from core.jinkoujue import JinkoujueEngine

# ── 内置城市经度表 ──
KNOWN_LOCATIONS = {
    "北京": 116.4, "上海": 121.4, "广州": 113.3, "香港": 114.1, "台北": 121.5,
    "天津": 117.2, "重庆": 106.5, "深圳": 114.1, "杭州": 120.2, "西安": 108.9,
    "成都": 104.1, "武汉": 114.3, "南京": 118.8, "长沙": 112.9, "青岛": 120.3,
    "大连": 121.6, "厦门": 118.1, "苏州": 120.6, "郑州": 113.7, "沈阳": 123.4,
    "昆明": 102.7, "南宁": 108.4, "哈尔滨": 126.6, "乌鲁木齐": 87.6,
    "拉萨": 91.1, "海口": 110.3, "兰州": 103.8, "贵阳": 106.6, "福州": 119.3,
    "南昌": 115.9, "合肥": 117.3, "济南": 117.0, "太原": 112.5, "石家庄": 114.5,
    "呼和浩特": 111.8, "银川": 106.3, "西宁": 101.8,
    # 港澳台
    "澳门": 113.5, "台南": 120.2, "高雄": 120.3,
    # 国际（仅参考）
    "Tokyo": 139.7, "Seoul": 127.0, "Singapore": 103.8, "NewYork": -74.0,
    "London": -0.1, "Paris": 2.4, "Sydney": 151.2, "LosAngeles": -118.2,
    "SanFrancisco": -122.4,
}


def main():
    """赛博玄学管家 — 主入口"""
    parser = argparse.ArgumentParser(
        description="赛博玄学管家 — 七套传统术数的 Python 分析与卦盘渲染工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例 Examples:
  # 八字
  python3 steward.py --birthdate "1990-05-08 12:00" --sex 1 --mode bazi

  # 梅花易数（报数起卦）
  python3 steward.py --mode meihua --numbers 123,456,7

  # 全模式输出
  python3 steward.py --birthdate "1990-05-08 12:00" --sex 1 --birthplace "北京" --mode all

  # JSON 输出（适合与其他程序/Agent 集成）
  python3 steward.py --birthdate "1990-05-08 12:00" --sex 1 --mode json

  # 金口诀指定地分
  python3 steward.py --mode jinkoujue --difen 午

  # 紫微斗数
  python3 steward.py --birthdate "1988-08-08 20:00" --mode ziwei

  # 奇门遁甲
  python3 steward.py --birthdate "2026-06-04 10:00" --mode qimen

  # 大六壬
  python3 steward.py --birthdate "2026-06-04 09:00" --mode liuren
        """
    )

    parser.add_argument("--birthdate",
                        help="出生/输入时间 YYYY-MM-DD HH:MM（不传则用当前时间）")
    parser.add_argument("--sex", type=int, default=1,
                        help="性别：1=男(乾造)，0=女(坤造) (默认 1)")
    parser.add_argument("--birthplace", default="120.0",
                        help="出生地经度或城市名（默认 120.0°E，即东八区标准时）")
    parser.add_argument("--mode", default="all",
                        choices=["bazi", "meihua", "qimen", "ziwei", "liuren",
                                 "jinkoujue", "all", "json"],
                        help="分析模式：bazi|meihua|qimen|ziwei|liuren|jinkoujue|all|json")
    parser.add_argument("--numbers",
                        help="梅花易数报数，三个整数以逗号分隔 (如 '123,456,7')")
    parser.add_argument("--difen", default="子",
                        help="金口诀地分（十二地支之一，默认 '子'）")

    args = parser.parse_args()

    try:
        # ── 经度解析 ──
        try:
            longitude = float(args.birthplace)
        except ValueError:
            longitude = KNOWN_LOCATIONS.get(args.birthplace, 120.0)

        # ── 时间解析 ──
        if args.birthdate:
            dt = datetime.strptime(args.birthdate, "%Y-%m-%d %H:%M")
        else:
            dt = datetime.now()

        # ── 真太阳时校正 ──
        true_dt = get_true_solar_time(dt, longitude)
        lunar = get_lunar(true_dt)

        results = {
            "config": {
                "input_time": dt.strftime("%Y-%m-%d %H:%M"),
                "true_solar_time": true_dt.strftime("%Y-%m-%d %H:%M"),
                "longitude": longitude,
                "sex": "男" if args.sex == 1 else "女"
            }
        }

        # ── 引擎分发 ──
        if args.mode in ("bazi", "all", "json"):
            engine = BaziEngine(true_dt, args.sex)
            results["bazi"] = engine.analyze()

        if args.mode in ("meihua", "all", "json"):
            mh_nums = None
            if args.numbers:
                try:
                    mh_nums = [int(x) for x in args.numbers.split(",")]
                    if len(mh_nums) != 3:
                        raise ValueError
                except (ValueError, TypeError):
                    print("Error: --numbers 必须为三个逗号分隔的整数（如 1,2,3）")
                    sys.exit(1)
            engine = MeihuaEngine(lunar=lunar, numbers=mh_nums)
            results["meihua"] = engine.analyze()

        if args.mode in ("qimen", "all", "json"):
            engine = QimenEngine(lunar)
            results["qimen"] = engine.analyze()

        if args.mode in ("ziwei", "all", "json"):
            engine = ZiweiEngine(lunar)
            results["ziwei"] = engine.analyze()

        if args.mode in ("liuren", "all", "json"):
            engine = LiurenEngine(lunar)
            results["liuren"] = engine.analyze()

        if args.mode in ("jinkoujue", "all", "json"):
            engine = JinkoujueEngine(lunar, difen=args.difen)
            results["jinkoujue"] = engine.analyze()

        # ── 输出 ──
        if args.mode == "json":
            print(json.dumps(results, ensure_ascii=False, indent=2))
        else:
            render_all(results, args.mode)

    except Exception as e:
        print(f"错误: {str(e)}")
        sys.exit(1)


def render_all(results, mode):
    """渲染并输出分析结果"""
    cfg = results["config"]
    sep = "=" * 60

    print(f"\n{sep}")
    print(f"{'赛博玄学管家 (Metaphysics Steward)':^60}")
    print(f"{sep}")
    print(f"  🕐 分析基准: {cfg['true_solar_time']} (真太阳时)")
    print(f"  📥 输入时间: {cfg['input_time']} (民用时)")
    print(f"  👤 性别: {cfg['sex']}  |  📍 经度: {cfg['longitude']}°")
    print(f"{sep}")

    order = ["bazi", "meihua", "qimen", "ziwei", "liuren", "jinkoujue"]
    for key in order:
        if key in results:
            data = results[key]
            if "summary" in data and key == "bazi":
                print("\n" + data["summary"])
            elif "render" in data:
                print("\n" + data["render"])
                if "summary" in data and key != "bazi":
                    print(data["summary"])

    print(f"\n{sep}")


if __name__ == "__main__":
    main()