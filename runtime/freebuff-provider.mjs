// freebuff-provider.mjs — Groq-backed provider for BRO's runtime.
// The API key comes from the environment (GROQ_KEY, or GROQ_API_KEY) - never
// hardcode it here; .env loading lives in cli.mjs / loader.mjs.
//
// Default model is llama-3.3-70b-versatile (stable chat). Override with
// FREEBUFF_MODEL=openai/gpt-oss-120b for the reasoning model if desired.
export const FREEBUFF_DEFAULT_MODEL = "llama-3.3-70b-versatile";

export function freebuffBaseUrl() {
  return "https://api.groq.com/openai/v1";
}

// Read lazily, not at module load: ESM evaluates imports before the module
// body, so a .env loaded by cli.mjs/loader.mjs lands in process.env only after
// this file has already been evaluated.
export function freebuffApiKey() {
  return process.env.GROQ_KEY || process.env.GROQ_API_KEY || "";
}

export function freebuffModel() {
  return process.env.FREEBUFF_MODEL || FREEBUFF_DEFAULT_MODEL;
}

export function freebuffAvailable() {
  return Boolean(freebuffApiKey() && freebuffBaseUrl());
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
    messages.push({ role, content: text });
  }
  return messages;
}

/** Extract text from Groq/OpenAI-style responses, including reasoning models. */
function extractText(data) {
  const choice = data?.choices?.[0];
  if (!choice) return { text: "", finishReason: null, detail: "no choices" };

  const msg = choice.message || {};
  // Standard content
  let text = typeof msg.content === "string" ? msg.content : "";
  // Reasoning models (gpt-oss, etc.) sometimes put output here
  if (!text && typeof msg.reasoning === "string") text = msg.reasoning;
  if (!text && typeof msg.reasoning_content === "string") text = msg.reasoning_content;
  // Array content parts
  if (!text && Array.isArray(msg.content)) {
    text = msg.content.map(p => (typeof p === "string" ? p : p?.text || "")).join("");
  }
  // Legacy / alternate shapes
  if (!text && typeof choice.text === "string") text = choice.text;

  return {
    text: (text || "").trim(),
    finishReason: choice.finish_reason || null,
    detail: !text
      ? `empty content (finish_reason=${choice.finish_reason || "?"}, keys=${Object.keys(msg).join(",")})`
      : null
  };
}

export async function askFreebuff(prompt, opts = {}) {
  const base = freebuffBaseUrl();
  const key = freebuffApiKey();
  if (!key) throw new Error("No API key configured");
  if (!base) throw new Error("No base URL configured");

  const messages = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  for (const m of toMessages(Array.isArray(prompt) ? prompt : [{ role: "user", parts: [{ text: prompt }] }])) {
    messages.push(m);
  }
  if (!messages.length) messages.push({ role: "user", content: String(prompt) });

  const model = opts.model || freebuffModel();
  const body = {
    model,
    messages,
    temperature: Number.isFinite(opts.temperature) ? Math.min(2, Math.max(0, opts.temperature)) : 0.7,
    max_tokens: opts.maxTokens || 4096
  };

  // Only send tool_choice for models that support tools and when we explicitly want text-only.
  // Reasoning models + tool_choice none can yield empty content.
  if (opts.toolChoice !== undefined) {
    body.tool_choice = opts.toolChoice;
  } else if (!/gpt-oss|o1|o3|reasoning/i.test(model)) {
    body.tool_choice = "none";
  }

  const retries = Number.isFinite(opts.retries) ? opts.retries : 3;
  let lastErr = null;

  for (let i = 0; i < retries; i++) {
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
        throw new Error("API rejected payload: " + r.status + (errBody ? " - " + errBody.slice(0, 300) : ""));
      }

      const d = await r.json();
      const { text, detail } = extractText(d);
      if (!text) {
        throw new Error("Returned empty content" + (detail ? " — " + detail : ""));
      }
      return text;
    } catch (e) {
      lastErr = e;
      if (e.name === "AbortError" || (opts.abortSignal && opts.abortSignal.aborted)) throw e;
      if (i < retries - 1) await new Promise(ok => setTimeout(ok, (i + 1) * 1000));
    }
  }
  throw lastErr || new Error("Request failed");
}
