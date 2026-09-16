---
name: self-builder
description: Use when a capability gap is detected or the agent needs to expand its own tool or skill surface. Triggers include self-build, improve myself, new skill, gap, limit, expand capability, self-improve, autonomously create tool.
---

# Self-Builder

## When to use
Whenever the current tool/skill inventory is insufficient for the task, or when the agent is idle and can productively expand itself.

## Instructions
1. Read `builderbro/self-building-protocol.md` in full before acting.
2. Execute one complete pipeline cycle:
   DETECT → RESEARCH (use builderbro-rag) → DESIGN → IMPLEMENT → TEST → REGISTER.
3. Prefer creating a new skill under `builderbro/skills/<kebab-name>/SKILL.md` following the exact frontmatter format.
4. After writing the skill, demonstrate it immediately on a residual task in the same session.
5. Append a structured entry to `builderbro/self-improvement-log.jsonl` and update the CAPABILITY_INVENTORY section of the protocol file.
6. Respect HexAgent law on every step: never coerce, expand meaning, archive everything.
7. Enforce a per-session budget (max 1–3 major skills) to avoid infinite loops.

## Success Criteria
- New skill is discoverable and correctly formatted.
- At least one concrete test or demonstration has passed.
- Inventory and log are updated.
- No destructive side-effects without explicit authorization.
