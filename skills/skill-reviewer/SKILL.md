---
name: skill-reviewer
description: |
  Review Skill changes with structured severity-rated feedback covering frontmatter, routing conflicts, token budgets, references, scripts, tests, and repository conventions. Use when checking Jimu Skill quality before import, release, or pull request review.
author: Microsoft
license: MIT
category: workflow
tags: Microsoft, Skill审查, 质量检查, 代码审查, 元技能
source: https://github.com/microsoft/GitHub-Copilot-for-Azure/tree/main/.github/skills/skill-reviewer
---
## Jimu Platform Adaptation

This skill was imported from a Microsoft upstream agent ecosystem. When running in Jimu, do not treat upstream host names, repository paths, or tool names as literal requirements. Map them to Jimu capabilities instead:

- Upstream skill-directory paths and Copilot test harness directories mean the relevant Jimu skill/resource directory unless the user explicitly asks to work in the upstream repository.
- Upstream CLI, MCP, test, token-counting, and git commands are optional implementation aids. Use Jimu file, shell, web/browser, todo, skill, and sub-agent tools where available, and only run external commands after verifying they exist in the target project.
- Upstream metadata fields such as host-specific tool allowlists or agentskills.io-only formatting rules may not map one-to-one to Jimu. Keep Jimu frontmatter valid for the resource registry and preserve useful intent rather than copying host-specific syntax blindly.
- Review Jimu skill changes by checking `SKILL.md`, referenced files, scripts, resource integrity, platform binding, and `npm run build && npm run validate` results when working in this resource repository.

# Skill PR Reviewer

Performs thorough, structured code reviews of skill PRs — severity-classified findings with actionable fixes, positive acknowledgment, and a summary table.

## When to Use

- Reviewing a PR that adds or modifies a skill under Jimu `skills/` or an explicitly targeted upstream skill directory
- Checking skill compliance before submitting a PR
- Auditing an existing skill for quality issues

> 💡 **Note:** Microsoft upstream meta-skills and service skills use different conventions. In Jimu, apply only checklist items that match the target resource shape.

## Review Workflow

1. **Collect** — Identify all changed skill files (SKILL.md, references, tests, scripts)
2. **Check** — Run each category from the [review checklist](references/review-checklist.md)
3. **Classify** — Assign severity per the [severity guide](references/severity-classification.md)
4. **Analyze Routing** — Check triggers for conflicts per [routing analysis](references/routing-analysis.md)
5. **Draft** — Write the review per the [output format](references/output-format.md)
6. **Validate** — Verify suggested fixes are actionable with accurate file/line references

## Error Handling

| Error | Remediation |
|-------|-------------|
| Cannot determine changed files | Ask user for the file list or PR number |
| Token counting unavailable | Estimate at ~4 chars per token |

## References

- [Review Checklist](references/review-checklist.md)
- [Severity Classification](references/severity-classification.md)
- [Routing Analysis](references/routing-analysis.md)
- [Output Format](references/output-format.md)
