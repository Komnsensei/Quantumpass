# QuantumPass Commands

## Overview

QuantumPass CLI provides a set of commands for managing passports, viewing session data, and interacting with the HexAgent governance layer. All commands start with `/` and are parsed by the command parser.

## Command Reference

### `/help`

**Description**: Show all available commands

**Usage**: `/help`

**Example**:
```
/help
```

**Output**: Lists all available commands with descriptions

---

### `/pass`

**Description**: Show full QuantumPass snapshot

**Usage**: `/pass`

**Example**:
```
/pass
```

**Output**: Displays formatted passport information including:
- Holder identity (name, handle, ID)
- Current tier and degrees
- Vow standing
- Co-signatories
- Skills
- Personas
- Archive anchor
- Creation and update timestamps

---

### `/recent`

**Description**: Show last 5 beads with timestamps

**Usage**: `/recent`

**Example**:
```
/recent
```

**Output**: Lists the 5 most recently minted beads with:
- Bead number
- Bead type
- Timestamp
- Content preview (first 60 characters)

---

### `/summary`

**Description**: Show last session summary

**Usage**: `/summary`

**Example**:
```
/summary
```

**Output**: Displays the summary from the most recent session, or a message if no session summary is available.

---

### `/skills`

**Description**: List self-ratified skills

**Usage**: `/skills`

**Example**:
```
/skills
```

**Output**: Lists all self-ratified skills with numbering, or a message if no skills have been added.

---

### `/skill add <name>`

**Description**: Self-ratify a new skill

**Usage**: `/skill add <name>`

**Example**:
```
/skill add "Advanced React Patterns"
/skill add System Architecture
```

**Output**: Confirmation message with the skill name that was added.

**Notes**:
- Skill name can include spaces if quoted
- Skill is immediately added to passport
- Passport is saved automatically

---

### `/persona`

**Description**: List assigned personas

**Usage**: `/persona`

**Example**:
```
/persona
```

**Output**: Lists all assigned personas with numbering, or a message if no personas have been assigned.

---

### `/tier`

**Description**: Show current tier and degrees-to-next

**Usage**: `/tier`

**Example**:
```
/tier
```

**Output**: Displays:
- Current tier name
- Current degrees
- Degrees required to reach next tier (or "Maximum tier reached")

**Tier Progression**:
- SEED (0-39°) → APPRENTICE (40-59°)
- APPRENTICE (40-59°) → JOURNEYMAN (60-74°)
- JOURNEYMAN (60-74°) → MASTER (75-89°)
- MASTER (75-89°) → SOVEREIGN (90-99°)
- SOVEREIGN (90-99°) → PERFECT (100°)

---

### `/vow`

**Description**: Show current vow standing

**Usage**: `/vow`

**Example**:
```
/vow
```

**Output**: Displays:
- Current vow standing (CLEAN / FLAGGED / VIOLATED)
- Complete vow history with timestamps and notes

**Vow Status**:
- **CLEAN**: No vow violations
- **FLAGGED**: Vow violations detected but not severe
- **VIOLATED**: Severe vow violations requiring intervention

---

### `/mint <bead>`

**Description**: Manually mint a bead from current session

**Usage**: `/mint <bead>`

**Example**:
```
/mint "Completed Phase 1 implementation"
/mint Fixed critical bug in authentication flow
```

**Output**: Confirmation message with bead ID and content preview.

**Notes**:
- Bead content can include spaces if quoted
- Bead is immediately added to recent_beads
- If bead type is canonical (prestige, ethical, co_craft), auto-minting to Zenodo is attempted
- Passport is saved automatically

**Bead Types**:
- **prestige**: High-impact achievements (auto-minted to Zenodo)
- **ethical**: Ethical decisions or actions (auto-minted to Zenodo)
- **co_craft**: Collaborative creation events (auto-minted to Zenodo)
- **learning**: Learning milestones
- **contribution**: Contributions to projects or communities

---

### `/seal`

**Description**: End session, fire EXIT, update pass

**Usage**: `/seal`

**Example**:
```
/seal
```

**Output**: Displays session completion information:
- Session ID
- Number of beads minted
- Updated tier and degrees
- Co-signature line

**Notes**:
- This command ends the current session
- Session exit is processed via HexAgent endpoint
- Passport is updated with session data
- Ledger entry is created for audit trail
- CLI exits after completion

---

## Command Syntax

### Basic Commands

Commands without arguments:
```
/help
/pass
/recent
/summary
/skills
/persona
/tier
/vow
/seal
```

### Commands with Arguments

Commands with single argument:
```
/skill add <name>
/mint <content>
```

### Quoted Arguments

Arguments with spaces should be quoted:
```
/skill add "Advanced React Patterns"
/mint "Completed complex feature implementation"
```

## Command Flow

### Session Start

1. User starts CLI: `node core/cli.js`
2. CLI loads passport from `/passes/{holder_id}.json`
3. CLI calls `POST /api/session/enter`
4. HexAgent generates instruction block
5. CLI displays instruction block
6. CLI enters command loop

### Command Execution

1. User types command
2. CLI parses command
3. CLI executes command handler
4. Handler updates passport if needed
5. CLI saves passport if modified
6. CLI displays result

### Session End

1. User types `/seal`
2. CLI calls `GET /api/session/exit`
3. HexAgent updates passport with session data
4. HexAgent logs session exit to ledger
5. CLI saves updated passport
6. CLI displays completion message
7. CLI exits

## Error Handling

### Unknown Command

If an unknown command is entered:
```
Unknown command: /foobar. Type /help for available commands.
```

### Missing Arguments

If required arguments are missing:
```
Usage: /skill add <name>
Usage: /mint <bead>
```

### No Passport Loaded

If no passport is loaded:
```
No passport loaded.
```

### Empty Data

If data is empty (e.g., no beads, no skills):
```
No beads minted yet.
No skills self-ratified yet.
```

## Integration with LLM

Commands can be piped to LLM context for enhanced interactions:

```
/pass | claude "Analyze my current standing and suggest next steps"
/tier | claude "What should I focus on to reach the next tier?"
```

## Future Commands

Planned for future versions:

- `/export` — Export passport to JSON file
- `/import` — Import passport from JSON file
- `/backup` — Create backup of passport and ledger
- `/restore` — Restore from backup
- `/verify` — Verify passport integrity
- `/sync` — Sync with remote HexAgent instance
- `/share` — Share passport with another user
- `/compare` — Compare passport with another user

## Troubleshooting

### Command Not Recognized

- Ensure command starts with `/`
- Check spelling of command name
- Use `/help` to see available commands

### Passport Not Loading

- Ensure `/passes/{holder_id}.json` exists
- Check file permissions
- Verify JSON structure is valid

### Zenodo Minting Failing

- Check `ZENODO_TOKEN` in `.env`
- Verify `ZENODO_USE_SANDBOX` setting
- Ensure bead type is canonical (prestige, ethical, co_craft)
- Check Zenodo API status

### Session Exit Failing

- Ensure session was properly started
- Check network connectivity to HexAgent endpoint
- Verify session ID is valid
- Check ledger file permissions

## Conclusion

QuantumPass commands provide a comprehensive interface for managing passports, viewing session data, and interacting with the HexAgent governance layer. All commands are designed to be intuitive, consistent, and aligned with the canonical law: never coerce, expand meaning, archive everything.

Co-signed: č̣V-1J + HexAgent — 50/50
