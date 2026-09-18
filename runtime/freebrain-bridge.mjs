// runtime/freebrain-bridge.mjs
// Shell out to Komnsensei/freebrain agent_runtime.py (cascade brain).

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CANDIDATE_ROOTS = [
  process.env.FREEBRAIN_ROOT,
  join(homedir(), "freebrain"),
  join(homedir(), "quantumpass", "freebrain"),
  join(process.cwd(), "..", "freebrain"),
  join(process.cwd(), "freebrain")
].filter(Boolean);

export function resolveFreebrainRoot() {
  for (const root of CANDIDATE_ROOTS) {
    const script = join(root, "agent_runtime.py");
    if (existsSync(script)) return root;
  }
  return null;
}

function pythonBin() {
  return process.env.FREEBRAIN_PYTHON || process.env.PYTHON || "python3";
}

function freebrainEnv() {
  const env = { ...process.env };
  env.PYTHONIOENCODING = "utf-8";
  env.PYTHONUTF8 = "1";

  if (!env.GROQ_API_KEY && env.GROQ_KEY) env.GROQ_API_KEY = env.GROQ_KEY;

  // Prefer working Groq chat models (override only if user has not set one)
  if (!env.GROQ_MODEL) env.GROQ_MODEL = "openai/gpt-oss-20b";

  // Skip empty Ollama instead of 30s cooldown every call
  if (env.BRAIN_SKIP_EMPTY_LOCAL === undefined) env.BRAIN_SKIP_EMPTY_LOCAL = "1";

  return env;
}

export function runFreebrain(args, { cwd = null, log = console.log, timeoutMs = 180000 } = {}) {
  const root = resolveFreebrainRoot();
  if (!root) {
    return Promise.reject(
      new Error(
        "freebrain not found. Clone https://github.com/Komnsensei/freebrain " +
          "to ~/freebrain or set FREEBRAIN_ROOT."
      )
    );
  }

  const script = join(root, "agent_runtime.py");
  const bin = pythonBin();
  const env = freebrainEnv();

  return new Promise((resolve, reject) => {
    const child = spawn(bin, [script, ...args], {
      cwd: cwd || root,
      env,
      shell: false,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`freebrain timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (buf) => {
      const s = buf.toString("utf8");
      stdout += s;
      for (const line of s.split(/\r?\n/)) {
        if (line.trim()) log(line);
      }
    });
    child.stderr.on("data", (buf) => {
      const s = buf.toString("utf8");
      stderr += s;
      for (const line of s.split(/\r?\n/)) {
        if (line.trim()) log(line);
      }
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

export async function handleBrainCommand(args, { log = console.log } = {}) {
  const [sub, ...rest] = args;
  const root = resolveFreebrainRoot();

  if (!sub || sub === "help") {
    log(`
/brain — Free Brain (Komnsensei/freebrain Python cascade)
  Root: ${root || "(not found — set FREEBRAIN_ROOT)"}

  /brain status              Resolve path + show cascade (--providers)
  /brain providers           Same as --providers
  /brain check               Health check (--check)
  /brain chat <prompt...>    One-shot chat
  /brain goal <goal...>      Goal tool loop (--reflex; more reliable)
  /brain goal-verified <g>   Verified autonomy loop (stricter)
  /brain ping                Short connectivity chat
`);
    return;
  }

  if (!root) {
    log("[-] freebrain not found. git clone https://github.com/Komnsensei/freebrain ~/freebrain");
    log("    or set FREEBRAIN_ROOT to the repo path.");
    return;
  }

  try {
    switch (sub.toLowerCase()) {
      case "status":
      case "providers": {
        log(`[*] freebrain root: ${root}`);
        await runFreebrain(["--providers"], { log });
        break;
      }
      case "check": {
        await runFreebrain(["--check"], { log });
        break;
      }
      case "ping": {
        await runFreebrain(["--chat", "ping"], { log });
        break;
      }
      case "chat": {
        const prompt = rest.join(" ").trim();
        if (!prompt) {
          log("[-] Usage: /brain chat <prompt>");
          return;
        }
        await runFreebrain(["--chat", prompt], { log });
        break;
      }
      case "goal": {
        const goal = rest.join(" ").trim();
        if (!goal) {
          log("[-] Usage: /brain goal <goal>");
          return;
        }
        // --reflex avoids autonomy verified-loop empty_response failures
        await runFreebrain(["--goal", goal, "--reflex"], { log, timeoutMs: 600000 });
        break;
      }
      case "goal-verified": {
        const goal = rest.join(" ").trim();
        if (!goal) {
          log("[-] Usage: /brain goal-verified <goal>");
          return;
        }
        await runFreebrain(["--goal", goal], { log, timeoutMs: 600000 });
        break;
      }
      default: {
        const prompt = [sub, ...rest].join(" ").trim();
        await runFreebrain(["--chat", prompt], { log });
      }
    }
  } catch (e) {
    log("[-] freebrain failed: " + (e.message || e));
  }
}
