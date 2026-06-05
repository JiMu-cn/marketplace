# Auto Desktop Skill

## Overview

自动化桌面操作技能，包含窗口管理和视觉反馈功能。包含边缘呼吸灯效果用于提示AI正在操作桌面以及显示桌面功能。

## Features

- **Edge Breathing Light**: 屏幕边缘呼吸灯效果，当AI开始操作桌面时激活，作为状态指示器
- **Show Desktop**: 快速显示桌面功能，在AI桌面操作启动前最小化窗口
- **Window Management**: 桌面窗口管理功能

## Functions

### 1. showDesktop()

- **Purpose**: 将所有窗口最小化，显示桌面
- **Parameters**: None
- **Returns**: Promise<void>
- **Usage**: 在AI操作桌面前调用以获得干净的桌面环境

### 2. activateBreathingLight(options)

- **Purpose**: 激活屏幕边缘呼吸灯效果
- **Parameters**:
  - `options.color`: 呼吸灯颜色，默认#00ff00 (绿)
  - `options.duration`: 持续时间(ms)，默认30000 (30秒)
  - `options.intensity`: 强度等级 1-10，默认5
- **Returns**: Promise<{ id: string }> - 返回灯光ID
- **Usage**: 当AI开始桌面操作时激活

### 3. deactivateBreathingLight(lightId)

- **Purpose**: 使特定呼吸灯失效
- **Parameters**:
  - `lightId`: 灯光ID
- **Returns**: Promise<void>
- **Usage**: AI完成桌面操作后关闭对应呼吸灯

## Implementation Notes

- 当AI开始GUI操作时，首先自动调用showDesktop()，然后启动呼吸灯
- 呼吸灯应在屏幕边缘显示，不干扰主界面内容
- 所有函数应异步返回，确保不会阻塞其他操作
