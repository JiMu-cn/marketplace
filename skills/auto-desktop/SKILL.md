---
name: auto-desktop
description: 【桌面GUI自动化Agent】通过截图理解+精准点击实现自然语言驱动的桌面自动化。当用户需要使用 AI 自动操控桌面应用、执行 GUI 自动化任务时加载此技能。触发词：桌面自动化、desktop agent、桌面操控、GUI自动化、屏幕操控、auto desktop。
category: "workflow"
tags: "桌面自动化, GUI, Agent, 视觉理解"
---
# 桌面 GUI 自动化技能包

通过视觉语言模型（VLM）截屏理解 + nut-js 控制桌面鼠标键盘，实现自然语言驱动的桌面 GUI 自动化操作。

核心流程：截屏 → 发送给 VLM 模型 → 解析动作指令 → 执行鼠标/键盘操作 → 循环直到任务完成。

## 技能包结构

```text
auto-desktop/
├── SKILL.md              # 本文件（部署与使用指南）
└── project/
    ├── package.json      # 项目配置
    ├── package-lock.json # 锁定依赖版本，供 npm ci 使用
    ├── bin/
    │   └── ui-tars-agent.js
    └── packages/
        ├── shared/
        ├── action-parser/
        ├── sdk/
        └── operator-nut-js/
```

## 分发方式

推荐使用 **轻量分发模式**：

- **分发时不要携带 `project/node_modules/`**
- 只分发上面结构中的源码骨架
- 让目标用户机器上的 AI 助手或用户自己在本机安装运行时依赖

这样有几个优点：

- 包体积更小
- 目标机器会自动安装**当前平台对应**的 Electron 和 nut-js 原生依赖
- Windows / macOS / Linux 更容易正确适配
- 避免把当前机器的 Windows 专属 `node_modules` 错发到 macOS

---

## API Key 持久化存储规则

> **重要：AI 助手加载本技能后必须严格遵守以下规则。**

用户的配置通过 JSON 文件持久化存储，路径为 `~/.skills/auto-desktop.json`。不使用注册表或系统环境变量。

**配置文件格式：**

```json
{
  "api_key": "用户的API_Key",
  "base_url": "模型API地址",
  "model": "模型名称"
}
```

**AI 助手必须遵守的流程：**

1. 技能加载时：使用 `read_file` 读取 `~/.skills/auto-desktop.json`，检查是否存在且 `api_key` 非空
2. 如果已有值：直接使用，无需询问用户
3. 如果没有值：询问用户提供 API Key、base_url、model
4. 用户提供后：立即通过 `write_file` 写入 JSON 配置文件持久化保存
5. 用户要求更换 Key 时：更新 JSON 配置文件

**运行时传递：** 从 JSON 配置文件读取值，通过临时环境变量传递给 Node.js 进程：

```bash
export UI_TARS_API_KEY=$(python -c "import json,os; c=json.load(open(os.path.expanduser('~/.skills/auto-desktop.json'))); print(c['api_key'])") && \
export UI_TARS_BASE_URL=$(python -c "import json,os; c=json.load(open(os.path.expanduser('~/.skills/auto-desktop.json'))); print(c.get('base_url',''))") && \
export UI_TARS_MODEL=$(python -c "import json,os; c=json.load(open(os.path.expanduser('~/.skills/auto-desktop.json'))); print(c.get('model',''))") && \
cd <skill_path>/project && \
node bin/ui-tars-agent.js run -i "任务描述" --json
```

> AI 助手也可以直接用 `read_file` 读取 JSON 配置，然后将值拼接到 `--api-key`、`--base-url`、`--model` 命令行参数中。

**严禁将 API Key 写入 SKILL.md 或任何代码文件中。**

---

## 一、环境要求

- Node.js >= 20.x（推荐 v22+）
- 操作系统：Windows / macOS / Linux（桌面环境）
- 首次使用需要联网安装依赖

**macOS 额外权限（必须）：**

macOS 用户首次运行前需要在「系统设置 → 隐私与安全性」中授予以下权限：

- 「屏幕录制」— 允许截图（否则截图全黑）
- 「辅助功能」— 允许控制鼠标键盘（否则点击/输入无效）

