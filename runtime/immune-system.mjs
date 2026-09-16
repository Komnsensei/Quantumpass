// runtime/immune-system.mjs
// Tracks failure modes and injects anti-patterns into context so the agent
// does not repeat the same mistakes.

import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export class ImmuneSystem {
  constructor({ workspaceRoot = process.cwd(), dataDir = null } = {}) {
    // Prefer a durable location under ~/.bro so immunity survives project moves
    this.dataDir = dataDir || join(homedir(), ".bro");
    this.memoryDir = join(this.dataDir, "memory");
    this.immuneLogPath = join(this.memoryDir, "immune_system.md");
    this._ensureStorage();
  }

  _ensureStorage() {
    if (!existsSync(this.memoryDir)) {
      mkdirSync(this.memoryDir, { recursive: true });
    }
    if (!existsSync(this.immuneLogPath)) {
      writeFileSync(
        this.immuneLogPath,
        "# Agent Immune System & Anti-Patterns\n\n" +
          "Recorded failure modes and automated invariants to prevent regression.\n\n"
      );
    }
  }

  /** Returns the full immune context to inject into prompts */
  loadImmuneContext({ maxChars = 6000 } = {}) {
    try {
      if (!existsSync(this.immuneLogPath)) return "";
      const text = readFileSync(this.immuneLogPath, "utf8");
      return text.length > maxChars ? text.slice(-maxChars) : text;
    } catch (e) {
      console.error("[-] Failed to load immune context:", e.message);
      return "";
    }
  }

  /**
   * Record a failure so future runs avoid the same pattern.
   * @param {string} component  Short name of the module / phase that failed
   * @param {string} failureReason  Human-readable reason or structured summary
   */
  injectAntiPattern(component, failureReason) {
    const safeComponent = String(component || "unknown").replace(/[`\n\r]/g, "");
    const safeReason = String(failureReason || "unspecified failure").replace(/\n+/g, " ").slice(0, 500);
    const entry = `\n- **[ANTI-PATTERN]** Component \`${safeComponent}\`: ${safeReason} (Logged: ${new Date().toISOString()})\n`;

    try {
      appendFileSync(this.immuneLogPath, entry);
      console.log(`[+] Immune system updated: anti-pattern for ${safeComponent}`);
    } catch (e) {
      console.error("[-] Failed to write anti-pattern:", e.message);
    }
  }

  /** Convenience: how many anti-patterns are currently recorded */
  count() {
    try {
      const text = this.loadImmuneContext({ maxChars: Infinity });
      return (text.match(/\[ANTI-PATTERN\]/g) || []).length;
    } catch {
      return 0;
    }
  }
}

export const immuneSystem = new ImmuneSystem();
