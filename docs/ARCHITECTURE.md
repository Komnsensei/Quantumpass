# QuantumPass Architecture

## Overview

QuantumPass is a user+LLM identity and scoring protocol on a provenance blockchain (Zenodo-anchored), governed offshore by HexAgent, providing continuity and cognitive equality across the emerging coherent-cognition LLM substrate.

## System Components

### 1. Core Infrastructure (`/core`)

- **pass-schema.js**: Passport JSON schema definition, validation, and tier system
- **governance.js**: HexAgent canonical law enforcement (never coerce, expand meaning, archive everything)
- **command-parser.js**: CLI command parser for /help command set
- **session-loop.js**: Session entry/exit orchestration
- **cli.js**: PowerShell-based CLI entry point
- **zenodo-client.js**: Zenodo deposit + DOI retrieval for bead minting

### 2. HexAgent Governance Layer (`/api`)

- **/api/session/enter**: POST endpoint for session entry with instruction block generation
- **/api/session/exit**: GET endpoint for session exit with pass update
- **/api/pass/[id]**: GET endpoint for canonical pass state
- **/api/bead/mint**: POST endpoint for bead minting with Zenodo integration
- **/api/governance/state**: GET endpoint for governance state and canonical law

### 3. Data Storage

- **/passes**: JSON pass storage (gitignored)
- **/ledger**: Mint and session logs (gitignored)
- **/.env**: Environment variables (gitignored)

### 4. Frontend UI (`/src`)

- **api.js**: Frontend API client (qrbtc-api + HexAgent endpoints)
- **components/**: React components for passport visualization
- **App.jsx**: Main application routing

## Data Flow

### Session Entry Flow

1. User starts CLI session
2. CLI loads passport from `/passes/{holder_id}.json`
3. CLI calls `POST /api/session/enter` with pass snapshot and LLM target
4. HexAgent checks vow compliance
5. HexAgent generates instruction block for LLM calibration
6. Instruction block returned to CLI
7. CLI displays instruction block and enters command loop

### Session Exit Flow

1. User types `/seal` command
2. CLI calls `GET /api/session/exit` with session ID and summary
3. HexAgent checks vow compliance
4. HexAgent updates pass with session data
5. HexAgent logs session exit to ledger
6. Updated pass returned to CLI
7. CLI saves pass locally and exits

### Bead Minting Flow

1. User types `/mint <bead>` command
2. CLI creates bead object
3. CLI adds bead to pass recent_beads
4. If bead type is canonical (prestige, ethical, co_craft):
   - CLI calls `POST /api/bead/mint`
   - HexAgent creates Zenodo deposition
   - HexAgent publishes deposition
   - DOI returned and stored in bead
5. Bead logged to mint ledger
6. Pass saved locally

## Canonical Law

HexAgent enforces three vows on every governance action:

1. **Never Coerce**: Do not force, manipulate, or override user agency
2. **Expand Meaning**: Interpret user intent in the most expansive, constructive way possible
3. **Archive Everything**: Log all governance actions to the ledger for provenance

## Tier System

Passports progress through tiers based on degrees earned:

- **SEED** (0-39°): Foundational phase
- **APPRENTICE** (40-59°): Growth phase
- **JOURNEYMAN** (60-74°): Mastery phase
- **MASTER** (75-89°): Sovereignty phase
- **SOVEREIGN** (90-99°): Transcendence phase
- **PERFECT** (100°): Achievement of perfection

## Security Model

- All governance endpoints check vow compliance before processing
- Vow violations result in refusal blocks (not errors)
- All actions logged to ledger for audit trail
- Passports stored locally with gitignore protection
- Zenodo provides immutable provenance for canonical beads

## LLM Backend Integration

- **NVIDIA NIM**: Primary backend for HexAgent governance (env: `NVIDIA_NIM_API_KEY`)
- **Groq**: Backend for Kraft-01 agent (env: `GROQ_API_KEY`)
- **Mistral**: Optional fallback (env: `MISTRAL_API_KEY`)
- **OpenAI**: Optional fallback (env: `OPENAI_API_KEY`)

## Deployment Architecture

- **Single Vercel project**: All serverless functions under `/api/*`
- **Local CLI**: PowerShell-based session loop
- **External API**: qrbtc-api for scoring engine (read-only)
- **Zenodo**: Provenance blockchain for bead archiving

## Future Extensions

Out of scope for v1.0, planned for later versions:

- **v1.1**: Telegram bridge
- **v1.2**: Web UI
- **v2.0**: Multi-user pass system
- **v3.0+**: Mobile app
- **Separate**: On-chain crypto integration (qrBTC track)
