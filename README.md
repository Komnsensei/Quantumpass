# builderBRO v3.5

An AI coding partner CLI with real hands — a headless Chromium it drives
directly, a modular runtime engine, and a persistent persona/continuity layer.

See [AGENTIC.md](AGENTIC.md) for what "agentic" means here: stateful
perception, autonomous action, goal-driven planning, and error recovery.

## Requirements

- Node.js 18+ (developed and tested on v22)
- npm

## Quick start

```bash
npm install             # @codebuff/sdk, groq-sdk, playwright
npm start               # interactive CLI (loader.mjs)
npm run start:legacy    # the original monolithic CLI (cli.mjs)
npm run smoke           # runtime engine smoke test
npm test                # node:test suites (12 tests)
```

Pipe a prompt in without the interactive shell:

```bash
echo "read this file" | node loader.mjs "Summarise it in one sentence."
```

## Configuration

Keys are read from the environment, falling back to a `.env` file. Real
environment variables always win; `.env` candidates are merged in this order:

1. `$PWD/.env`
2. this package's own `.env`
3. `~/.bro/.env`

```ini
GROQ_KEY=<your-groq-api-key>   # console.groq.com/keys
```

| Variable | Purpose |
|---|---|
| `GROQ_KEY` (or `GROQ_API_KEY`) | Groq brain — needed for the interactive CLI |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL` | OpenAI-compatible fallback |
| `BASE44_APP_ID`, `BASE44_CONV_ID`, `BASE44_TOKEN` | Base44 app backend |
| `GCP_MODEL`, `GCP_PROJECT_ID` | Vertex model selection (pipe mode) |
| `FREEBUFF_MODEL` | Overrides the interactive model (default `openai/gpt-oss-120b`) |

## The brain

Two entry points, two different chains:

| Entry point | Fallback order |
|---|---|
| `loader.mjs` (pipe mode) | Vertex → Base44 → Groq → OpenAI |
| `cli.mjs` (interactive) | `runtime/freebuff-provider.mjs` — Groq |

`runtime/freebuff-provider.mjs` keeps its historical name but talks to Groq's
OpenAI-compatible endpoint. The API key is read from the environment at call
time (`GROQ_KEY`, falling back to `GROQ_API_KEY`) — never hardcoded.

## Layout

| Path | What it is |
|---|---|
| `cli.mjs`, `loader.mjs`, `bro-web.mjs`, `bromance.mjs`, `bro-build.mjs`, `bro-continuity.mjs`, `model-selector.mjs`, `agent-upgrade.mjs` | Core CLI and agent modules |
| `runtime/` | Modular engine: agent runtime, command router/catalog, personas, policy, autonomy controls, NewState adapter/service/setup, RAG, task supervisor, visual shell, smoke test |
| `Leland_Kernel_Daemon.mjs` | Kernel daemon with the session bridge |
| `Leland_Skills/`, `Laland_Core/`, `Leland_Core/` | Agent core manifests and skills |
| `config/newstate.json` | NewState sidecar configuration |
| `passionstate-nexus/`, `src/` | PassionState / Nexus sources |
| `tests/` | `node:test` suites |
| `extras/quarantine/` | Parked experiments — intentionally untracked |

## Git

| Remote | Repository |
|---|---|
| `origin` | github.com/Komnsensei/Quantumpass |
| `esma` | github.com/Komnsensei/ESMA |

Current branch: `bro-brain-backup`.

`extras/quarantine/` and `rockyou.txt` are deliberately not tracked.
