---
name: executing-plans
description: |
  Use when you have a written implementation plan to execute in a separate session with review checkpoints
author: obra
license: 
category: workflow
tags: Superpowers, 计划执行, 进度检查, 交付闭环
source: https://github.com/obra/superpowers/tree/main/skills/executing-plans
---

## Jimu Platform Adaptation

This skill was imported from a third-party agent ecosystem. When running in Jimu, do not treat upstream host names or tool names as literal requirements. Map them to Jimu capabilities instead:

- Claude Code, Claude.ai, Copilot CLI, Codex, Gemini CLI, and OpenCode mean the current Jimu agent runtime unless the text is explicitly describing the upstream source.
- Upstream tool names such as `Read`, `Write`, `Edit`, `Bash`, `Task`, `WebFetch`, `Skill`, and `TodoWrite` are not Jimu tool names. Use Jimu file, shell, web/browser, skill, todo, and sub-agent tools where available.
- MCP-specific names such as `microsoft_docs_search`, `microsoft_docs_fetch`, Context7, or Aspire MCP are optional upstream integrations. Use them only if the corresponding MCP is configured in Jimu; otherwise use available web or document retrieval tools.
- Instructions to invoke or dispatch skills/subagents should be interpreted through Jimu's skill and sub-agent mechanisms, not through Claude Code/OpenCode/Copilot-specific APIs.

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support such as Jimu's sub-agent mechanism. If Jimu sub-agents are available, use the subagent-driven-development workflow instead of a purely inline execution loop.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: create a tracked todo list and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - Ensures isolated workspace (creates one or verifies existing)
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
