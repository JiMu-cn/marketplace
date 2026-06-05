---
name: requesting-code-review
description: |
  Use when completing tasks, implementing major features, or before merging to verify work meets requirements
author: obra
license: 
category: debugging
tags: Superpowers, 代码审查, PR说明, 风险提示
source: https://github.com/obra/superpowers/tree/main/skills/requesting-code-review
---

## Jimu Platform Adaptation

This skill was imported from a third-party agent ecosystem. When running in Jimu, do not treat upstream host names or tool names as literal requirements. Map them to Jimu capabilities instead:

- Claude Code, Claude.ai, Copilot CLI, Codex, Gemini CLI, and OpenCode mean the current Jimu agent runtime unless the text is explicitly describing the upstream source.
- Upstream tool names such as `Read`, `Write`, `Edit`, `Bash`, `Task`, `WebFetch`, `Skill`, and `TodoWrite` are not Jimu tool names. Use Jimu file, shell, web/browser, skill, todo, and sub-agent tools where available.
- MCP-specific names such as `microsoft_docs_search`, `microsoft_docs_fetch`, Context7, or Aspire MCP are optional upstream integrations. Use them only if the corresponding MCP is configured in Jimu; otherwise use available web or document retrieval tools.
- Instructions to invoke or dispatch skills/subagents should be interpreted through Jimu's skill and sub-agent mechanisms, not through Claude Code/OpenCode/Copilot-specific APIs.

# Requesting Code Review

Dispatch a code reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code reviewer subagent:**

Use Jimu sub-agent delegation when available, filling the review brief from `code-reviewer.md`; otherwise perform a separate inline review pass with the same brief.

**Placeholders:**
- `{DESCRIPTION}` - Brief summary of what you built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code reviewer subagent]
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each task or at natural checkpoints
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: requesting-code-review/code-reviewer.md
