---
name: git-pr-review
description: |
  GitHub PR 只读审查技能：基于 Pull Request 元数据、diff、评论、CI 和相关文档生成可追溯的审查报告。
  聚焦实现质量、安全/恶意风险、License 合规和合并决策，默认只读收集证据，不修改目标仓库。
author: "Bensz Conan"
license: "MIT"
category: "coding"
tags: "PR审查, GitHub, 代码评审, 安全审查"
source: "https://github.com/huangwb8/skills/tree/main/git-pr-review"
allowed-tools: "jimu_web_fetch, jimu_browser, read_file, write_file, search_file_content, run_shell_command, ask_user_question"
---
# Git PR Review：GitHub Pull Request 只读审查

## 适用场景

适用于以下任务：

- review 某个 GitHub PR
- 判断某个 Pull Request 是否值得 merge
- 识别 PR 是否存在恶意、高风险或供应链问题
- 对 PR 的实现方案、测试、文档、License 风险做决策分析
- 生成一份可交付的 Markdown PR 审查报告

## 明确禁止事项

默认只读，不修改目标仓库。

- 不要 merge、approve、request changes 或关闭 PR
- 不要 checkout PR 分支后执行代码
- 不要安装 PR 引入的依赖
- 不要运行 PR 中的脚本、测试或构建命令
- 不要把 API token、cookie、认证信息写入报告或中间文件
- 不要因为 PR 作者声称安全就跳过安全审查

如用户明确要求执行 merge、发布或其他写操作，应先说明风险并单独确认，不能把写操作混在本技能默认流程中。

## 输入要求

必须确认：

| 参数 | 要求 |
| --- | --- |
| `github_repo` | GitHub 仓库地址或 `owner/repo` |
| `github_pr` | PR URL、编号或 `#123` |
| `extra_instructions` | 用户特别关注点，可选 |
| `report_path` | 最终报告路径，可选，默认当前工作区 |

如果用户只给了 PR URL，可以从 URL 解析仓库和 PR 编号。不要猜测不存在的 URL。

## 工作流程

### 1. 建立只读审查工作区

默认把中间材料放在当前仓库的隐藏目录：

```text
.git-pr-review/run_<repo>_<pr>/
```

建议保存：

- `raw/pr_meta.md`：PR 标题、作者、状态、目标分支、CI 状态
- `raw/pr_diff.patch`：完整 diff 或 patch
- `raw/pr_comments.md`：评论、review 讨论、关联 issue
- `notes/user_context.md`：用户补充信息
- `notes/risk_review.md`：安全和恶意风险笔记
- `notes/license_review.md`：License / 合规笔记
- `evidence/missing_items.md`：无法获取的材料和影响

### 2. 只读收集证据

优先使用不会改变仓库状态的方式：

- `jimu_web_fetch` 获取公开 PR 页面、diff、patch 或相关文档
- `jimu_browser` 处理需要 JavaScript 渲染的页面
- 如果本机已配置 `gh`，只允许使用只读命令，例如 `gh pr view`、`gh pr diff`、`gh api`
- 对本地已有仓库，只能使用 `git diff`、`git show`、`git log` 等只读命令

无法获取某项证据时，要记录缺口，不要假装已经审查。

### 3. 理解 PR 要解决的问题

必须回答：

- PR 试图解决什么问题
- 这个问题是否真实存在，证据是什么
- PR 采用了什么方案
- 方案是否与标题、描述、commit、测试和文档一致
- 是否存在更简单、更低风险的替代方案

### 4. 审查实现质量

重点检查：

| 维度 | 检查点 |
| --- | --- |
| 数据结构 | 是否引入错误的数据模型、重复状态或不必要转换 |
| 边界情况 | 是否用补丁式 if/else 掩盖设计问题 |
| 复杂度 | 是否过度抽象、超过必要范围或难以回滚 |
| 测试 | 是否覆盖核心路径、失败路径和兼容性场景 |
| 文档 | 是否更新用户可见行为和配置说明 |
| 兼容性 | 是否破坏公开 API、配置、数据格式或现有用户行为 |

### 5. 恶意与高风险审查

必须显式判断风险等级：`Low` / `Medium` / `High` / `Critical`。

重点查找：

- 数据窃取、凭证读取、遥测偷报、后门逻辑
- 可疑下载、远程执行、命令注入、SQL 注入、XSS、权限提升
- 修改 CI/CD、部署脚本、权限配置、密钥读取路径、发布流程
- 混淆代码、base64/hex 载荷、动态执行链
- 借重构之名绕开测试、放宽校验、删除日志或告警
- 与 PR 目标无关的大范围漂移

如果存在恶意或供应链风险，建议必须升级为“不要 merge / 需要维护者安全复核”。

### 6. License / 合规审查

只要 PR 涉及以下内容，就必须审查 License：

- 新依赖、依赖升级、锁文件变化
- vendored 代码、复制粘贴第三方脚本、模板、字体、图标、数据
- `LICENSE`、`NOTICE`、copyright header
- 模型权重、数据集、示例资源

必须说明：

- 是否引入新 License 风险
- 是否需要更新 LICENSE、NOTICE、README 或第三方声明
- 是否存在 GPL/AGPL/SSPL 等可能影响分发的许可证
- 是否需要法务或维护者进一步确认

### 7. 对照“好 PR”标准

从以下角度给出评价：

- 问题清晰，范围收敛
- 实现简单，避免不必要抽象
- 测试足够，失败时可定位
- 文档同步，用户行为明确
- 兼容性清楚，不破坏现有使用者
- 风险可控，能独立回滚

### 8. 输出决策报告

默认输出 Markdown 报告，文件名建议：

```text
Git-PR-Review_<owner>_<repo>_pr-<number>.md
```

报告必须包含：

```markdown
## 结论摘要

- 建议：Merge / Request changes / Do not merge / Need more evidence
- 风险等级：Low / Medium / High / Critical
- 一句话理由：...

## PR 在解决什么问题

## 方案分析

## 代码质量审查

## 恶意/安全风险审查

## License / 合规审查

## 与好 PR 标准的对照

## 关键证据

## 证据不足与待确认点

## 建议的处理方式
```

## 完成前自检

交付前确认：

- 是否只用了只读证据
- 是否没有执行 PR 分支代码
- 是否明确给出 merge 决策建议
- 是否列出安全风险和 License 结论
- 是否把无法获取的证据写进“证据不足”
- 报告中的每个重要判断是否能追溯到 diff、评论、CI、issue 或文档证据
