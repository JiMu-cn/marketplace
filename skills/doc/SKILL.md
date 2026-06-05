---
name: doc
description: |
  Read, create, and edit .docx documents with formatting and layout fidelity using the document-processing workflow in this skill.
author: Open Design
license: 
category: document
tags: DOCX, Word, 文档编辑, Open Design
source: https://github.com/nexu-io/open-design/tree/main/skills/doc
---

## Jimu Platform Adaptation

This skill was imported from a third-party agent ecosystem. When running in Jimu, do not treat upstream host names or tool names as literal requirements. Map them to Jimu capabilities instead:

- Claude Code, Claude.ai, Copilot CLI, Codex, Gemini CLI, and OpenCode mean the current Jimu agent runtime unless the text is explicitly describing the upstream source.
- Upstream tool names such as `Read`, `Write`, `Edit`, `Bash`, `Task`, `WebFetch`, `Skill`, and `TodoWrite` are not Jimu tool names. Use Jimu file, shell, web/browser, skill, todo, and sub-agent tools where available.
- MCP-specific names such as `microsoft_docs_search`, `microsoft_docs_fetch`, Context7, or Aspire MCP are optional upstream integrations. Use them only if the corresponding MCP is configured in Jimu; otherwise use available web or document retrieval tools.
- Instructions to invoke or dispatch skills/subagents should be interpreted through Jimu's skill and sub-agent mechanisms, not through Claude Code/OpenCode/Copilot-specific APIs.

# doc

> Curated from OpenAI's skills repository.

## What it does

Read, create, and edit .docx documents with formatting and layout fidelity using the document-processing workflow in this skill.

## Source

- Upstream: https://github.com/openai/skills
- Category: `documents`

## How to use

This catalogue entry advertises the skill in Open Design so the agent
discovers it during planning. To run the full upstream workflow with
its original assets, scripts, and references, install the upstream
bundle into your active agent's skills directory:

```bash
# Inspect the upstream README for exact paths
open https://github.com/openai/skills
```

Then ask the agent to invoke this skill by name (`doc`) or with
one of the trigger phrases listed in this skill's frontmatter.
