// quantumpass-proxy v2.0 — LLM middleware that injects identity context
// OpenAI-compatible endpoint at localhost:5555

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fetchPassport, fetchChainStats, fetchHistory, fetchChainVerification, buildContextInjection } from "./context-builder.js";

// Load config
const configPath = new URL("../config/default.json", import.meta.url);
const config = JSON.parse(readFileSync(configPath, "utf8"));

const PORT = config.proxy.port || 5555;
const HOST = config.proxy.host || "127.0.0.1";

// Cache passport context (refresh every 5 min)
let cachedContext = null;
let cacheTime = 0;
const CACHE_TTL = 300000;

async function getContext() {
  if (cachedContext && Date.now() - cacheTime < CACHE_TTL) return cachedContext;

  try {
    const [passport, stats, history, chainStatus] = await Promise.all([
      fetchPassport(config.qrbtc.api_key),
      fetchChainStats(),
      fetchHistory(config.qrbtc.api_key),
      fetchChainVerification(config.qrbtc.api_key)
    ]);

    // Merge passport data with any extra from stats
    passport.tier = passport.tier || "UNKNOWN";
    passport.total_degrees = passport.total_degrees || 0;

    cachedContext = buildContextInjection(passport, stats, history, config.zenodo.dois, chainStatus);
    cacheTime = Date.now();
    return cachedContext;
  } catch (e) {
    console.error("[QP] Context fetch failed:", e.message);
    return cachedContext || "[QUANTUMPASS: context unavailable — passport fetch failed]";
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => data += c);
    req.on("end", () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

async function forwardToLLM(body) {
  const res = await fetch(config.upstream.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + config.upstream.api_key
    },
    body: JSON.stringify(body)
  });
  return res;
}

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // Health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", version: "2.0.0", cached: !!cachedContext }));
    return;
  }

  // Main proxy endpoint — OpenAI compatible
  if (req.method === "POST" && (req.url === "/v1/chat/completions" || req.url === "/chat/completions")) {
    try {
      const body = await readBody(req);
      const context = await getContext();

      // Set model if not specified
      if (!body.model) body.model = config.upstream.model;

      // Inject context as first system message
      if (!body.messages) body.messages = [];

      const hasSystem = body.messages.length > 0 && body.messages[0].role === "system";
      if (hasSystem) {
        // Prepend context to existing system message
        body.messages[0].content = context + "\n\n" + body.messages[0].content;
      } else {
        // Insert context as new system message
        body.messages.unshift({ role: "system", content: context });
      }

      // Handle streaming
      if (body.stream) {
        const upstream = await forwardToLLM(body);
        res.writeHead(upstream.status, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        });
        // Pipe stream directly
        const reader = upstream.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) { res.end(); break; }
            res.write(value);
          }
        };
        pump().catch(e => { console.error("[QP] Stream error:", e.message); res.end(); });
      } else {
        // Non-streaming
        const upstream = await forwardToLLM(body);
        const data = await upstream.json();
        res.writeHead(upstream.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      }

      console.log("[QP] Proxied:", body.model, "|", body.messages.length, "msgs | stream:", !!body.stream);
    } catch (e) {
      console.error("[QP] Error:", e.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "QuantumPass proxy error: " + e.message } }));
    }
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found. Use POST /v1/chat/completions" }));
});

server.listen(PORT, HOST, () => {
  console.log("[QuantumPass v2.0] Proxy running at http://" + HOST + ":" + PORT);
  console.log("[QP] Upstream:", config.upstream.provider, "→", config.upstream.endpoint);
  console.log("[QP] Model:", config.upstream.model);
  console.log("[QP] Passport:", config.passport.username || "(loading from API)");
  console.log("[QP] DOIs:", config.zenodo.dois.length, "registered");
  console.log("[QP] Use: POST http://localhost:" + PORT + "/v1/chat/completions");
  // Pre-warm cache
  getContext().then(() => console.log("[QP] Context cached.")).catch(() => console.log("[QP] Context cache deferred."));
});