import math
from datetime import datetime, timedelta, timezone
from lunar_python import Solar, Lunar

SH_TZ = timezone(timedelta(hours=8))

def get_true_solar_time(dt: datetime, longitude: float) -> datetime:
    """
    根据经度和均时差将民用时校正为真太阳时。
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=SH_TZ)
    
    # 均时差（Equation of Time）
    day_of_year = dt.timetuple().tm_yday
    b = 2 * math.pi * (day_of_year - 81) / 365
    eot = 9.87 * math.sin(2 * b) - 7.53 * math.cos(b) - 1.5 * math.sin(b)
    
    # 经度修正（东经120°每差1度加减4分钟）
    lon_offset = 4 * (longitude - 120.0)
    
    total_offset = eot + lon_offset
    return dt + timedelta(minutes=total_offset)

def get_lunar(dt: datetime):
    solar = Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
    return solar.getLunar()