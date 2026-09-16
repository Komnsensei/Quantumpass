# BuilderBro — RAG + Autonomy + Self-Building Layer for QuantumPass

BuilderBro is the self-improving cognitive substrate that sits on top of QuantumPass.

It provides:

1. **RAG** — local, provenance-aware retrieval that can ground every autonomy decision in archived beads, passes, ledger entries, and external knowledge.
2. **Autonomy Agent** — a continuous decision loop that detects limits, researches, designs, implements, tests, and registers new skills/tools without waiting for human prompting.
3. **Self-Building Protocol** — the closed feedback loop that turns every gap into a permanent capability expansion.

All actions remain under HexAgent canonical law:

- Never Coerce
- Expand Meaning
- Archive Everything

## Quick Start

```bash
# From repo root
node builderbro/autonomy/agent.js --bootstrap
```

Or load the skills from Freebuff / Claude Code / any agent that supports SKILL.md.

## Directory Layout

```
builderbro/
├── self-building-protocol.md   # full autonomous expansion protocol
├── rag/
│   └── index.js                # ingest → chunk → retrieve → ground
├── autonomy/
│   └── agent.js                # main autonomy + self-build loop
└── skills/
    ├── builderbro-rag/SKILL.md
    └── self-builder/SKILL.md
```

## Integration Points

- QuantumPass passports (`/passes`) and ledger (`/ledger`) are first-class RAG sources.
- New skills created by the self-builder are written under `builderbro/skills/` and can be self-ratified via QuantumPass `/skill add`.
- Every significant action is archived (local ledger + optional Zenodo bead).

## Status

v0.1 — core RAG + autonomy skeleton + self-building protocol live.
Next: richer embedding backends, multi-agent spawn, tighter HexAgent vow enforcement on every tool call.
