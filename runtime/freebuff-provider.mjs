// freebuff-provider.mjs — Groq-backed provider for BRO's runtime.
// Key from env (GROQ_KEY / GROQ_API_KEY). Never hardcode.
export const FREEBUFF_DEFAULT_MODEL = "llama-3.1-8b-instant";

// Prefer small/fast models first. Skip huge reasoning models unless explicitly requested.
const MODEL_FALLBACKS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-20b"
];

const MAX_SYSTEM_CHARS = 12000;
const MAX_HISTORY_CHARS = 24000;
const MAX_MSG_CHARS = 8000;

export function freebuffBaseUrl() {
  const override = process.env.FREEBUFF_BASE_URL || process.env.OPENAI_BASE_URL || "";
  if (override) return override.replace(/\/$/, "");
  return "https://api.groq.com/openai/v1";
}

export function freebuffApiKey() {
  return (
    process.env.GROQ_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.FREEBUFF_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ""
  );
}

export function freebuffModel() {
  return process.env.FREEBUFF_MODEL || FREEBUFF_DEFAULT_MODEL;
}

export function freebuffAvailable() {
  return Boolean(freebuffApiKey() && freebuffBaseUrl());
}

let _lastUsage = null;
export function freebuffLastUsage() {
  return _lastUsage;
}

function clamp(str, max) {
  const s = String(str || "");
  if (s.length <= max) return s;
  return s.slice(0, max) + "\n…[truncated]";
}

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
    messages.push({ role, content: clamp(text, MAX_MSG_CHARS) });
  }
  return messages;
}

/** Keep recent turns within a char budget (drops oldest first). */
function trimHistory(messages, budget) {
  const out = [];
  let used = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const len = (m.content || "").length + 20;
    if (used + len > budget && out.length > 0) break;
    out.unshift(m);
    used += len;
  }
  return out;
}

function extractText(data) {
  const choice = data?.choices?.[0];
  if (!choice) return { text: "", detail: "no choices" };
  const msg = choice.message || {};
  let text = typeof msg.content === "string" ? msg.content : "";
  if (!text && typeof msg.reasoning === "string") text = msg.reasoning;
  if (!text && typeof msg.reasoning_content === "string") text = msg.reasoning_content;
  if (!text && Array.isArray(msg.content)) {
    text = msg.content.map(p => (typeof p === "string" ? p : p?.text || "")).join("");
  }
  if (!text && typeof choice.text === "string") text = choice.text;
  return {
    text: (text || "").trim(),
    detail: !text
      ? `empty (finish_reason=${choice.finish_reason || "?"}, keys=${Object.keys(msg).join(",")})`
      : null
  };
}

function modelCandidates(preferred) {
  // If user forced a huge model via env, still try it first, then fall back to small ones.
  const list = [preferred, ...MODEL_FALLBACKS].filter(Boolean);
  return [...new Set(list)];
}

export async function askFreebuff(prompt, opts = {}) {
  const base = freebuffBaseUrl();
  const key = freebuffApiKey();
  if (!key) throw new Error("No API key configured");
  if (!base) throw new Error("No base URL configured");

  let system = opts.system ? clamp(opts.system, MAX_SYSTEM_CHARS) : "";
  let history = toMessages(Array.isArray(prompt) ? prompt : [{ role: "user", parts: [{ text: prompt }] }]);
  history = trimHistory(history, MAX_HISTORY_CHARS);
  if (!history.length) history = [{ role: "user", content: clamp(String(prompt), MAX_MSG_CHARS) }];

  const preferred = opts.model || freebuffModel();
  const candidates = modelCandidates(preferred);
  const retries = Number.isFinite(opts.retries) ? opts.retries : 2;
  let lastErr = null;

  // On 413, shrink harder and retry
  let shrinkPasses = 0;

  for (const model of candidates) {
    for (let i = 0; i < retries; i++) {
      const messages = [];
      if (system) messages.push({ role: "system", content: system });
      for (const m of history) messages.push(m);

      const body = {
        model,
        messages,
        temperature: Number.isFinite(opts.temperature) ? Math.min(2, Math.max(0, opts.temperature)) : 0.7,
        max_tokens: opts.maxTokens || 2048
      };

      // Never send tool_choice without a tools array (causes Groq 400).
      if (Array.isArray(opts.tools) && opts.tools.length) {
        body.tools = opts.tools;
        if (opts.toolChoice !== undefined) body.tool_choice = opts.toolChoice;
      }

      try {
        const timeoutSignal = AbortSignal.timeout(120000);
        const r = await fetch(base + "/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + key,
            "user-agent": "builderbro/freebuff-provider"
          },
          body: JSON.stringify(body),
          signal: opts.abortSignal ? AbortSignal.any([opts.abortSignal, timeoutSignal]) : timeoutSignal
        });

        if (r.status === 404) {
          const errBody = await r.text().catch(() => "");
          lastErr = new Error("Model unavailable: " + model + (errBody ? " — " + errBody.slice(0, 100) : ""));
          break; // next model
        }

        if (r.status === 413) {
          // Payload too large — shrink context and retry same model once, then next model
          shrinkPasses++;
          system = clamp(system, Math.floor(MAX_SYSTEM_CHARS / (1 + shrinkPasses)));
          history = trimHistory(history, Math.floor(MAX_HISTORY_CHARS / (1 + shrinkPasses)));
          lastErr = new Error("Request too large (413) for " + model);
          if (shrinkPasses <= 2) continue;
          break;
        }

        if (r.status === 429) {
          const retryAfter = Number(r.headers.get("retry-after") || 10);
          await new Promise(ok => setTimeout(ok, retryAfter * 1000));
          continue;
        }
        if (r.status >= 500) {
          lastErr = new Error("API error " + r.status);
          await new Promise(ok => setTimeout(ok, (i + 1) * 2000));
          continue;
        }
        if (!r.ok) {
          const errBody = await r.text().catch(() => "");
          // Don't hard-fail the whole chain on tool_choice ghosts from stale code paths
          if (r.status === 400 && /tool choice/i.test(errBody)) {
            lastErr = new Error("API rejected payload: 400 tool_choice conflict");
            break;
          }
          throw new Error("API rejected payload: " + r.status + (errBody ? " - " + errBody.slice(0, 300) : ""));
        }

        const d = await r.json();
        _lastUsage = d.usage || null;
        const { text, detail } = extractText(d);
        if (!text) throw new Error("Returned empty content" + (detail ? " — " + detail : ""));
        return text;
      } catch (e) {
        lastErr = e;
        if (e.name === "AbortError" || (opts.abortSignal && opts.abortSignal.aborted)) throw e;
        if (/does not exist|model unavailable|404|413|too large/i.test(String(e.message || ""))) break;
        if (i < retries - 1) await new Promise(ok => setTimeout(ok, (i + 1) * 1000));
      }
    }
  }

  throw lastErr || new Error("Request failed — no available model");
}
