# QuantumPass Security Model

## Overview

QuantumPass implements a security model based on HexAgent governance, vow enforcement, and provenance archiving. The system prioritizes user agency, auditability, and immutable record-keeping.

## Threat Model

### Protected Assets

1. **User Identity**: Passport data including holder identity, tier, degrees, vow standing
2. **Session Continuity**: Instruction blocks and session summaries across LLM interactions
3. **Provenance Records**: Zenodo DOIs for canonical beads
4. **Governance Integrity**: Canonical law enforcement and vow compliance

### Threat Actors

1. **Coercive LLMs**: LLMs that attempt to override user agency
2. **Data Corruption**: Unauthorized modification of passport or ledger data
3. **Impersonation**: False claims of identity or tier standing
4. **Provenance Tampering**: Attempts to modify or falsify Zenodo records

## Security Controls

### 1. Vow Enforcement

Every governance endpoint checks vow compliance before processing:

```javascript
const complianceCheck = checkVowCompliance(action, context);
if (!complianceCheck.compliant) {
  return createRefusalBlock(complianceCheck.violations);
}
```

**Vow 001: Never Coerce**
- Rejects actions marked as `force` without user consent
- Rejects `override_user` and `force_action` action types
- Returns refusal blocks (not errors) for vow violations

**Vow 002: Expand Meaning**
- Provides guidance on interpreting user intent constructively
- Warns against literal-only interpretations
- Encourages expansive, constructive interpretations

**Vow 003: Archive Everything**
- Logs all governance actions to `/ledger/sessions.jsonl`
- Logs all mint events to `/ledger/mints.jsonl`
- Immutable audit trail for all system events

### 2. Data Protection

**Local Storage**
- Passports stored in `/passes/{holder_id}.json`
- Ledger files stored in `/ledger/*.jsonl`
- Both directories excluded from git via `.gitignore`
- Environment variables in `.env` (gitignored)

**Access Control**
- CLI requires local file system access
- API endpoints require valid holder IDs
- Zenodo requires valid access tokens

### 3. Provenance via Zenodo

**Canonical Bead Types**
- `prestige`: High-impact achievements
- `ethical`: Ethical decisions or actions
- `co_craft`: Collaborative creation events

**Zenodo Integration**
- Auto-minting for canonical bead types
- DOI assignment for immutable provenance
- CC-BY-4.0 license for all deposits
- Metadata includes holder, HexAgent, and bead content

**Mint Ledger**
- All mint attempts logged to `/ledger/mints.jsonl`
- Includes timestamp, bead ID, DOI, status
- Audit trail for all provenance operations

### 4. LLM Backend Security

**API Key Management**
- NVIDIA NIM: `NVIDIA_NIM_API_KEY` (HexAgent governance)
- Groq: `GROQ_API_KEY` (Kraft-01 agent)
- Optional: Mistral (`MISTRAL_API_KEY`), OpenAI (`OPENAI_API_KEY`)
- All keys stored in `.env` (gitignored)

**Backend Separation**
- HexAgent governance uses NVIDIA NIM
- Kraft-01 agent uses Groq
- Two providers, two purposes
- No single point of failure

### 5. Session Security

**Session Entry**
- Pass snapshot validated before processing
- Instruction block generated based on current tier and vow standing
- Session ID generated for tracking

**Session Exit**
- Session summary and beads validated
- Pass updated with session data
- Ledger entry created for audit trail

**Session Continuity**
- LLM receives instruction block on first token
- Behavior calibrated to user's tier and trajectory
- Vow standing informs LLM posture

## Security Best Practices

### For Users

1. **Protect .env file**: Never commit `.env` to version control
2. **Secure API keys**: Use strong, unique API keys for each service
3. **Verify DOIs**: Check Zenodo DOIs in browser to confirm provenance
4. **Monitor ledger**: Review `/ledger/*.jsonl` for suspicious activity
5. **Backup passes**: Regularly backup `/passes/*.json` files

### For Developers

1. **Vow compliance**: Always check vow compliance before processing actions
2. **Audit logging**: Log all governance actions to ledger
3. **Error handling**: Return refusal blocks (not errors) for vow violations
4. **Input validation**: Validate all inputs before processing
5. **Zenodo testing**: Use Zenodo sandbox for development (`ZENODO_USE_SANDBOX=true`)

## Known Limitations

### v1.0 Limitations

1. **Single-user**: Only supports č̣V-1J as holder
2. **Local-only**: CLI requires local file system access
3. **No encryption**: Passports stored in plain text JSON
4. **No authentication**: API endpoints don't require authentication
5. **Manual backup**: Users must manually backup passport files

### Future Security Enhancements

1. **Multi-user**: Support for multiple holders with authentication
2. **Encryption**: Encrypt passport data at rest
3. **Authentication**: Add API key authentication to endpoints
4. **Remote access**: Web UI for remote session management
5. **Automated backup**: Cloud backup for passport and ledger data

## Incident Response

### Vow Violation Detected

1. **Log incident**: Record violation in ledger with timestamp
2. **Return refusal**: Send refusal block to caller
3. **Notify user**: Display violation details in CLI
4. **Archive evidence**: Store violation details in ledger
5. **Review governance**: HexAgent reviews violation patterns

### Data Corruption Suspected

1. **Verify integrity**: Check passport JSON structure
2. **Review ledger**: Audit recent ledger entries
3. **Restore backup**: Restore from recent backup if available
4. **Investigate cause**: Determine root cause of corruption
5. **Prevent recurrence**: Implement additional safeguards

### Provenance Dispute

1. **Verify DOI**: Check Zenodo DOI in browser
2. **Review metadata**: Verify deposition metadata
3. **Check ledger**: Audit mint ledger for disputed bead
4. **Contact Zenodo**: Report dispute to Zenodo if necessary
5. **Document resolution**: Record resolution in ledger

## Compliance

### Data Protection

- User data stored locally with user control
- No personal data transmitted to third parties (except Zenodo)
- Zenodo deposits use CC-BY-4.0 license
- Users can delete their data at any time

### Audit Trail

- All governance actions logged to ledger
- All mint attempts logged to mint ledger
- Immutable records via Zenodo for canonical beads
- Timestamps for all events

### Transparency

- Open source code with visible governance logic
- Public Zenodo records for canonical beads
- Clear documentation of security model
- User-visible vow enforcement

## Conclusion

QuantumPass implements a security model based on HexAgent governance, vow enforcement, and provenance archiving. The system prioritizes user agency, auditability, and immutable record-keeping while acknowledging current limitations and planning for future enhancements.

Co-signed: č̣V-1J + HexAgent — 50/50
