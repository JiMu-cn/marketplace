# 贡献指南

## 快速开始

1. Fork 本仓库
2. 把资源文件放到对应目录（格式见下方）
3. 本地校验：
   ```bash
   ALLOW_SOURCE_DIRTY=1 npm run build
   ```
4. 提交并发起 Pull Request

CI 会自动跑构建和校验，格式不对会直接失败。

## 命名规范

- 文件名 = 资源 ID，使用**小写字母 + 中划线**（如 `my-cool-tool`）
- 不要用下划线、大写字母或中文
- 文件名一旦确定不要改名 — 脚本通过文件名追踪版本历史，改名会导致版本记录断掉
- 以 `_` 开头的文件会被构建脚本忽略

## 资源格式规范

### Skills（技能）

路径：`skills/技能名/SKILL.md`

SKILL.md 使用 YAML frontmatter + Markdown 正文：

```markdown
---
name: my-skill          # 必填，与文件夹名一致
description: 一句话描述   # 必填
author: 你的名字         # 必填
---

# Skill: my-skill

## 功能描述

详细说明这个技能做什么。

## 何时使用

- 使用场景 1
- 使用场景 2

## 使用指南

具体的指令和工作流程...
```

必填字段：`name`、`description`、`author`
可选字段：无额外 frontmatter 字段，功能通过 Markdown 正文描述

### Agents（子代理）

路径：`agents/代理名.yaml`

```yaml
name: my-agent              # 必填，与文件名一致（不含 .yaml）
displayName: 我的代理        # 必填，展示名称
author: 你的名字             # 必填
tags:                        # 可选
  - 标签1
  - 标签2
description: 一句话描述       # 必填
tools:                       # 可选，代理可用的工具列表
  - read_file
  - write_file
systemPrompt: |              # 必填，代理的系统提示词
  你是一位专业的...
```

必填字段：`name`、`displayName`、`author`、`description`、`systemPrompt`
可选字段：`tags`、`tools`

### MCPs（MCP 工具）

路径：`mcps/mcp名.json`

```json
{
  "mcp-name": {
    "type": "stdio",
    "command": "cmd",
    "args": ["/c", "npx", "-y", "包名"],
    "env": {
      "API_KEY": "请替换为你的 Key"
    }
  }
}
```

JSON 的顶层 key 就是 MCP ID，与文件名一致（不含 .json）。

必填字段：`type`、`command`
可选字段：`args`、`env`

> 注意：`env` 中的敏感值请用占位符（如 `请替换为你的 Key`），不要提交真实密钥。

### Teams（团队）

路径：`teams/团队名.yaml`

```yaml
name: my-team                # 必填，与文件名一致（不含 .yaml）
displayName: 我的团队         # 必填，展示名称
description: 一句话描述       # 必填
author: 你的名字              # 必填
icon: 👥                     # 可选，emoji 图标
tags:                         # 可选
  - 标签1
members:                      # 必填，至少 2 个成员
  - role: 角色名称            # 必填
    description: 角色职责描述  # 必填
    systemPrompt: |           # 必填（无 agent 时）
      你是一位...
```

必填字段：`name`、`displayName`、`description`、`author`、`members`
每个 member 必填：`role`、`description`、`systemPrompt`

## 校验说明

`npm run build` 会执行以下操作：

1. 扫描四个资源目录，解析文件内容
2. 生成/更新 `registry/` 下的注册表 JSON
3. 运行 `validate-registry.js` 校验：
   - 注册表 JSON 格式正确
   - 无重复 ID
   - 每个注册表条目对应的源文件存在

校验通过才算构建成功。

## 注意事项

- `registry/` 目录由脚本自动生成，不要手动编辑
- 版本号由脚本根据文件内容变更自动管理，不需要手动填写
- 一个 PR 可以包含多个资源的新增/修改
- 提交前确保本地 `npm run build` 通过
