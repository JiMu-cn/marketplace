---
name: git-commit
description: |
  Git 提交助手：审阅当前仓库状态、完整 diff 和最近提交风格，生成清晰的中文提交信息并创建本地提交。
  默认只暂存本轮相关文件，不推送、不跳过本地 Git 钩子、不使用全量暂存，适合安全整理提交边界。
author: "Bensz Conan"
license: "MIT"
category: "workflow"
tags: "Git, Commit, 版本控制, 提交信息"
source: "https://github.com/huangwb8/skills/tree/main/git-commit"
allowed-tools: "run_shell_command, ask_user_question, write_file, read_file"
---
# Git Commit：安全提交助手

## 适用场景

适用于以下需求：

- 提交当前 Git 改动
- 生成或润色 commit message
- 判断一组改动是否应该拆分提交
- 检查暂存区是否完整
- 按项目历史风格创建本地 commit

## 安全原则

- 默认只创建本地提交，不自动 push
- 不使用强制推送、硬重置或改写远端历史
- 不默认跳过本地 Git 钩子；只有用户明确要求并理解风险时才考虑
- 不使用全量暂存作为默认策略；只暂存本轮明确相关文件
- 发现陌生未跟踪文件、锁文件、大型生成文件或他人改动时，先审查再决定是否纳入
- 提交前必须审阅完整 diff，不能只看文件名
- 提交失败时如实报告，不绕过钩子或强行提交

## 标准流程

### 1. 仓库状态检查

先运行：

```bash
git status --short --branch
git diff HEAD
git log -n 3 --oneline
```

必须确认：

- 当前目录是 Git 仓库
- 当前分支和上游状态清楚
- 是否有 merge/rebase/cherry-pick 冲突
- 哪些文件已暂存、未暂存、未跟踪
- 最近提交信息使用中文还是英文，是否遵循 Conventional Commits

### 2. 变更归类

按以下维度判断是否拆分提交：

| 维度 | 判断 |
| --- | --- |
| 目标 | 是否服务同一个用户可理解的目的 |
| 范围 | 是否跨多个无关模块 |
| 类型 | 是否混合 feat/fix/docs/refactor/test/chore |
| 回滚 | 单独回滚是否会破坏其他改动 |
| 风险 | 是否包含 schema、配置、迁移、发布脚本等高风险变更 |

如果改动明显属于多个独立目标，应建议拆分提交，并只暂存当前要提交的一组文件。

### 3. 暂存策略

优先使用显式路径：

```bash
git add -- <path1> <path2>
```

如路径包含空格或特殊字符，使用 Git 支持的安全路径传递方式。

不要默认把所有未跟踪文件加入提交。未跟踪文件必须逐个判断：

- 源码、测试、文档：可纳入，前提是与本轮目标相关
- 构建产物、缓存、日志、临时文件：通常不纳入
- 锁文件：只有依赖确实变化且用户目标相关时才纳入
- 配置或密钥类文件：必须检查是否包含敏感内容

### 4. 生成提交信息

优先匹配项目历史风格。如果没有明确项目风格，使用中文 Conventional Commit：

```text
<type>(<scope>): <subject>

- 说明为什么改
- 说明关键实现点
- 说明验证或影响范围
```

常用 type：

| type | 场景 |
| --- | --- |
| feat | 新功能 |
| fix | 修复缺陷 |
| docs | 文档 |
| test | 测试 |
| refactor | 不改变行为的重构 |
| perf | 性能优化 |
| chore | 构建、脚本、维护 |

要求：

- subject 简洁，优先说明用户可理解的变化
- body 不超过 3 条要点，重点写动机和影响
- 破坏性变更必须使用 `BREAKING CHANGE:` 说明
- 不在提交信息里写入密钥、私有路径或无关运行日志

### 5. 创建提交

建议使用消息文件，避免 shell 转义问题：

1. 用 `write_file` 把提交信息写到临时文件
2. 执行：

```bash
git commit -F <message-file>
```

提交后运行：

```bash
git status --short --branch
```

确认工作区状态，并报告提交哈希。

### 6. 推送策略

只有用户明确要求 push 时才推送。

推送前必须说明这是外部可见操作，并使用普通 push：

```bash
git push
```

如果 push 被拒绝，提示先拉取/变基或让用户决定，不要强推。

## 输出格式

```markdown
## 提交结果

- 提交：`<hash> <subject>`
- 暂存文件：...
- 未提交剩余：...
- 验证：...

## 说明

- 是否拆分：...
- 是否推送：未推送 / 已按用户要求推送
- 风险：...
```

## 完成标准

- 已审阅 `git status`、`git diff HEAD` 和最近提交风格
- 只提交了与目标相关的文件
- 提交信息清晰且匹配项目风格
- 本地提交成功并确认状态
- 没有擅自 push、跳过本地 Git 钩子或改写历史
