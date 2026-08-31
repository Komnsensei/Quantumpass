import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const NEWSTATE_REPOSITORY = "https://github.com/komnsensei/NewState.git";

export function createNewStateConfig({ env = process.env, rootDir = process.cwd() } = {}) {
  const configuredRoot = env.NEWSTATE_ROOT || join(rootDir, "..", "NEWSTATE");
  const root = resolve(configuredRoot);
  return {
    repository: NEWSTATE_REPOSITORY,
    root,
    serverUrl: env.NEWSTATE_SERVER_URL || "http://127.0.0.1:8080",
    mcpUrl: env.NEWSTATE_MCP_URL || "http://127.0.0.1:3100",
    enginePath: env.NEWSTATE_FVSMB_ENGINE || join(root, "kernel", "governor", "fvsmb-engine.cjs"),
    serverPath: join(root, "server.cjs"),
    mcpServerPath: join(root, "mcp-server", "index.js")
  };
}

export function inspectNewState(config = createNewStateConfig()) {
  return {
    ...config,
    rootExists: existsSync(config.root),
    serverExists: existsSync(config.serverPath),
    mcpServerExists: existsSync(config.mcpServerPath),
    fvsmbExists: existsSync(config.enginePath),
    manifest: readManifest(config.root)
  };
}

function readManifest(root) {
  for (const name of ["package.json", ".newstate/manifest.json"]) {
    try { return JSON.parse(readFileSync(join(root, name), "utf8")); } catch { /* continue */ }
  }
  return null;
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    signal: options.signal || AbortSignal.timeout(10000)
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`NewState ${path} returned HTTP ${response.status}`);
  return body;
}

async function probe(baseUrl, paths, { signal } = {}) {
  let lastError = null;
  for (const path of paths) {
    try { return { ok: true, path, body: await request(baseUrl, path, { signal }) }; }
    catch (error) { lastError = error; }
  }
  return { ok: false, error: lastError?.message || "sidecar unavailable" };
}

export async function checkNewState(config = createNewStateConfig(), { signal } = {}) {
  const result = { config: inspectNewState(config) };
  result.kernel = await probe(config.serverUrl, ["/health", "/status", "/"], { signal });
  result.mcp = await probe(config.mcpUrl, ["/health", "/status", "/"], { signal });
  return result;
}

export async function sendToNewState(message, { config = createNewStateConfig(), from = "builderbro", signal } = {}) {
  return request(config.mcpUrl, "/hexagnt", {
    method: "POST",
    body: JSON.stringify({ message, from }),
    signal
  });
}
