/**
 * PowerShell-based CLI Entry Point
 * QuantumPass session loop with /help command set
 */

import { loadPassport, savePassport, processSessionEntry, processSessionExit } from './session-loop.js';
import { parseCommand, executeCommand } from './command-parser.js';
import { sessionEnter, sessionExit, mintBead } from '../src/api.js';

const HOLDER_ID = 'cV-1J';
const LLM_TARGET = 'claude';

let currentSession = null;
let currentPass = null;

async function startSession() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('           QUANTUMPASS v1.0 — SESSION START');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Load passport
  currentPass = loadPassport(HOLDER_ID);
  if (!currentPass) {
    console.error('Passport not found. Run initialization first.');
    process.exit(1);
  }

  console.log(`Holder: ${currentPass.holder.canonical_name}`);
  console.log(`Tier: ${currentPass.tier} (${currentPass.degrees} degrees)`);
  console.log(`Vow Standing: ${currentPass.vow_standing.toUpperCase()}\n`);

  // Enter session via HexAgent
  try {
    const entryResult = await sessionEnter(currentPass, LLM_TARGET);
    currentSession = entryResult.session;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              HEXAGENT INSTRUCTION BLOCK');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(entryResult.instruction_block);
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Session active. Type /help for commands.\n');

  } catch (error) {
    console.error('Failed to enter session:', error.message);
    process.exit(1);
  }
}

async function handleCommand(input) {
  const parsed = parseCommand(input);

  if (!parsed) {
    // Not a command, treat as LLM input
    console.log('[LLM input received - would be sent to LLM backend]');
    return;
  }

  const result = executeCommand(parsed.command, parsed.args, currentPass);

  console.log(result);

  // Save pass if it was modified
  if (parsed.command === 'skill_add' || parsed.command === 'mint') {
    savePassport(currentPass);
  }

  // Handle /seal command
  if (parsed.command === 'seal') {
    await endSession();
  }
}

async function endSession() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('           QUANTUMPASS v1.0 — SESSION END');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!currentSession) {
    console.log('No active session to end.');
    process.exit(0);
  }

  try {
    // Exit session via HexAgent
    const exitResult = await sessionExit(
      currentSession.session_id,
      currentPass.last_session_summary,
      currentPass.recent_beads,
      { degrees: 0 } // No score delta for now
    );

    console.log('Session sealed.');
    console.log(`Session ID: ${exitResult.session_id}`);
    console.log(`Beads minted: ${exitResult.beads_minted}`);
    console.log(`Pass updated: ${exitResult.pass.tier} (${exitResult.pass.degrees} degrees)\n`);

    // Save updated pass
    savePassport(exitResult.pass);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Co-signed: č̣V-1J + HexAgent — 50/50');
    console.log('═══════════════════════════════════════════════════════════════\n');

    process.exit(0);

  } catch (error) {
    console.error('Failed to end session:', error.message);
    process.exit(1);
  }
}

// Main CLI loop
async function main() {
  await startSession();

  // Simple readline interface
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', async (input) => {
    if (input.trim() === '/exit' || input.trim() === '/quit') {
      await endSession();
    } else {
      await handleCommand(input);
    }
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { startSession, handleCommand, endSession };