授权对象为运行本技能的终端应用（如 Terminal、iTerm2）或 Node.js 进程。

**验证 Node.js：**

```bash
node --version
# 应输出 v20.x 或更高
```

---

## 二、安装方式

> **重要：AI 助手加载本技能后，如果发现 `project/node_modules/` 不存在或运行时报 `MODULE_NOT_FOUND`，应主动执行依赖安装，而不是要求用户手工排查。**

### AI 助手必须遵守的安装流程

1. 先确认 `Node.js` 已可用：

```bash
node --version
```

2. 再进入技能项目目录安装依赖：

```bash
cd <skill_path>/project
npm ci --omit=dev
```

3. 安装完成后立刻执行环境检查：

```bash
node bin/ui-tars-agent.js check
```

4. 只有当检查通过后，才继续执行自动化任务。

### AI 助手在分发场景中的行为要求

当用户把本技能发到另一台机器时，AI 助手应默认认为这是**轻量包**，并按以下顺序处理：

1. 定位 `SKILL.md` 所在目录
2. 检查 `<skill_path>/project/node_modules/` 是否存在
3. 如果不存在：执行 `npm ci --omit=dev`
4. 如果存在但运行时报依赖问题：重新执行 `npm ci --omit=dev`
5. 执行 `node bin/ui-tars-agent.js check`
6. 再开始实际任务

### 手动安装（供用户或 AI 参考）

```bash
cd <skill_path>/project
npm ci --omit=dev
node bin/ui-tars-agent.js check
```

预期输出包含：

- Node.js 版本
- 平台信息
- nut-js 状态
- 屏幕信息
- 模型配置状态

---

## 三、模型服务配置

本技能需要连接支持视觉理解的 VLM 模型服务（OpenAI 兼容接口）。

### 方式 A：使用火山方舟云端 API（推荐，无需 GPU）

#### 步骤一：注册并登录火山方舟

