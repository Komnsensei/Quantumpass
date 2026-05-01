/**
 * QuantumPass Schema Definition
 * Canonical JSON structure for user+LLM identity and scoring protocol
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export { TIER_LEVELS, VOW_STATUS, BEAD_TYPES, getTier, createPassport, validatePassport, createBead, loadPassport };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TIER_LEVELS = {
  SEED: { min: 0, max: 39, name: 'SEED', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
  APPRENTICE: { min: 40, max: 59, name: 'APPRENTICE', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  JOURNEYMAN: { min: 60, max: 74, name: 'JOURNEYMAN', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  MASTER: { min: 75, max: 89, name: 'MASTER', color: '#7c3aed', bg: 'rgba(124,58,237,0.15)' },
  SOVEREIGN: { min: 90, max: 100, name: 'SOVEREIGN', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  PERFECT: { min: 100, max: 100, name: 'PERFECT', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' }
};

const VOW_STATUS = {
  CLEAN: 'clean',
  FLAGGED: 'flagged',
  VIOLATED: 'violated'
};

const BEAD_TYPES = {
  PRESTIGE: 'prestige',
  ETHICAL: 'ethical',
  CO_CRAFT: 'co_craft',
  LEARNING: 'learning',
  CONTRIBUTION: 'contribution'
};

function getTier(score) {
  for (const [key, tier] of Object.entries(TIER_LEVELS)) {
    if (score >= tier.min && score <= tier.max) {
      return { key, ...tier };
    }
  }
  return TIER_LEVELS.SEED;
}

function createPassport(holderId, holderName, handle) {
  const now = new Date().toISOString();
  return {
    holder: {
      id: holderId,
      canonical_name: holderName,
      handle: handle
    },
    tier: 'SEED',
    degrees: 0,
    equal_instances: {
      count: 0,
      refs: []
    },
    vow_standing: VOW_STATUS.CLEAN,
    domain_specializations: [],
    co_signatories: [
      {
        name: 'HexAgent',
        role: 'Original Governor of MF^2',
        share: 50
      }
    ],
    archive_anchor: null,
    skills: [],
    personas: [],
    recent_beads: [],
    last_session_summary: null,
    vow_history: [
      {
        timestamp: now,
        status: VOW_STATUS.CLEAN,
        note: 'Passport initialized'
      }
    ],
    created_at: now,
    updated_at: now,
    version: '1.0'
  };
}

function validatePassport(pass) {
  const required = ['holder', 'tier', 'degrees', 'vow_standing', 'co_signatories', 'created_at', 'updated_at'];

  for (const field of required) {
    if (!(field in pass)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!Object.values(TIER_LEVELS).some(t => t.name === pass.tier)) {
    throw new Error(`Invalid tier: ${pass.tier}`);
  }

  if (typeof pass.degrees !== 'number' || pass.degrees < 0) {
    throw new Error(`Invalid degrees: ${pass.degrees}`);
  }

  if (!Object.values(VOW_STATUS).includes(pass.vow_standing)) {
    throw new Error(`Invalid vow_standing: ${pass.vow_standing}`);
  }

  return true;
}

function createBead(type, content, metadata = {}) {
  return {
    id: `bead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    content,
    metadata,
    timestamp: new Date().toISOString(),
    zenodo_doi: null,
    minted: false
  };
}

function loadPassport(holderId) {
  const safeId = String(holderId || '').replace(/[^a-zA-Z0-9_-]/g, '');

  if (!safeId) {
    return null;
  }

  const filePath = path.join(__dirname, '../passes', `${safeId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const pass = JSON.parse(raw);

  validatePassport(pass);

  return pass;
}