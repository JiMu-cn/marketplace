---
name: sensei
description: |
  Microsoft Sensei workflow for iteratively improving skill frontmatter, trigger quality, compliance, token budget, reference integrity, and tests. Use when auditing or improving Jimu Skill metadata, routing behavior, or low-quality imported skills; supports lightweight Ralph-loop review and optional deeper GEPA-style optimization when dependencies are available.
author: Microsoft
license: MIT
category: workflow
tags: Microsoft, Skill优化, Frontmatter, 触发词, GEPA, 元技能
source: https://github.com/microsoft/GitHub-Copilot-for-Azure/tree/main/.github/skills/sensei
---
## Jimu Platform Adaptation

This skill was imported from a Microsoft upstream agent ecosystem. When running in Jimu, do not treat upstream host names, repository paths, or tool names as literal requirements. Map them to Jimu capabilities instead:

- Upstream skill-directory paths and Copilot test harness directories mean the relevant Jimu skill/resource directory unless the user explicitly asks to work in the upstream repository.
- Upstream CLI, MCP, test, token-counting, and git commands are optional implementation aids. Use Jimu file, shell, web/browser, todo, skill, and sub-agent tools where available, and only run external commands after verifying they exist in the target project.
- Upstream metadata fields such as host-specific tool allowlists or agentskills.io-only formatting rules may not map one-to-one to Jimu. Keep Jimu frontmatter valid for the resource registry and preserve useful intent rather than copying host-specific syntax blindly.
- For Jimu resources, prioritize `SKILL.md` clarity, trigger quality, reference integrity, registry validation, and platform-neutral wording. Use GEPA/Sensei scripts only when their local dependencies are present and the user explicitly wants that deeper optimization loop.

# Sensei

> "A true master teaches not by telling, but by refining." - The Skill Sensei

