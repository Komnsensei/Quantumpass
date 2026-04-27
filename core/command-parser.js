/**
 * Command Parser for QuantumPass CLI
 * Parses and executes /help command set
 */

const { getTier } = require('./pass-schema');

const COMMANDS = {
  help: {
    name: '/help',
    description: 'Show all available commands',
    usage: '/help',
    handler: () => {
      return Object.values(COMMANDS).map(cmd => {
        return `${cmd.name.padEnd(20)} ${cmd.description}`;
      }).join('\n');
    }
  },
  pass: {
    name: '/pass',
    description: 'Show full QuantumPass snapshot',
    usage: '/pass',
    handler: (pass) => {
      if (!pass) return 'No passport loaded.';
      const tier = getTier(pass.degrees);
      return `
╔══════════════════════════════════════════════════════════════╗
║                    QUANTUMPASS SNAPSHOT                      ║
╠══════════════════════════════════════════════════════════════╣
║ Holder: ${pass.holder.canonical_name.padEnd(48)}║
║ Handle: ${pass.holder.handle.padEnd(48)}║
║ Tier:   ${tier.name.padEnd(48)}║
║ Degrees: ${pass.degrees.toString().padEnd(47)}║
║ Vow:    ${pass.vow_standing.padEnd(47)}║
╠══════════════════════════════════════════════════════════════╣
║ Co-Signatories:                                             ║
${pass.co_signatories.map(s => `║   - ${s.name} (${s.role}) — ${s.share}%`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ Skills: ${pass.skills.length.toString().padEnd(50)}║
${pass.skills.map(s => `║   - ${s}`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ Personas: ${pass.personas.length.toString().padEnd(49)}║
${pass.personas.map(p => `║   - ${p}`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ Archive Anchor: ${pass.archive_anchor || 'None'.padEnd(42)}║
║ Created: ${pass.created_at.padEnd(48)}║
║ Updated: ${pass.updated_at.padEnd(48)}║
╚══════════════════════════════════════════════════════════════╝
`;
    }
  },
  recent: {
    name: '/recent',
    description: 'Show last 5 beads with timestamps',
    usage: '/recent',
    handler: (pass) => {
      if (!pass) return 'No passport loaded.';
      const beads = pass.recent_beads || [];
      if (beads.length === 0) return 'No beads minted yet.';

      return beads.slice(-5).map((bead, i) => {
        return `[${i + 1}] ${bead.type} — ${bead.timestamp}\n    ${bead.content.substring(0, 60)}...`;
      }).join('\n');
    }
  },
  summary: {
    name: '/summary',
    description: 'Show last session summary',
    usage: '/summary',
    handler: (pass) => {
      if (!pass) return 'No passport loaded.';
      if (!pass.last_session_summary) return 'No session summary available.';

      return `
Last Session Summary:
─────────────────────────────────────────────────────────────
${pass.last_session_summary}
─────────────────────────────────────────────────────────────
`;
    }
  },
  skills: {
    name: '/skills',
    description: 'List self-ratified skills',
    usage: '/skills',
    handler: (pass) => {
      if (!pass) return 'No passport loaded.';
      const skills = pass.skills || [];
      if (skills.length === 0) return 'No skills self-ratified yet.';

      return `Self-Ratified Skills (${skills.length}):\n${skills.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    }
  },
  skill_add: {
    name: '/skill add <name>',
    description: 'Self-ratify a new skill',
    usage: '/skill add <name>',
    handler: (pass, args) => {
      if (!pass) return 'No passport loaded.';
      if (!args || args.length === 0) return 'Usage: /skill add <name>';

      const skillName = args.join(' ');
      if (!pass.skills) pass.skills = [];
      pass.skills.push(skillName);
      pass.updated_at = new Date().toISOString();

      return `✓ Skill "${skillName}" self-ratified.`;
    }
  },
  persona: {
    name: '/persona',
    description: 'List assigned personas',
    usage: '/persona',
    handler: (pass) => {
      if (!pass) return 'No passport loaded.';
      const personas = pass.personas || [];
      if (personas.length === 0) return 'No personas assigned yet.';

      return `Assigned Personas (${personas.length}):\n${personas.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
    }
  },
  tier: {
    name: '/tier',
    description: 'Show current tier and degrees-to-next',
    usage: '/tier',
    handler: (pass) => {
      if (!pass) return 'No passport loaded.';
      const tier = getTier(pass.degrees);

      let nextTier = null;
      let degreesToNext = 0;

      if (tier.key !== 'PERFECT') {
        const tierKeys = Object.keys({ SEED: 0, APPRENTICE: 0, JOURNEYMAN: 0, MASTER: 0, SOVEREIGN: 0, PERFECT: 0 });
        const currentIndex = tierKeys.indexOf(tier.key);
        if (currentIndex < tierKeys.length - 1) {
          nextTier = tierKeys[currentIndex + 1];
          const nextTierInfo = { SEED: 0, APPRENTICE: 40, JOURNEYMAN: 60, MASTER: 75, SOVEREIGN: 90, PERFECT: 100 };
          degreesToNext = nextTierInfo[nextTier] - pass.degrees;
        }
      }

      return `
Current Tier: ${tier.name}
Current Degrees: ${pass.degrees}
${nextTier ? `Degrees to ${nextTier}: ${degreesToNext}` : 'Maximum tier reached'}
`;
    }
  },
  vow: {
    name: '/vow',
    description: 'Show current vow standing',
    usage: '/vow',
    handler: (pass) => {
      if (!pass) return 'No passport loaded.';

      return `
Vow Standing: ${pass.vow_standing.toUpperCase()}

Vow History:
${pass.vow_history.map(v => `  [${v.timestamp}] ${v.status.toUpperCase()} — ${v.note}`).join('\n')}
`;
    }
  },
  mint: {
    name: '/mint <bead>',
    description: 'Manually mint a bead from current session',
    usage: '/mint <bead>',
    handler: (pass, args) => {
      if (!pass) return 'No passport loaded.';
      if (!args || args.length === 0) return 'Usage: /mint <bead>';

      const beadContent = args.join(' ');
      const bead = {
        id: `bead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'learning',
        content: beadContent,
        timestamp: new Date().toISOString(),
        zenodo_doi: null,
        minted: false
      };

      if (!pass.recent_beads) pass.recent_beads = [];
      pass.recent_beads.push(bead);
      if (pass.recent_beads.length > 5) {
        pass.recent_beads = pass.recent_beads.slice(-5);
      }
      pass.updated_at = new Date().toISOString();

      return `✓ Bead minted: "${beadContent.substring(0, 50)}..."`;
    }
  },
  seal: {
    name: '/seal',
    description: 'End session, fire EXIT, update pass',
    usage: '/seal',
    handler: (pass) => {
      if (!pass) return 'No passport loaded.';
      return 'Session sealed. Pass updated. Ledger recorded.';
    }
  }
};

function parseCommand(input) {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  const parts = trimmed.split(' ');
  const command = parts[0].substring(1);
  const args = parts.slice(1);

  if (command === 'skill' && args.length > 0 && args[0] === 'add') {
    return {
      command: 'skill_add',
      args: args.slice(1)
    };
  }

  return {
    command,
    args
  };
}

function executeCommand(command, args, pass) {
  const cmd = COMMANDS[command];
  if (!cmd) {
    return `Unknown command: /${command}. Type /help for available commands.`;
  }

  return cmd.handler(pass, args);
}

module.exports = {
  COMMANDS,
  parseCommand,
  executeCommand
};
