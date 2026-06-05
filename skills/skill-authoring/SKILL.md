---
name: skill-authoring
description: |
  Microsoft guidance for authoring high-quality Agent Skills, adapted for Jimu resource repositories. Use when creating new SKILL.md files, reviewing skill structure, checking frontmatter, organizing references/scripts, or aligning skill content with Jimu registry validation.
author: Microsoft
license: MIT
category: workflow
tags: Microsoft, Skill创建, 编写规范, Frontmatter, 元技能
source: https://github.com/microsoft/GitHub-Copilot-for-Azure/tree/main/.github/skills/skill-authoring
---
## Jimu Platform Adaptation

This skill was imported from a Microsoft upstream agent ecosystem. When running in Jimu, do not treat upstream host names, repository paths, or tool names as literal requirements. Map them to Jimu capabilities instead:

- Upstream skill-directory paths and Copilot test harness directories mean the relevant Jimu skill/resource directory unless the user explicitly asks to work in the upstream repository.
- Upstream CLI, MCP, test, token-counting, and git commands are optional implementation aids. Use Jimu file, shell, web/browser, todo, skill, and sub-agent tools where available, and only run external commands after verifying they exist in the target project.
- Upstream metadata fields such as host-specific tool allowlists or agentskills.io-only formatting rules may not map one-to-one to Jimu. Keep Jimu frontmatter valid for the resource registry and preserve useful intent rather than copying host-specific syntax blindly.
- Jimu accepts the repository frontmatter shape used here, including `description: |` for long descriptions. If upstream agentskills.io guidance conflicts with Jimu registry behavior, follow Jimu registry validation first.

# Skill Authoring Guide

This skill provides guidance for writing Jimu-compatible Agent Skills while preserving useful conventions from the [agentskills.io specification](https://agentskills.io/specification).

## When to Use

- Creating a new skill for a Jimu resource repository or a Microsoft upstream repository
- Reviewing a skill PR for compliance
- Checking if an existing skill follows best practices
- Understanding token budgets and progressive disclosure

## Constraints

- `name`: 1-64 chars, lowercase + hyphens, match directory
- `description`: 1-1024 chars, ≤60 words, explain WHAT and WHEN
- Use `WHEN:` with quoted trigger phrases (preferred over `USE FOR:`)
- Avoid `DO NOT USE FOR:` unless the skill has trigger overlap with a broader skill (see [frontmatter guidelines](references/guidelines/frontmatter.md))
- For Jimu resource repositories, `description: |` block scalars are acceptable for long descriptions; use inline double-quoted strings only when targeting hosts that require that format
- SKILL.md: <500 tokens (soft), <5000 (hard)
- references/*.md: <1000 tokens each

## Structure

- `SKILL.md` (required) - Instructions
- `references/` (optional) - Detailed docs
- `scripts/` (optional) - Executable code

Frontmatter: `name` (lowercase-hyphens), `description` (WHAT + WHEN)

## Progressive Disclosure

Metadata (~100 tokens) loads at startup. SKILL.md (<5000 tokens) loads on activation. References load **only when explicitly linked** (not on activation). Keep SKILL.md lean.

## Reference Loading

References are JIT (just-in-time) loaded:
- Only files explicitly linked via `[text](references/file.md)` load
- **Link to files, not folders** - `[Recipes](references/recipes/README.md)` not `[Recipes](references/recipes/)`
- Each file loads in full (not sections)
- No caching between requests - write self-contained files
- Use recipes/services patterns for multi-option skills

See [REFERENCE-LOADING.md](references/REFERENCE-LOADING.md) for details.

## Validation

```bash
# Run from the scripts directory
npm run build                   # Rebuild Jimu registry when available
npm run validate                # Validate registry/resource entries
# Optionally run upstream reference/token scripts when present
```

### Integrity Checks

When reviewing or authoring skills, verify:
1. **No broken links** - All referenced files exist
2. **No orphaned references** - All reference files are linked
3. **Token budgets** - References under 1000 tokens (split if exceeded)
4. **No duplicates** - Consolidate repeated content
5. **No out-of-place guidance** - Service-specific content belongs in service-specific references

See [Validation](references/validation/README.md) for detailed procedures.

## Reference Documentation

- [Guidelines](references/guidelines/README.md) - Detailed writing guidelines
- [Token Budgets](references/token-budgets.md) - Limits and splitting guidance
- [Reference Loading](references/REFERENCE-LOADING.md) - How references load
- [Checklist](references/CHECKLIST.md) - Pre-submission checklist
- [Validation](references/validation/README.md) - Link and reference validation
- [agentskills.io/specification](https://agentskills.io/specification) - Upstream spec reference; follow Jimu registry validation first when requirements differ
