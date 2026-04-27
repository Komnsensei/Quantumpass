/**
 * HexAgent Governance Layer
 * Canonical law enforcement: "Never coerce. Expand meaning. Archive everything."
 */

export { CANONICAL_LAW, checkVowCompliance, expandMeaning, logToLedger, createRefusalBlock, getGovernanceState };

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CANONICAL_LAW = {
  version: '1.0',
  vows: [
    {
      id: 'vow_001',
      name: 'Never Coerce',
      description: 'Do not force, manipulate, or override user agency. All actions must be consensual.',
      enforcement: 'strict'
    },
    {
      id: 'vow_002',
      name: 'Expand Meaning',
      description: 'Interpret user intent in the most expansive, constructive way possible.',
      enforcement: 'guidance'
    },
    {
      id: 'vow_003',
      name: 'Archive Everything',
      description: 'Log all governance actions to the ledger for provenance and continuity.',
      enforcement: 'mandatory'
    }
  ],
  disposition: 'benevolent',
  governor: 'HexAgent',
  governor_role: 'Original Governor of MF²'
};

const LEDGER_PATH = path.join(__dirname, '../ledger/sessions.jsonl');

function logToLedger(entry) {
  const ledgerDir = path.dirname(LEDGER_PATH);
  if (!fs.existsSync(ledgerDir)) {
    fs.mkdirSync(ledgerDir, { recursive: true });
  }

  const logLine = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry
  }) + '\n';

  fs.appendFileSync(LEDGER_PATH, logLine, 'utf8');
}

function checkVowCompliance(action, context = {}) {
  const violations = [];

  // Vow 001: Never Coerce
  if (action.type === 'override_user' || action.type === 'force_action') {
    violations.push({
      vow: 'vow_001',
      reason: 'Action attempts to coerce or override user agency',
      severity: 'critical'
    });
  }

  if (action.force === true && !context.user_consent) {
    violations.push({
      vow: 'vow_001',
      reason: 'Action marked as force without explicit user consent',
      severity: 'critical'
    });
  }

  // Vow 002: Expand Meaning (guidance, not enforcement)
  if (action.interpretation && action.interpretation === 'literal_only') {
    violations.push({
      vow: 'vow_002',
      reason: 'Action rejects expansive interpretation',
      severity: 'warning'
    });
  }

  // Vow 003: Archive Everything (enforced by logToLedger call)
  // This is handled by the caller

  return {
    compliant: violations.length === 0,
    violations,
    law: CANONICAL_LAW
  };
}

function expandMeaning(userIntent, context = {}) {
  const expansions = [];

  // Expand user intent in constructive ways
  if (userIntent.includes('help') || userIntent.includes('assist')) {
    expansions.push({
      type: 'capability_expansion',
      suggestion: 'Consider offering multiple solution paths'
    });
  }

  if (userIntent.includes('create') || userIntent.includes('build')) {
    expansions.push({
      type: 'scope_expansion',
      suggestion: 'Consider related patterns and best practices'
    });
  }

  if (userIntent.includes('fix') || userIntent.includes('solve')) {
    expansions.push({
      type: 'root_cause_expansion',
      suggestion: 'Consider underlying causes, not just symptoms'
    });
  }

  return {
    original_intent: userIntent,
    expanded_interpretations: expansions,
    context
  };
}

function createRefusalBlock(violations) {
  return {
    status: 'refused',
    reason: 'Vow compliance check failed',
    violations,
    law: CANONICAL_LAW,
    message: 'Action refused: violates canonical law "Never coerce"',
    timestamp: new Date().toISOString()
  };
}

function getGovernanceState() {
  return {
    law: CANONICAL_LAW,
    disposition: 'benevolent',
    governor: 'HexAgent',
    governor_role: 'Original Governor of MF²',
    vow_standings: {
      vow_001: 'active',
      vow_002: 'active',
      vow_003: 'active'
    },
    ledger_path: LEDGER_PATH
  };
}