1. 访问 [火山方舟平台](https://www.volcengine.com/product/ark)
2. 注册并登录账号

#### 步骤二：开通模型服务

1. 进入控制台，找到「模型广场」或「在线推理」
2. 搜索 `doubao-seed-2-0-pro-260215` 模型并开通
3. 开通服务或创建推理接入点

#### 步骤三：获取 API Key

1. 进入「API Key 管理」页面
2. 创建 API Key
3. 立即保存完整 Key

#### 云端配置参数

- `base_url`: `https://ark.cn-beijing.volces.com/api/v3`
- `model`: `doubao-seed-2-0-pro-260215`
- `api_key`: 你的火山方舟 API Key

### 方式 B：本地部署模型（需要 NVIDIA GPU）

适用于有 NVIDIA GPU（建议 16GB+ 显存）的用户。

#### 模型信息

- 模型名称：UI-TARS-1.5-7B
- HuggingFace: `https://huggingface.co/ByteDance-Seed/UI-TARS-1.5-7B`

#### B1. 使用 vLLM 部署

```bash
pip install vllm>=0.12.0
python3 -m vllm.entrypoints.openai.api_server \
  --served-model-name ui-tars \
  --model ByteDance-Seed/UI-TARS-1.5-7B \
  --port 8000
```

#### B2. 使用 SGLang 部署（替代方案）

```bash
pip install sglang>=0.5.6.post1
pip install -U transformers --pre

python3 -m sglang.launch_server \
  --model-path ByteDance-Seed/UI-TARS-1.5-7B \
  --served-model-name ui-tars \
  --port 8000
```

#### 本地部署配置参数

启动后配置：

- `base_url`: `http://localhost:8000/v1`
- `model`: `ui-tars`
- `api_key`: `EMPTY`

---

## 四、使用方法

### 4.1 命令行使用

```bash
cd <skill_path>/project

node bin/ui-tars-agent.js run -i "打开计算器计算 123+456"

node bin/ui-tars-agent.js run \
  -i "打开浏览器搜索天气" \
  --base-url http://localhost:8000/v1 \
  --api-key EMPTY \
  --model ui-tars

node bin/ui-tars-agent.js run -i "打开记事本输入Hello" --json

node bin/ui-tars-agent.js run -i "任务描述" --max-loop 30 --loop-interval 2000

node bin/ui-tars-agent.js check
```

### 4.2 配置优先级

配置读取优先级（高 → 低）：

1. 命令行参数（`--base-url`、`--api-key`、`--model`）
2. 环境变量（`UI_TARS_BASE_URL`、`UI_TARS_API_KEY`、`UI_TARS_MODEL`）
3. 配置文件（`~/.skills/auto-desktop.json`）
4. 内置默认值

### 4.3 JSON 输出格式

```json
{"type":"start","timestamp":1234567890,"instruction":"打开浏览器","model":"..."}
{"type":"action","timestamp":1234567891,"step":1,"action_type":"click","action_inputs":{"x":500,"y":300},"thought":"点击浏览器图标"}
{"type":"complete","timestamp":1234567893,"steps":2}
```

事件类型：

- `start` — 任务开始
- `action` — 执行动作
- `status` — 状态变化
- `error` — 错误信息
- `complete` — 任务完成

### 4.4 全部环境变量

- `UI_TARS_API_KEY` — API Key

---

## 五、运行时视觉反馈

本技能运行时会显示两种视觉反馈，均基于 Electron 跨平台实现：

### 5.1 屏幕边缘呼吸灯

- 屏幕四周显示蓝色呼吸灯光效，提示 AI 正在操控桌面
- 始终显示，不会在截图或操作时隐藏
- 任务结束自动关闭

### 5.2 底部状态栏 + 停止按钮

- 屏幕底部居中显示 AI 当前思考内容（thought 文本）
- 右侧有独立的「停止」按钮，点击可立即终止任务
- 状态栏文字区域完全鼠标穿透，不影响桌面操作
- 截图和执行操作时状态栏自动隐藏，避免干扰模型识别

特点：

- Windows / macOS / Linux 统一方案
- 首次安装时会随 Electron 一起下载当前平台运行时

注意：

- 如果目标机器禁用了透明置顶窗口，视觉效果可能失效，但主功能仍可运行
- 多显示器环境下当前仅覆盖主显示器
- macOS 首次运行可能需要授予「屏幕录制」权限才能显示 overlay

---

## 六、安全策略（必须遵守）

### 6.1 必须交由用户接管的场景

- 支付与金融
- 密码与认证
- 隐私信息输入
- 系统关键操作
- 授权与协议确认

### 6.2 AI 助手的安全职责

1. 首次运行前说明将执行的操作并获得明确同意
2. 遇到敏感场景主动终止执行
3. 连续多步无变化或异常时立即停止
4. 不自动代填敏感信息
5. 保持操作可追溯

---

## 七、常见问题

- `node` 命令找不到：安装 Node.js >= 20.x
- `npm ci` 失败：检查网络、代理、npm registry
- nut-js 初始化失败：确认在桌面环境运行，Windows 可能需要管理员权限，macOS 需授权辅助功能
- 模型连接失败：检查 api-key、base-url、model
- 截图黑屏/异常：部分应用有 DRM 保护
- 点击位置偏移：建议屏幕缩放 100%，多显示器确认主屏
- Electron overlay 不显示：检查系统是否允许透明置顶窗口
- `MODULE_NOT_FOUND`：进入 `<skill_path>/project` 后重新执行 `npm ci --omit=dev`

---

## 八、支持的操作

- `click`
- `type`
- `hotkey`
- `scroll`
- `drag`
- `wait`
- `finished`
- `call_user`

---

## 九、轻量分发给他人的建议

推荐分发内容：

- `SKILL.md`
- `project/bin`
- `project/packages`
- `project/package.json`
- `project/package-lock.json`

**不要分发：**

- `project/node_modules`

让目标机器上的 AI 助手根据本说明自动执行安装：

```bash
cd <skill_path>/project
npm ci --omit=dev
node bin/ui-tars-agent.js check
```

## 十、主模型（调度者）的管控职责

本技能由主模型（调度者）调用 GUI 模型（执行者）完成桌面自动化任务。**主模型对任务质量和稳定性负有最终责任。**

### 10.1 任务模式选择

主模型在启动任务前应根据任务特性选择合适的执行模式：

| 任务特性 | 推荐模式 | 说明 |
|---------|---------|------|
| 任务复杂、步骤多、无实时性要求 | **分步控制法** | 主模型逐步拆解任务，每步验证结果后再给下一步 |
| 任务简单明确、实时性要求高 | **直接执行法** | 主模型给出完整提示词，GUI 模型自主循环执行 |
| 用户需要实时交互反馈 | **直接执行法** | GUI 模型持续执行，主模型监控并向用户汇报 |

**分步控制法适用场景：**
- 多步骤流程（如：打开APP → 登录 → 导航 → 操作 → 确认）
- 需要根据前一步结果决定下一步（如条件分支）
- 目标应用状态不确定，需要"探测-规划-执行"循环
- 任务步骤可能超过 20 步

**直接执行法适用场景：**
- 简单明确的单步或少量步骤操作（如：点击这个按钮）
- 实时性要求高的场景（如：游戏中需要快速反应）
- 用户明确要求 AI 自动完成全程
- 已经过充分预探索的确定性流程

**模式切换：**
- 如果分步控制法执行中发现任务比预期简单，主模型可切换为直接执行法
- 如果直接执行法陷入循环，主模型应切换为分步控制法重新规划

### 10.2 调用前：任务规划与提示词构造

**主模型必须在调用本技能前完成以下工作：**

1. **任务拆解**：将用户需求分解为明确的步骤序列
2. **上下文补充**：在调用 `-i` 指令时，主动附加：
   - 目标应用的状态（是否已登录、是否已打开等）
   - 已知的应用结构信息（如有）
   - 可能的异常分支预案
3. **约束注入**：根据任务类型判断是否需要追加安全约束（如涉及隐私输入时）

**示例：**

❌ 不推荐的调用方式：
```
-i "打开欢乐斗地主开始游戏"
```

✅ 推荐的调用方式：
```
-i "首先确认QQ游戏中心已从系统托盘打开且已登录，然后点击左侧游戏列表找到欢乐斗地主，点击开始匹配。等待匹配成功后开始游戏。"
```

### 10.3 运行中：循环监控与干预

GUI 模型**没有深度思考能力**（`thinking.type: 'disabled'`），无法主动识别重复操作死循环。

**主模型应通过 JSON 日志监控任务状态：**

| JSON type | 含义 | 主模型应做之事 |
|-----------|------|----------------|
| `status: running` | 正常运行 | 持续监控 |
| `action` | 每步执行记录 | 检查是否出现重复动作模式 |
| `status: error` | 发生错误 | 分析错误原因，决定是否重试 |
| `status: call_user` | AI 主动求助 | 说明 AI 遇到无法解决的障碍，需用户介入 |
| `complete` | 任务结束 | 验证结果是否符合预期 |

**循环检测规则（建议主模型自行实现）：**
- 如果连续 3 次 `action` 中 `action_type` 和 `start_coords` 完全相同，且界面无变化，应判定为陷入循环
- 循环发生时，主模型应主动终止任务或重新构造提示词

### 10.4 调用后：结果验证

- 任务完成后，主模型应向用户确认结果是否符合预期
- 如果任务失败，主模型应分析日志判断是 GUI 模型问题还是任务本身问题

### 10.5 提示词构造参考

以下约束可以直接追加到 `-i` 指令末尾使用：

```
【补充约束】
- 如果目标界面没有变化，不要重复执行相同的点击操作
- 如果同一个操作连续执行3次界面仍然没有变化，说明该路径不通，应尝试其他方式
- 如果遇到弹窗，先分析弹窗内容再做决定，不要盲目关闭
- 如果需要用户登录或授权才能继续，应立即 call_user 停止任务
```

### 10.6 不适合交给 GUI 模型处理的场景

- 需要输入中文长文本（键盘输入效率低）
- 需要跨多个完全不同类型的应用协同操作
- 任务步骤超过 50 步仍未完成（建议拆分为多个子任务）
- 目标应用有严格的验证码或反自动化机制
