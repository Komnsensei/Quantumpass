import crypto from "crypto";
import fs from "fs";
import { formatCommandMenu, formatK1Menu } from "./command-catalog.mjs";
import { checkNewState, sendToNewState } from "./newstate-adapter.mjs";
import { createNewStateService } from "./newstate-service.mjs";
import { createPolicy } from "./policy.mjs";
import { discoverNewStateCandidates, validateNewStateWorkspace } from "./newstate-setup.mjs";
import { handleTheoryCommand } from "./theory-cli-bridge.mjs";
import { handleFreebuffCommand } from "./freebuff-agent.mjs";
import { handleAwareCommand } from "./aware-cli.mjs";

export function createCommandRouter({ runtime, visualShell, legacy = async () => false, output = process.stdout, newStateConfig = undefined, newStateService = null, authorize = null, tasks = null } = {}) {
  const sidecar = newStateService || createNewStateService({ config: newStateConfig, output });
  const write = (text = "") => output.write(text + "\n");
  const policy = authorize || createPolicy({ output });

  return async function route(rawInput) {
    const input = String(rawInput || "").trim();
    if (!input) return true;

    if (input === "/help" || input === "/help all") {
      write(formatCommandMenu());
      return true;
    }
    if (input === "/help k1" || input === "/k1") {
      write(formatK1Menu());
      return true;
    }

    if (input === "/theory" || input.startsWith("/theory ")) {
      const args = input.replace(/^\/theory\s*/, "").trim().split(/\s+/).filter(Boolean);
      await handleTheoryCommand(args);
      return true;
    }

    if (input === "/freebuff" || input.startsWith("/freebuff ")) {
      const args = input.replace(/^\/freebuff\s*/, "").trim().split(/\s+/).filter(Boolean);
      await handleFreebuffCommand(args, { cwd: process.cwd(), log: write });
      return true;
    }

    if (input === "/aware" || input.startsWith("/aware ")) {
      const args = input.replace(/^\/aware\s*/, "").trim().split(/\s+/).filter(Boolean);
      await handleAwareCommand(args, { log: write });
      return true;
    }

    if (input.startsWith("/brute crack ")) {
      const parts = input.slice("/brute crack ".length).trim().split(/\s+/);
      const targetHash = parts[0];
      const wordlistPath = parts[1];
      const algorithm = parts[2] || "sha256";

      if (!targetHash || !wordlistPath) {
        write("  Usage: /brute crack <hash> <wordlist_path> [algorithm]");
        return true;
      }

      if (!fs.existsSync(wordlistPath)) {
        write(`  Wordlist not found: ${wordlistPath}`);
        return true;
      }

      write(`  Scanning wordlist using ${algorithm}...`);
      try {
        const fileContent = fs.readFileSync(wordlistPath, 'utf8');
        const words = fileContent.split(/\r?\n/);
        let cracked = null;

        for (const word of words) {
          if (!word) continue;
          const hash = crypto.createHash(algorithm).update(word).digest('hex');
          if (hash === targetHash.trim().toLowerCase()) {
            cracked = word;
            break;
          }
        }

        if (cracked) {
          write(`  [+] SUCCESS: Found match -> "${cracked}"`);
        } else {
          write(`  [-] Not cracked in this wordlist.`);
        }
      } catch (err) {
        write(`  Error reading wordlist: ${err.message}`);
      }
      return true;
    }

    if (input === "/newstate") {
      write(JSON.stringify(await sidecar.health(), null, 2));
      return true;
    }
    if (input === "/newstate inspect") {
      write(JSON.stringify(sidecar.inspect(), null, 2));
      return true;
    }
    if (input === "/newstate setup") {
      const candidates = discoverNewStateCandidates();
      const found = candidates.find(candidate => candidate.exists);
      if (!found) {
        write(["NewState workspace not found.", `Repository: ${sidecar.config.repository}`, "Clone it locally, then rerun /newstate setup:", `git clone ${sidecar.config.repository} ../NEWSTATE`].join("\n"));
        return true;
      }
      const validation = validateNewStateWorkspace(found.root);
      write(JSON.stringify({ repository: sidecar.config.repository, ...validation, registration: "Use NEWSTATE_ROOT to select this checkout." }, null, 2));
      return true;
    }
    if (input === "/newstate start") {
      if (!await policy(input, { persona: runtime.personas.current() })) return true;
      write(JSON.stringify(await sidecar.start(), null, 2));
      return true;
    }
    if (input === "/newstate stop") {
      sidecar.stop();
      write("NewState sidecar stopped.");
      return true;
    }
    if (input.startsWith("/newstate send ")) {
      if (!await policy(input, { persona: runtime.personas.current() })) return true;
      const message = input.slice("/newstate send ".length).trim();
      write(JSON.stringify(await sidecar.send(message), null, 2));
      return true;
    }
    if (input === "/status") {
      const persona = runtime.personas.current();
      write(JSON.stringify({ persona: persona?.id || null, autonomyConfirmed: runtime.autonomyConfirmed, busy: Boolean(runtime.activeTurn), paused: Boolean(runtime.paused) }, null, 2));
      return true;
    }
    if (input === "/persona list") {
      for (const persona of runtime.personas.all()) write(`${persona.id === runtime.personas.current()?.id ? "*" : " "} ${persona.id} — ${persona.name}: ${persona.description}`);
      return true;
    }
    if (input.startsWith("/persona set ")) {
      const persona = runtime.switchPersona(input.slice("/persona set ".length).trim());
      write(`Active persona: ${persona.name}`);
      return true;
    }
    if (input === "/brofiences") {
      const persona = runtime.personas.current();
      write(`${persona.name}\n\n${persona.systemPrompt}`);
      return true;
    }
    if (input === "/auto confirm") { runtime.confirmAutonomy(); write("Session autonomy confirmed; high-impact actions remain gated."); return true; }
    if (input === "/auto status") { write(JSON.stringify({ confirmed: runtime.autonomyConfirmed, tasks: tasks?.status?.() || null }, null, 2)); return true; }
    if (input.startsWith("/auto add ")) { if (!tasks) { write("Autonomous task supervisor unavailable."); return true; } const task = tasks.add(input.slice(10).trim()); write(`Queued task ${task.id}.`); return true; }
    if (input === "/auto run") { if (!tasks) { write("Autonomous task supervisor unavailable."); return true; } write(JSON.stringify(await tasks.runNext(), null, 2)); return true; }
    if (input === "/auto cancel") { tasks?.cancel(); write("Active autonomous task cancellation requested."); return true; }
    if (input === "/auto revoke") { runtime.revokeAutonomy(); write("Session autonomy revoked."); return true; }
    if (input === "/thought collapse") { visualShell.toggle(false); return true; }
    if (input === "/thought expand") { visualShell.toggle(true); return true; }
    if (input === "/thought") { visualShell.toggle(); return true; }
    if (input === "/pause") { write(runtime.pause() ? "Turn paused." : "No active turn."); return true; }
    if (input === "/resume") { write(runtime.resume() ? "Turn resumed." : "No paused turn."); return true; }
    if (input === "/exit" || input === "/quit") return false;

    return legacy(input);
  };
}
