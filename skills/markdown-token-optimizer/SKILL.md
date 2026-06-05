---
name: markdown-token-optimizer
description: |
  Analyze Markdown and SKILL.md files for token efficiency while preserving clarity and required resources. Use when reducing verbose skill instructions, trimming duplicated Markdown, reviewing token bloat, or making AI-facing documentation more concise without breaking Jimu skill behavior.
author: Microsoft
license: MIT
category: workflow
tags: Microsoft, Token优化, Markdown, SKILL.md, 文档优化
source: https://github.com/microsoft/GitHub-Copilot-for-Azure/tree/main/.github/skills/markdown-token-optimizer
---
## Jimu Platform Adaptation

This skill was imported from a Microsoft upstream agent ecosystem. When running in Jimu, do not treat upstream host names, repository paths, or tool names as literal requirements. Map them to Jimu capabilities instead:

- Upstream skill-directory paths and Copilot test harness directories mean the relevant Jimu skill/resource directory unless the user explicitly asks to work in the upstream repository.
- Upstream CLI, MCP, test, token-counting, and git commands are optional implementation aids. Use Jimu file, shell, web/browser, todo, skill, and sub-agent tools where available, and only run external commands after verifying they exist in the target project.
- Upstream metadata fields such as host-specific tool allowlists or agentskills.io-only formatting rules may not map one-to-one to Jimu. Keep Jimu frontmatter valid for the resource registry and preserve useful intent rather than copying host-specific syntax blindly.
- Token budgets are heuristics. Optimize for lower context cost without deleting instructions, references, scripts, or examples that are required for the skill to work in Jimu.

# Markdown Token Optimizer

This skill analyzes markdown files and suggests optimizations to reduce token consumption while maintaining clarity.

## When to Use

- Optimize markdown files for token efficiency
- Reduce SKILL.md file size or check for bloat
- Make documentation more concise for AI consumption

## Workflow

1. **Count** - Calculate tokens (~4 chars = 1 token), report totals
2. **Scan** - Find patterns: emojis, verbosity, duplication, large blocks
3. **Suggest** - Table with location, issue, fix, savings estimate
4. **Summary** - Current/potential/savings with top recommendations

See [ANTI-PATTERNS.md](references/ANTI-PATTERNS.md) for detection patterns and [OPTIMIZATION-PATTERNS.md](references/OPTIMIZATION-PATTERNS.md) for techniques.

## Rules

- Suggest only (no auto-modification)  
- Preserve clarity in all optimizations
- SKILL.md target: keep concise enough for activation; references should stay focused and split when large. Do not remove required resources just to hit a token target.

## References

- [OPTIMIZATION-PATTERNS.md](references/OPTIMIZATION-PATTERNS.md) - Optimization techniques
- [ANTI-PATTERNS.md](references/ANTI-PATTERNS.md) - Token-wasting patterns
