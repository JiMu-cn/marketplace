---
name: git-publish-release
description: |
  GitHub Release 发布助手：根据 Git tag、commit 历史和项目上下文生成版本发布说明与发布前检查清单。
  默认只做只读分析和 Release Notes 准备；创建 Release、推送 tag 等外部可见操作必须获得用户明确授权。
author: "Bensz Conan"
license: "MIT"
category: "workflow"
tags: "GitHub Release, Release Notes, 版本发布, Git"
source: "https://github.com/huangwb8/skills/tree/main/git-publish-release"
allowed-tools: "run_shell_command, ask_user_question, write_file, read_file, search_file_content"
---
# Git Publish Release：安全发布助手

## 适用场景

适用于以下需求：

- 生成 Release Notes
- 准备发布某个版本
- 对比两个 tag 之间的变化
- 创建 GitHub Release
- 判断某个版本是否应标记为 prerelease

## 安全原则

- 默认只分析和生成发布说明，不创建外部 Release
- 创建 Release、推送 tag、编辑已有 Release 都属于外部可见操作，必须用户明确授权
- 不自动覆盖已有 Release
- 不自动创建或推送 tag，除非用户明确要求
- 不在发布说明中包含密钥、内部路径、未公开问题细节或敏感运行日志
- 不执行项目构建、打包或部署，除非用户单独要求并确认范围

## 输入要求

必须确认：

| 参数 | 说明 |
| --- | --- |
| `target_tag` | 目标版本 tag，例如 `v1.2.0` |
| `previous_tag` | 可选；未指定时读取最近一个 Release 或 tag 作为比较基线 |
| `repo` | 可选；默认当前 Git 仓库 |
| `publish` | 是否创建 GitHub Release，默认否 |
| `prerelease` | 是否预发布；未指定时根据 tag 名称判断 |

如果目标 tag 不明确，先列出最近 tag 供用户选择。

## 工作流程

### 1. 前置检查

只读检查：

```bash
git status --short --branch
git tag --sort=-creatordate
git log -n 5 --oneline
```

如果用户要求创建 GitHub Release，再检查：

```bash
gh auth status
gh repo view --json nameWithOwner
```

如果 `gh` 不可用或未认证，只生成发布说明并说明发布步骤被阻塞。

### 2. 确定比较范围

优先级：

1. 用户指定 `previous_tag`
2. 最近一次 GitHub Release 的 tag
3. 最近一个早于 `target_tag` 的本地 tag
4. 若是首次发布，从首个 commit 到 `target_tag`

读取 commit 历史：

```bash
git log <previous_tag>..<target_tag> --pretty=format:"%h|%s|%an|%ad" --date=short
```

如果是首次发布，使用：

```bash
git log <target_tag> --pretty=format:"%h|%s|%an|%ad" --date=short
```

### 3. 生成 Release Notes

按用户和项目风格选择中文或英文。默认中文结构：

```markdown
# <target_tag> 发布说明

## 版本摘要

一句话说明这个版本的核心价值。

## 主要更新

- ...

## 修复与稳定性

- ...

## 文档与维护

- ...

## 兼容性与迁移

- 是否有破坏性变更
- 是否需要用户修改配置、数据或部署方式

## 完整变更

- `<hash>` <subject>
```

分类依据：

| 类别 | commit 线索 |
| --- | --- |
| 主要更新 | feat、新增能力、重要用户价值 |
| 修复与稳定性 | fix、bug、稳定性、回归修复 |
| 性能与体验 | perf、优化、交互、延迟 |
| 文档与维护 | docs、chore、ci、build、test |
| 兼容性与迁移 | breaking、schema、配置、API 变化 |

### 4. 发布前确认

如果用户要求创建 Release，先展示：

- 仓库名
- target tag
- previous tag
- 是否 prerelease
- Release 标题
- Release Notes 预览
- 将执行的命令

确认后再执行外部发布。

### 5. 创建 GitHub Release

用 `write_file` 写入临时 notes 文件，然后执行：

```bash
gh release create <target_tag> --title <title> --notes-file <notes-file>
```

如果是预发布，追加：

```bash
--prerelease
```

如果 Release 已存在，不覆盖；询问用户是否要改为编辑模式。

### 6. 完成验证

发布后只读验证：

```bash
gh release view <target_tag> --json url,tagName,name,isPrerelease
```

报告 Release URL、tag、标题和 prerelease 状态。

## 输出格式

```markdown
## 发布准备结果

- 仓库：...
- 目标 tag：...
- 比较范围：...
- prerelease：是/否
- 是否已发布：否 / 是，URL：...

## Release Notes

...

## 验证

- 运行命令：...
- 结果：...
- 遗留问题：...
```

## 完成标准

- 已明确目标 tag 和比较范围
- Release Notes 来源于真实 commit 历史
- 外部发布操作只在用户明确授权后执行
- 发布后如实验证结果
- 未泄露敏感信息，未覆盖已有 Release，未执行无关部署
