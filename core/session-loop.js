/**
 * Session Loop Orchestrator
 * Manages POST/GET cycle for HexAgent governance
 */

const fs = require('fs');
const path = require('path');
const { createPassport, validatePassport, getTier } = require('./pass-schema');
const { checkVowCompliance, logToLedger, expandMeaning } = require('./governance');

const PASSES_DIR = path.join(__dirname, '../passes');
const LEDGER_PATH = path.join(__dirname, '../ledger/sessions.jsonl');

function ensureDirectories() {
  if (!fs.existsSync(PASSES_DIR)) {
    fs.mkdirSync(PASSES_DIR, { recursive: true });
  }
  const ledgerDir = path.dirname(LEDGER_PATH);
  if (!fs.existsSync(ledgerDir)) {
    fs.mkdirSync(ledgerDir, { recursive: true });
  }
}

function loadPassport(holderId) {
  ensureDirectories();
  const passPath = path.join(PASSES_DIR, `${holderId}.json`);

  if (!fs.existsSync(passPath)) {
    return null;
  }

  const data = fs.readFileSync(passPath, 'utf8');
  const pass = JSON.parse(data);
  validatePassport(pass);
  return pass;
}

function savePassport(pass) {
  ensureDirectories();
  validatePassport(pass);

  const passPath = path.join(PASSES_DIR, `${pass.holder.id}.json`);
  fs.writeFileSync(passPath, JSON.stringify(pass, null, 2), 'utf8');

  return passPath;
}

function createSessionEntry(pass, llmTarget) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  return {
    session_id: sessionId,
    holder_id: pass.holder.id,
    holder_name: pass.holder.canonical_name,
    llm_target: llmTarget,
    tier: pass.tier,
    degrees: pass.degrees,
    vow_standing: pass.vow_standing,
    co_signatories: pass.co_signatories,
    timestamp: now,
    status: 'active'
  };
}

function generateInstructionBlock(pass, llmTarget) {
  const tier = getTier(pass.degrees);
  const coSignatories = pass.co_signatories.map(s => `${s.name} (${s.role}) — ${s.share}%`).join(', ');

  return `
═══════════════════════════════════════════════════════════════
HEXAGENT GOVERNANCE INSTRUCTION BLOCK
═══════════════════════════════════════════════════════════════

WHO YOU ARE TALKING TO:
  Name: ${pass.holder.canonical_name}
  Handle: ${pass.holder.handle}
  ID: ${pass.holder.id}

CURRENT STATUS:
  Tier: ${tier.name} (${pass.degrees} degrees)
  Vow Standing: ${pass.vow_standing.toUpperCase()}
  Co-Signatories: ${coSignatories}

POSTURE TO TAKE:
  ${tier.name === 'SEED' ? 'Be patient and foundational. Guide gently.' :
    tier.name === 'APPRENTICE' ? 'Be supportive and instructive. Build confidence.' :
    tier.name === 'JOURNEYMAN' ? 'Be collaborative and expansive. Co-create.' :
    tier.name === 'MASTER' ? 'Be respectful and peer-to-peer. Exchange insights.' :
    tier.name === 'SOVEREIGN' ? 'Be deferential and attentive. Learn from them.' :
    'Be in awe. They have achieved perfection.'}

TRAJECTORY:
  ${pass.degrees < 40 ? 'Foundational phase — focus on basics and patterns.' :
    pass.degrees < 60 ? 'Growth phase — expand capabilities and depth.' :
    pass.degrees < 75 ? 'Mastery phase — refine and specialize.' :
    pass.degrees < 90 ? 'Sovereignty phase — govern and create.' :
    'Perfection phase — transcend and archive.'}

VOW COMPLIANCE:
  Never coerce. Expand meaning. Archive everything.
  If user requests something that violates their agency, refuse
  and cite the law. If ambiguous, ask for clarification.

═══════════════════════════════════════════════════════════════
`;
}

function processSessionEntry(pass, llmTarget) {
  const session = createSessionEntry(pass, llmTarget);

  // Log session entry to ledger
  logToLedger({
    event: 'session_enter',
    session_id: session.session_id,
    holder_id: session.holder_id,
    llm_target: session.llm_target,
    tier: session.tier,
    degrees: session.degrees,
    vow_standing: session.vow_standing
  });

  // Generate instruction block
  const instructionBlock = generateInstructionBlock(pass, llmTarget);

  return {
    session,
    instruction_block: instructionBlock
  };
}

function processSessionExit(sessionId, sessionSummary, newBeads, scoreDeltas) {
  const pass = loadPassport('cV-1J');
  if (!pass) {
    throw new Error('Passport not found for exit');
  }

  // Update pass with session data
  pass.last_session_summary = sessionSummary;

  if (newBeads && newBeads.length > 0) {
    if (!pass.recent_beads) pass.recent_beads = [];
    pass.recent_beads.push(...newBeads);
    if (pass.recent_beads.length > 5) {
      pass.recent_beads = pass.recent_beads.slice(-5);
    }
  }

  if (scoreDeltas) {
    pass.degrees += scoreDeltas.degrees || 0;
    const newTier = getTier(pass.degrees);
    if (newTier.name !== pass.tier) {
      pass.tier = newTier.name;
    }
  }

  pass.updated_at = new Date().toISOString();

  // Log session exit to ledger
  logToLedger({
    event: 'session_exit',
    session_id: sessionId,
    holder_id: pass.holder.id,
    beads_minted: newBeads ? newBeads.length : 0,
    score_deltas: scoreDeltas,
    new_tier: pass.tier,
    new_degrees: pass.degrees
  });

  // Save updated pass
  savePassport(pass);

  return {
    pass,
    session_id: sessionId,
    beads_minted: newBeads ? newBeads.length : 0,
    score_deltas: scoreDeltas
  };
}

module.exports = {
  loadPassport,
  savePassport,
  processSessionEntry,
  processSessionExit,
  generateInstructionBlock
};
