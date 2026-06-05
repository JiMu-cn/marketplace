---
name: web-design-guidelines
description: |
  Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
author: Vercel
license: 
category: design
tags: Web设计, UI, 前端, 设计规范
source: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
---

## Jimu Platform Adaptation

This skill was imported from a third-party agent ecosystem. When running in Jimu, do not treat upstream host names or tool names as literal requirements. Map them to Jimu capabilities instead:

- Claude Code, Claude.ai, Copilot CLI, Codex, Gemini CLI, and OpenCode mean the current Jimu agent runtime unless the text is explicitly describing the upstream source.
- Upstream tool names such as `Read`, `Write`, `Edit`, `Bash`, `Task`, `WebFetch`, `Skill`, and `TodoWrite` are not Jimu tool names. Use Jimu file, shell, web/browser, skill, todo, and sub-agent tools where available.
- MCP-specific names such as `microsoft_docs_search`, `microsoft_docs_fetch`, Context7, or Aspire MCP are optional upstream integrations. Use them only if the corresponding MCP is configured in Jimu; otherwise use available web or document retrieval tools.
- Instructions to invoke or dispatch skills/subagents should be interpreted through Jimu's skill and sub-agent mechanisms, not through Claude Code/OpenCode/Copilot-specific APIs.

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use Jimu web fetching or browser tools to retrieve the latest rules. The fetched content contains all the rules and output format instructions. Do not call an upstream host-specific web-fetch tool name literally in Jimu.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
