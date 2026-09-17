// runtime/freebuff-agent.mjs
// Run Freebuff/Codebuff agents using CLI-stored credentials + @codebuff/sdk.

import { loadFreebuffCredentials } from "./freebuff-credentials.mjs";

/**
 * Run a one-shot agent prompt via Codebuff SDK.
 * Requires: npm dependency @codebuff/sdk and a logged-in Freebuff CLI (credentials.json).
 */
export async function runFreebuffAgent(prompt, {
  cwd = process.cwd(),
  agent = process.env.FREEBUFF_AGENT || "base",
  onEvent = null
} = {}) {
  const creds = loadFreebuffCredentials();
  if (!creds?.authToken) {
    throw new Error(
      "No Freebuff credentials. Run `freebuff login` (or install Freebuff CLI and sign in). " +
        "Expected ~/.config/manicode/credentials.json"
    );
  }

  let CodebuffClient;
  try {
    const mod = await import("@codebuff/sdk");
    CodebuffClient = mod.CodebuffClient || mod.default?.CodebuffClient || mod.default;
  } catch (e) {
    throw new Error(
      "@codebuff/sdk not available. Run: npm install @codebuff/sdk\n" + (e.message || e)
    );
  }

  if (typeof CodebuffClient !== "function") {
    throw new Error("@codebuff/sdk did not export CodebuffClient");
  }

  const client = new CodebuffClient({
    apiKey: creds.authToken,
    cwd
  });

  if (typeof client.checkConnection === "function") {
    const ok = await client.checkConnection().catch(() => false);
    if (!ok) {
      // Non-fatal: some builds always return false; still try run
      if (onEvent) onEvent({ type: "warning", message: "Codebuff health check failed; attempting run anyway" });
    }
  }

  const result = await client.run({
    agent,
    prompt: String(prompt || "").trim()
  });

  // Normalize common SDK result shapes
  if (typeof result === "string") return result;
  if (result?.output) return typeof result.output === "string" ? result.output : JSON.stringify(result.output, null, 2);
  if (result?.message) return String(result.message);
  if (result?.text) return String(result.text);
  return JSON.stringify(result, null, 2);
}

export async function handleFreebuffCommand(args, { cwd = process.cwd(), log = console.log } = {}) {
  const sub = (args[0] || "").toLowerCase();

  if (!sub || sub === "help") {
    log(`
/freebuff — Freebuff free agents (via CLI credentials + @codebuff/sdk)

  /freebuff status              Show whether credentials + SDK are available
  /freebuff <prompt...>         Run a one-shot agent turn in the current project
  /freebuff agent <id> <prompt> Use a specific agent id (default: base)

Requires Freebuff CLI login (credentials in ~/.config/manicode/credentials.json).
The freebuff CLI itself is interactive-only; this bridge uses the SDK instead.
`);
    return;
  }

  if (sub === "status") {
    const creds = loadFreebuffCredentials();
    let sdkOk = false;
    try {
      await import("@codebuff/sdk");
      sdkOk = true;
    } catch {
      sdkOk = false;
    }
    log("Freebuff status:");
    log("  credentials: " + (creds ? `yes (${creds.email || creds.path})` : "MISSING — run freebuff login"));
    log("  @codebuff/sdk: " + (sdkOk ? "installed" : "MISSING — npm install @codebuff/sdk"));
    log("  cwd: " + cwd);
    return;
  }

  let agent = process.env.FREEBUFF_AGENT || "base";
  let promptParts = args;

  if (sub === "agent" && args.length >= 3) {
    agent = args[1];
    promptParts = args.slice(2);
  }

  const prompt = promptParts.join(" ").trim();
  if (!prompt) {
    log("[-] Usage: /freebuff <prompt>");
    return;
  }

  log(`[*] Freebuff agent "${agent}" running…`);
  try {
    const text = await runFreebuffAgent(prompt, { cwd, agent });
    log(text);
  } catch (e) {
    log("[-] Freebuff agent failed: " + (e.message || e));
  }
}