Automates skill frontmatter improvement using the [Ralph loop pattern](https://github.com/soderlind/ralph) - iteratively improving skills until they reach Medium-High compliance with passing tests, then checking token usage and prompting for action.

## Help

When user says "sensei help" or asks how to use sensei, show this:

```
╔══════════════════════════════════════════════════════════════════╗
║  SENSEI - Skill Frontmatter Compliance Improver                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  USAGE:                                                          ║
║    Run sensei on <skill-name>              # Single skill        ║
║    Run sensei on <skill-name> --skip-integration  # Fast mode    ║
║    Run sensei on <skill1>, <skill2>, ...   # Multiple skills     ║
║    Run sensei on all Low-adherence skills  # Batch by score      ║
║    Run sensei on all skills                # All skills       ║
║                                                                  ║
║  EXAMPLES:                                                       ║
║    Run sensei on appinsights-instrumentation                     ║
║    Run sensei on azure-security --skip-integration               ║
║    Run sensei on azure-security, azure-observability             ║
║    Run sensei on all Low-adherence skills                        ║
║                                                                  ║
║  WHAT IT DOES:                                                   ║
║    1. READ      - Load skill's SKILL.md, tests, and token count  ║
║    2. SCORE     - Check compliance (Low/Medium/Medium-High/High) ║
║    3. SCAFFOLD  - Create tests from template if missing          ║
║    4. IMPROVE   - Add WHEN: triggers (cross-model optimized)     ║
║    5. TEST      - Run tests, fix if needed                       ║
║    6. REFERENCES- Validate markdown links                        ║
║    7. TOKENS    - Check token budget, gather suggestions         ║
║    8. SUMMARY   - Show before/after with suggestions             ║
║    9. PROMPT    - Ask: Commit, create a follow-up issue/task, or skip?            ║
║   10. REPEAT    - Until Medium-High score + tests pass           ║
║                                                                  ║
║  TARGET SCORE: Medium-High                                       ║
║    ✓ Description > 150 chars, ≤ 60 words                         ║
║    ✓ Has "WHEN:" trigger phrases (preferred)                     ║
║    ✓ No "DO NOT USE FOR:" (unless disambiguation-critical)         ║
║    ✓ SKILL.md < 500 tokens (soft limit)                          ║
║                                                                  ║
║  MORE INFO:                                                      ║
║    See README.md in this skill directory for full documentation    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

## When to Use

- Improving a skill's frontmatter compliance score
- Adding trigger phrases and anti-triggers to skill descriptions
- Batch-improving multiple skills at once
- Auditing and fixing Low-adherence skills

## Invocation Modes

### Single Skill
```
Run sensei on azure-deploy
```

### Multiple Skills
```
Run sensei on azure-security, azure-observability
```

### By Adherence Level
```
Run sensei on all Low-adherence skills
```

### All Skills
```
Run sensei on all skills
```

### GEPA Mode (Deep Optimization)
```
Run sensei on my-skill --gepa
Run sensei on my-skill --gepa --skip-integration
Run sensei on all skills --gepa
```

When `--gepa` is used, Step 5 (IMPROVE) is replaced with GEPA evolutionary optimization.
Instead of template-based improvements, GEPA parses trigger prompt arrays from the existing
test harness and combines them with content quality heuristics to build a fitness function.
An LLM proposes and evaluates many candidate improvements automatically. Note: GEPA does not
execute Jest tests directly — it uses the test data (prompts) as evaluation inputs.

**GEPA score-only mode** (no LLM calls, just evaluate current quality):
```
Run sensei score my-skill
Run sensei score all skills
```

## The Ralph Loop

For each skill, execute this loop until score >= Medium-High AND tests pass:

1. **READ** - Load the target skill `SKILL.md`, available tests or validation checks, and token count
2. **SCORE** - Run spec-based compliance check (see [SCORING.md](references/SCORING.md)):
   - Validate `name` for Jimu-compatible lowercase-hyphen naming
   - Check description clarity, trigger coverage, and word count
   - Check triggers (WHEN: preferred, USE FOR: accepted when useful)
   - Warn on "DO NOT USE FOR:" when it risks keyword contamination; keep it only for disambiguation-critical skills
   - Preserve optional fields supported by the target platform; translate host-specific tool allowlists into Jimu-compatible guidance instead of copying them literally
3. **CHECK** - If score >= Medium-High AND tests pass → go to TOKENS step
4. **SCAFFOLD** - If `tests/{skill-name}/` doesn't exist, create from `tests/_template/`
5. **IMPROVE FRONTMATTER** - Add WHEN: triggers (stay under 60 words and 1024 chars)
5b. **IMPROVE WITH GEPA** (when `--gepa` flag is set) — Replaces step 5 (IMPROVE FRONTMATTER) with automated optimization; step 6 (IMPROVE TESTS) still runs normally:
   - Auto-discovers `tests/{skill-name}/triggers.test.ts` and extracts prompt arrays
   - Builds a GEPA evaluator scoring content quality + trigger accuracy based on those trigger prompt arrays (not Jest test pass/fail results)
   - Runs the bundled GEPA evaluator only when its dependencies and target paths are available; in Jimu, pass the relevant skill directory and test directory explicitly
   - Shows diff of optimized SKILL.md for user approval
   - GEPA uses existing test trigger definitions as configuration — it does not execute, replace, or modify Jest tests
6. **IMPROVE TESTS** - Update `shouldTriggerPrompts` and `shouldNotTriggerPrompts` to match the finalized frontmatter (including any GEPA changes)
7. **VERIFY** - Run the target project's most specific available tests or validation command
8. **VALIDATE REFERENCES** - Run available reference-link validation, or manually verify every linked reference file exists
9. **TOKENS** - Check token budget and line count (< 500 lines per spec), gather optimization suggestions
10. **SUMMARY** - Display before/after comparison with unimplemented suggestions
11. **PROMPT** - Ask user: Commit, create a follow-up issue/task, or skip?
12. **REPEAT** - Go to step 2 (max 5 iterations per skill)

## Scoring Criteria (Quick Reference)

Sensei validates skills against the [agentskills.io specification](https://agentskills.io/specification). See [SCORING.md](references/SCORING.md) for full details.

| Score | Requirements |
|-------|--------------|
| **Invalid** | Name fails spec validation (consecutive hyphens, start/end hyphen, uppercase, etc.) |
| **Low** | Basic description, no explicit triggers |
| **Medium** | Has trigger keywords/phrases, description > 150 chars, >60 words |
| **Medium-High** | Has "WHEN:" (preferred) or "USE FOR:" triggers, ≤60 words |
| **High** | Medium-High + compatibility field |

**Target: Medium-High** (distinctive triggers, concise description)

> ⚠️ "DO NOT USE FOR:" is **risky in multi-skill environments** (15+ overlapping skills) — causes keyword contamination on fast-pattern-matching models. Safe for small, isolated skill sets. Use positive routing with `WHEN:` for cross-model safety.
>
> **Exception — disambiguation-critical skills:** When a skill's `USE FOR` triggers directly overlap with a broader skill (e.g., `azure-prepare` owns "deploy to Azure"), `DO NOT USE FOR:` is **REQUIRED** to prevent the broader skill from capturing prompts that belong to the specialized skill. Removing it causes routing regressions. Integration tests validate this routing -- run them before removing any `DO NOT USE FOR:` clause.

**Strongly recommended** (reported as suggestions if missing):
- `license` — identifies the license applied to the skill
- `metadata.version` — tracks the skill version for consumers

## Frontmatter Template

For Jimu resource repositories, use the local registry-compatible frontmatter shape:

```yaml
---
name: skill-name
description: |
  [ACTION VERB] [UNIQUE_DOMAIN]. Explain what the skill does and when to use it. Include distinctive trigger phrases when helpful.
author: Microsoft
license: MIT
category: workflow
tags: Microsoft, Skill优化, 元技能
source: https://github.com/example/source
---
```

> **IMPORTANT:** Jimu registry validation is the source of truth for published resources. Keep descriptions clear and concise, but do not copy upstream-only metadata syntax unless the target Jimu repository explicitly supports it.

> ⚠️ **"DO NOT USE FOR:" carries context-dependent risk.** In multi-skill environments (10+ skills with overlapping domains), anti-trigger clauses introduce the very keywords that cause wrong-skill activation on fast-pattern-matching models ([evidence](https://gist.github.com/kvenkatrajan/52e6e77f5560ca30640490b4cc65d109)). For small, isolated skill sets (1-5 skills), the risk is low. When in doubt, use positive routing with `WHEN:` and distinctive quoted phrases.
>
> **Exception:** `DO NOT USE FOR:` is **REQUIRED** when a specialized skill's triggers overlap with a broader skill (e.g., `azure-hosted-copilot-sdk` vs. `azure-prepare` on "deploy to Azure"). Without the negative discriminator, the broader skill captures prompts that should route to the specialized one. Always run integration tests before removing a `DO NOT USE FOR:` clause.

## Test Scaffolding

When tests don't exist, scaffold from `tests/_template/`:

```bash
cp -r tests/_template tests/{skill-name}
```

Then update:
1. `SKILL_NAME` constant in all test files
2. `shouldTriggerPrompts` - 5+ prompts matching new frontmatter triggers
3. `shouldNotTriggerPrompts` - 5+ prompts matching anti-triggers

**Suggested Commit Messages:**
```
sensei: improve {skill-name} frontmatter
```

## Constraints

- For Jimu resource work, modify only the requested `skills/<name>/` directory and directly related registry entries
- This imported `sensei` skill is itself a meta-skill; apply it to Jimu skill directories unless the user explicitly targets an upstream repository
- Max 5 iterations per skill before moving on
- Description must stay under 1024 characters
- SKILL.md should stay under 500 tokens (soft limit)
- Tests must pass before prompting for action
- User chooses: Commit, create a follow-up issue/task, or skip after each skill

## Flags

| Flag | Description |
|------|-------------|
| `--skip-integration` | Skip integration tests for faster iteration. Only runs unit and trigger tests. |
| `--gepa` | Use GEPA evolutionary optimization instead of template-based improvement. Auto-discovers tests and builds evaluator at runtime. |

> ⚠️ Skipping integration tests speeds up the loop but may miss runtime issues. Consider running full tests before final commit.

## Reference Documentation

- [SCORING.md](references/SCORING.md) - Detailed scoring criteria
- [LOOP.md](references/LOOP.md) - Ralph loop workflow details
- [EXAMPLES.md](references/EXAMPLES.md) - Before/after examples
- [TOKEN-INTEGRATION.md](references/TOKEN-INTEGRATION.md) - Token budget integration

## Related Skills

- [markdown-token-optimizer](../markdown-token-optimizer/SKILL.md) - Token analysis and optimization
- [skill-authoring](../skill-authoring/SKILL.md) - Skill writing guidelines
