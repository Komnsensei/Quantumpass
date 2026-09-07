// freebuff-provider.mjs — the Freebuff brain for builderBRO.
//
// Talks to the Freebuff backend (the same gateway the Freebuff SDK uses):
//   POST {base}/api/v1/chat/completions   (OpenAI-compatible)
//   Authorization: Bearer <apiKey>
//
// Key resolution order:
//   1. FREEBUFF_API_KEY / CODEBUFF_API_KEY env vars
//   2. credentials.json (authToken) in ~/.freebuff, ~/.codebuff, or
//      ~/.config/freebuff  — the same store the Freebuff CLI writes to.
//
// Base URL resolution order:
//   FREEBUFF_APP_URL -> NEXT_PUBLIC_FREEBUFF_APP_URL -> https://freebuff.com
//
// Exports the same surface the legacy provider exposed:
//   freebuffAvailable() -> bool   (a key is configured)
//   askFreebuff(prompt, opts) -> string   (model reply text)
// plus helpers for status reporting.

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export const FREEBUFF_DEFAULT_MODEL = "deepseek/deepseek-v4-flash";

const CONFIG_DIR_CANDIDATES = [
  process.env.FREEBUFF_CONFIG_DIR || "",
  join(homedir(), ".config", "manicode"),
  join(homedir(), ".freebuff"),
  join(homedir(), ".codebuff"),
  join(homedir(), ".config", "freebuff")
].filter(Boolean);

export function freebuffBaseUrl() {
  return (
    process.env.FREEBUFF_APP_URL ||
    process.env.NEXT_PUBLIC_FREEBUFF_APP_URL ||
    "https://freebuff.com"
  ).replace(/\/+$/, "");
}

export function freebuffApiKey() {
  if (process.env.FREEBUFF_API_KEY) return process.env.FREEBUFF_API_KEY;
  if (process.env.CODEBUFF_API_KEY) return process.env.CODEBUFF_API_KEY;
  for (const dir of CONFIG_DIR_CANDIDATES) {
    try {
      const f = join(dir, "credentials.json");
      if (!existsSync(f)) continue;
      const parsed = JSON.parse(readFileSync(f, "utf8"));
      // credentials.json may be flat ({authToken}) or nested under a profile
      // ({default: {authToken}}) — accept both.
      const creds = (parsed && parsed.default && typeof parsed.default === "object") ? parsed.default : parsed;
      if (creds && typeof creds.authToken === "string" && creds.authToken) {
        return creds.authToken;
      }
    } catch (_) { /* unreadable credentials file - try next */ }
  }
  return "";
}

export function freebuffModel() {
  return process.env.FREEBUFF_MODEL || FREEBUFF_DEFAULT_MODEL;
}

/** True when a Freebuff API key is configured and a base URL can be built. */
export function freebuffAvailable() {
  return Boolean(freebuffApiKey() && freebuffBaseUrl());
}

/** Convert a Vertex-style chat history to OpenAI messages. */
function toMessages(chatHistory) {
  const messages = [];
  const hist = Array.isArray(chatHistory) ? chatHistory : [];
  for (const turn of hist) {
    let text = "";
    if (turn && Array.isArray(turn.parts)) {
      text = turn.parts.map(p => (p && p.text) || "").join("");
    } else if (turn && typeof turn.text === "string") {
      text = turn.text;
    } else if (typeof turn === "string") {
      text = turn;
    }
    if (!text) continue;
    const role = turn && (turn.role === "model" || turn.role === "assistant") ? "assistant" : "user";
    messages.push({ role, content: text });
  }
  return messages;
}

/**
 * Ask the Freebuff brain. Returns the reply text.
 * opts: { system, temperature, maxTokens, abortSignal, retries }
 */
export async function askFreebuff(prompt, opts = {}) {
  const base = freebuffBaseUrl();
  const key = freebuffApiKey();
  if (!key) throw new Error("No Freebuff API key configured (FREEBUFF_API_KEY / CODEBUFF_API_KEY / credentials.json)");
  if (!base) throw new Error("No Freebuff base URL configured");

  const messages = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  for (const m of toMessages(Array.isArray(prompt) ? prompt : [{ role: "user", parts: [{ text: prompt }] }])) {
    messages.push(m);
  }
  if (!messages.length) messages.push({ role: "user", content: String(prompt) });

  const body = { model: opts.model || freebuffModel(), messages };
  if (Number.isFinite(opts.temperature)) body.temperature = Math.min(2, Math.max(0, opts.temperature));
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;

  const retries = Number.isFinite(opts.retries) ? opts.retries : 3;
  let lastErr = null;
  for (let i = 0; i < retries; i++) {
    try {
      const timeoutSignal = AbortSignal.timeout(120000);
      const r = await fetch(base + "/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
          "user-agent": "builderbro/freebuff-provider"
        },
        body: JSON.stringify(body),
        signal: opts.abortSignal ? AbortSignal.any([opts.abortSignal, timeoutSignal]) : timeoutSignal
      });

      if (r.status === 401 || r.status === 403) {
        throw new Error("Freebuff auth rejected (" + r.status + ") - re-login at freebuff.com or refresh CODEBUFF_API_KEY");
      }
      if (r.status === 429) {
        const retryAfter = Number(r.headers.get("retry-after") || 10);
        await new Promise(ok => setTimeout(ok, retryAfter * 1000));
        continue;
      }
      if (r.status >= 500) {
        lastErr = new Error("Freebuff API " + r.status);
        await new Promise(ok => setTimeout(ok, (i + 1) * 2000));
        continue;
      }
      if (!r.ok) {
        const errBody = await r.text().catch(() => "");
        throw new Error("Freebuff API rejected payload: " + r.status + (errBody ? " - " + errBody.slice(0, 200) : ""));
      }

      const d = await r.json();
      const text = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || "";
      if (!text) throw new Error("Freebuff returned empty content");
      return text;
    } catch (e) {
      lastErr = e;
      if (e.name === "AbortError" || (opts.abortSignal && opts.abortSignal.aborted)) throw e;
      if (i < retries - 1) await new Promise(ok => setTimeout(ok, (i + 1) * 1000));
    }
  }
  throw lastErr || new Error("Freebuff request failed");
}