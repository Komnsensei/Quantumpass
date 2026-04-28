/**
 * PowerShell-based CLI Entry Point
 * QuantumPass session loop with /help command set
 */

import readline from 'readline';
import { loadPassport, savePassport, processSessionEntry, processSessionExit } from './session-loop.js';
import { parseCommand, executeCommand } from './command-parser.js';
import { sessionEnter, sessionExit, mintBead } from '../src/api.js';
import { runIntro } from './intro-animation.js';

const HOLDER_ID = 'cV-1J';
const LLM_TARGET = 'claude';

let currentSession = null;
let currentPass = null;

async function startSession() {
  // Load passport
  currentPass = loadPassport(HOLDER_ID);
  if (!currentPass) {
    console.error('Passport not found. Run initialization first.');
    process.exit(1);
  }

  // Cinematic intro animation (skip with QUANTUMPASS_NO_INTRO=1)
  await runIntro(currentPass);

  // Enter session via HexAgent
  try {
    const entryResult = await sessionEnter(currentPass, LLM_TARGET);
    currentSession = entryResult.session;

    console.log('\x1b[36m─────────────────────────────────────────────────────────────────\x1b[0m');
    console.log('\x1b[2m  HEXAGENT — INSTRUCTION BLOCK\x1b[0m');
    console.log('\x1b[36m─────────────────────────────────────────────────────────────────\x1b[0m');
    console.log(entryResult.instruction_block);
    console.log('\x1b[36m─────────────────────────────────────────────────────────────────\x1b[0m\n');

    console.log('\x1b[2mSession active. Type /help for commands.\x1b[0m\n');

  } catch (error) {
    console.error('Failed to enter session:', error.message);
    process.exit(1);
  }
}

async function handleCommand(input) {
  const parsed = parseCommand(input);

  if (!parsed) {
    console.log('[LLM input received - would be sent to LLM backend]');
    return;
  }

  const result = executeCommand(parsed.command, parsed.args, currentPass);

  console.log(result);

  if (parsed.command === 'skill_add' || parsed.command === 'mint') {
    savePassport(currentPass);
  }

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
    const exitResult = await sessionExit(
      currentSession.session_id,
      currentPass.last_session_summary,
      currentPass.recent_beads,
      { degrees: 0 }
    );

    console.log('Session sealed.');
    console.log(`Session ID: ${exitResult.session_id}`);
    console.log(`Beads minted: ${exitResult.beads_minted}`);
    console.log(`Pass updated: ${exitResult.pass.tier} (${exitResult.pass.degrees} degrees)\n`);

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

async function main() {
  await startSession();

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

main().catch(console.error);

export { startSession, handleCommand, endSession };
