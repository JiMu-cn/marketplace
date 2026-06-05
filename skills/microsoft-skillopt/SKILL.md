---
name: microsoft-skillopt
description: |
  Microsoft SkillOpt wrapper for data-driven self-evolving agent skill optimization. Use when the user wants to train, benchmark, evaluate, or systematically improve natural-language skills with validation-gated iterations, best_skill.md artifacts, and trajectory-driven edits using the upstream Microsoft SkillOpt project.
author: Microsoft
license: MIT
category: workflow
tags: Microsoft, SkillOpt, Skill优化, 自进化, 评测, 元技能
source: https://github.com/microsoft/SkillOpt
---
## Jimu Platform Adaptation

This skill wraps the upstream Microsoft SkillOpt repository for Jimu users. SkillOpt is not a built-in Jimu tool and should not be invoked as a magic command. Treat it as an optional Python project bundled under [upstream/SkillOpt](upstream/SkillOpt/README.md).

- Use Jimu file, shell, todo, skill, and sub-agent tools to inspect skills, prepare datasets, run commands, and review results.
- Do not invent or log API keys. SkillOpt requires explicit model credentials such as Azure OpenAI, OpenAI, Anthropic, or local vLLM configuration; use only credentials the user has configured for the environment.
- Prefer lightweight Jimu-native review first for simple edits. Use SkillOpt when the user needs repeatable train/validation/test splits, validation gates, or empirical optimization loops.
- Keep generated outputs outside source-controlled skill directories unless the user asks to package a specific artifact. Review `best_skill.md` before replacing any production `SKILL.md`.
- For Jimu resource-market work, adapt any optimized output back to Jimu frontmatter, registry, i18n/platform wording, and validation rules before committing.

# Microsoft SkillOpt

SkillOpt trains reusable natural-language skills for frozen LLM agents through trajectory-driven edits, validation-gated updates, and deployable `best_skill.md` artifacts. It treats prompt/skill text as a trainable artifact while leaving model weights unchanged.

## When to Use

- The user wants to optimize an existing Skill with a measurable benchmark instead of manual prompt editing.
- A Skill has weak activation, inconsistent quality, regressions, or unclear evaluation gates.
- The task requires train/validation/test splits and reproducible skill evolution history.
- The user wants to compare candidate `SKILL.md` versions and keep the best validated artifact.

## When Not to Use

- The task only needs a small wording fix, platform-binding cleanup, or frontmatter normalization.
- No benchmark data, expected outputs, or validation criteria exist yet.
- Required model credentials or Python dependencies are unavailable and the user has not approved setup.

## Core Workflow

1. Inspect the target Skill and define what behavior must improve.
2. Prepare a dataset split with `train/`, `val/`, and `test/` items following the selected benchmark format.
3. Choose the benchmark config and model backend.
4. Run SkillOpt training or eval-only mode from the bundled upstream project.
5. Review `outputs/<run_name>/best_skill.md`, run Jimu/platform validation, and compare against the original Skill.
6. Apply only the validated improvements needed for the target Jimu Skill.
7. Rebuild and validate the resource registry before release.

## Bundled Upstream References

- [Upstream README](upstream/SkillOpt/README.md)
- [Installation](upstream/SkillOpt/docs/guide/installation.md)
- [First Experiment](upstream/SkillOpt/docs/guide/first-experiment.md)
- [Configuration Guide](upstream/SkillOpt/docs/guide/configuration.md)
- [Training Loop](upstream/SkillOpt/docs/guide/training-loop.md)
- [Skill Document Guide](upstream/SkillOpt/docs/guide/skill-document.md)
- [CLI Reference](upstream/SkillOpt/docs/reference/cli.md)
- [Config Reference](upstream/SkillOpt/docs/reference/config.md)
- [Rewrite Skill Prompt](upstream/SkillOpt/skillopt/prompts/rewrite_skill.md)
- [Meta Skill Prompt](upstream/SkillOpt/skillopt/prompts/meta_skill.md)

## Minimal Command Shape

Run commands from `upstream/SkillOpt` after confirming Python 3.10+, dependencies, dataset paths, and model credentials:

```bash
pip install -e .
python scripts/train.py \
  --config configs/searchqa/default.yaml \
  --split_dir /path/to/your/split \
  --azure_openai_endpoint https://your-resource.openai.azure.com/ \
  --optimizer_model <optimizer-model> \
  --target_model <target-model> \
  --out_root outputs/<run-name>
```

For evaluation without training:

```bash
python scripts/eval_only.py \
  --config configs/searchqa/default.yaml \
  --skill outputs/<run-name>/best_skill.md \
  --split all \
  --split_dir /path/to/your/split \
  --azure_openai_endpoint https://your-resource.openai.azure.com/
```

## Jimu Release Checklist

- Confirm the optimized Skill still has valid Jimu frontmatter.
- Confirm references and scripts needed by the Skill are preserved.
- Remove or adapt upstream host-specific tool names before publishing.
- Run the relevant tests or benchmark comparison.
- In the Jimu resource repository, run `npm run build && npm run validate` before committing.
