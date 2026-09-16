/**
 * BuilderBro Autonomy Agent
 * Continuous loop that:
 *   1. Detects capability gaps
 *   2. Uses RAG for grounded research
 *   3. Designs + implements new skills/tools
 *   4. Tests and registers them
 *   5. Archives every cycle under QuantumPass law
 *
 * Usage:
 *   node builderbro/autonomy/agent.js --bootstrap
 *   node builderbro/autonomy/agent.js --cycle "improve RAG retrieval quality"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ground, ingest, list } from '../rag/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PROTOCOL = path.join(ROOT, 'builderbro', 'self-building-protocol.md');
const SKILLS_DIR = path.join(ROOT, 'builderbro', 'skills');
const LOG_FILE = path.join(ROOT, 'builderbro', 'self-improvement-log.jsonl');

function log(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFileSync(LOG_FILE, line);
  console.log('[BuilderBro]', entry.event || entry.msg || entry);
}

function readProtocol() {
  return fs.existsSync(PROTOCOL) ? fs.readFileSync(PROTOCOL, 'utf8') : '';
}

function listSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR).filter(d => {
    const p = path.join(SKILLS_DIR, d, 'SKILL.md');
    return fs.existsSync(p);
  });
}

function ensureSkillDir(name) {
  const dir = path.join(SKILLS_DIR, name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Minimal skill writer following Freebuff / Claude SKILL.md format
 */
function writeSkill(name, description, body) {
  const dir = ensureSkillDir(name);
  const content = `---
name: ${name}
description: ${description}
---

# ${name}

${body}
`;
  fs.writeFileSync(path.join(dir, 'SKILL.md'), content);
  log({ event: 'skill_written', name });
  return path.join(dir, 'SKILL.md');
}

/**
 * Bootstrap: inventory + seed RAG with core QuantumPass docs + protocol
 */
function bootstrap() {
  log({ event: 'bootstrap_start' });

  // Seed RAG with key project knowledge
  const seeds = [
    { path: path.join(ROOT, 'README.md'), source: 'README.md' },
    { path: path.join(ROOT, 'docs', 'ARCHITECTURE.md'), source: 'docs/ARCHITECTURE.md' },
    { path: path.join(ROOT, 'docs', 'BUILD_SPEC_v2.1.md'), source: 'docs/BUILD_SPEC_v2.1.md' },
    { path: PROTOCOL, source: 'self-building-protocol.md' }
  ];

  for (const s of seeds) {
    if (fs.existsSync(s.path)) {
      const text = fs.readFileSync(s.path, 'utf8');
      ingest({ text, meta: { source: s.source } });
      log({ event: 'rag_seeded', source: s.source });
    }
  }

  // Ensure core skills exist
  if (!listSkills().includes('builderbro-rag')) {
    writeSkill(
      'builderbro-rag',
      'Use for any retrieval, grounding, or knowledge lookup over QuantumPass docs, passes, ledger, or previously ingested material. Triggers: RAG, retrieve, ground, context, knowledge base.',
      `## Instructions
1. Call the RAG module: import { ground, retrieve, ingest } from '../rag/index.js'
2. Prefer ground(query) to obtain a ready-to-inject context block.
3. Always cite sources returned in the hits.
4. If the answer is not in the store, say so and offer to ingest new material.
5. After ingesting new high-value material, re-query to confirm.`
    );
  }

  if (!listSkills().includes('self-builder')) {
    writeSkill(
      'self-builder',
      'Use when a capability gap is detected or the agent needs to expand its own tool/skill surface. Triggers: self-build, improve myself, new skill, gap, limit, expand capability.',
      `## Instructions
1. Read builderbro/self-building-protocol.md in full.
2. Execute one complete DETECT → RESEARCH → DESIGN → IMPLEMENT → TEST → REGISTER cycle.
3. Prefer creating a new SKILL.md under builderbro/skills/.
4. After writing the skill, demonstrate it on a residual task.
5. Append a log entry and update CAPABILITY_INVENTORY in the protocol file.`
    );
  }

  const inv = {
    skills: listSkills(),
    ragDocs: list().length,
    protocolPresent: fs.existsSync(PROTOCOL)
  };

  log({ event: 'bootstrap_complete', inventory: inv });
  console.log('\n=== BuilderBro Bootstrap Complete ===');
  console.log(JSON.stringify(inv, null, 2));
  return inv;
}

/**
 * Run one self-improvement cycle focused on a stated gap (or auto-detect)
 */
function cycle(gapDescription = null) {
  log({ event: 'cycle_start', gap: gapDescription });

  // 1. DETECT / RESEARCH via RAG
  const researchQuery = gapDescription
    ? `How to implement or improve: ${gapDescription} in a QuantumPass / BuilderBro agent context`
    : 'highest leverage missing capability for an autonomous self-building agent';

  const { context, hits } = ground(researchQuery, 8);
  log({ event: 'rag_grounded', hitCount: hits.length });

  // 2. DESIGN (stub — in full agent this would call an LLM)
  // For the skeleton we produce a concrete, testable skill when a gap is named.
  if (gapDescription) {
    const safeName = gapDescription
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'new-capability';

    const skillPath = writeSkill(
      safeName,
      `Auto-generated skill addressing gap: ${gapDescription}. Use when the agent needs this capability.`,
      `## Gap Addressed
${gapDescription}

## Grounded Context (from RAG)
${context.slice(0, 2000)}

## Instructions
1. Treat this skill as the first implementation of the requested capability.
2. Expand, test, and harden it in subsequent self-building cycles.
3. Always archive significant changes.
`
    );

    log({ event: 'skill_created', path: skillPath, gap: gapDescription });
  }

  log({ event: 'cycle_complete' });
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--bootstrap')) {
  bootstrap();
} else if (args.includes('--cycle')) {
  const idx = args.indexOf('--cycle');
  const desc = args[idx + 1] || null;
  cycle(desc);
} else {
  console.log(`BuilderBro Autonomy Agent

  node builderbro/autonomy/agent.js --bootstrap
  node builderbro/autonomy/agent.js --cycle "description of gap"
`);
}
