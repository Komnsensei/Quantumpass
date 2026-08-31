import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { URL } from "node:url";
import { checkNewState, createNewStateConfig, inspectNewState, sendToNewState } from "./newstate-adapter.mjs";

export function createNewStateService({ config = createNewStateConfig(), spawnImpl = spawn, output = process.stdout, readinessTimeoutMs = 15000 } = {}) {
  let kernelProcess = null;
  let mcpProcess = null;
  let state = "offline";
  let lastError = null;

  function log(message) { output.write(`[NewState] ${message}\n`); }

  function running(child) { return Boolean(child && child.exitCode === null && !child.killed); }

  function attach(child, name) {
    child.once?.("error", error => { lastError = error; state = "crashed"; log(`${name} error: ${error.message}`); });
    child.once?.("exit", code => { if (code !== 0 && state !== "offline") { state = "crashed"; log(`${name} exited with code ${code}`); } });
  }

  async function waitForReady(url, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        await new Promise((resolve, reject) => {
          const target = new URL(url);
          const request = (target.protocol === "https:" ? httpsRequest : httpRequest)(target, { method: "GET", timeout: 1000 }, response => { response.resume(); resolve(); });
          request.once("error", reject);
          request.once("timeout", () => { request.destroy(); reject(new Error("timeout")); });
          request.end();
        });
        return true;
      } catch { await new Promise(resolve => setTimeout(resolve, 250)); }
    }
    return false;
  }

  async function start() {
    const inspection = inspectNewState(config);
    if (!inspection.serverExists || !inspection.mcpServerExists) {
      throw new Error(`NewState checkout is incomplete at ${config.root}; expected server.cjs and mcp-server/index.js`);
    }
    state = "starting";
    const childEnv = {
      PATH: process.env.PATH,
      NODE_ENV: process.env.NODE_ENV || "production",
      PORT: process.env.NEWSTATE_PORT || "8080",
      NEWSTATE_ROOT: config.root
    };
    if (!running(kernelProcess)) {
      kernelProcess = spawnImpl(process.execPath, [config.serverPath], { cwd: config.root, stdio: "inherit", env: childEnv });
      attach(kernelProcess, "kernel");
      log(`kernel starting on ${config.serverUrl}`);
    }
    if (!running(mcpProcess)) {
      mcpProcess = spawnImpl(process.execPath, [config.mcpServerPath], { cwd: config.root, stdio: "inherit", env: childEnv });
      attach(mcpProcess, "MCP bridge");
      log(`MCP bridge starting on ${config.mcpUrl}`);
    }
    const [kernelReady, mcpReady] = await Promise.all([waitForReady(config.serverUrl, readinessTimeoutMs), waitForReady(config.mcpUrl, readinessTimeoutMs)]);
    if (lastError) state = "crashed";
    else state = kernelReady && mcpReady ? "healthy" : "degraded";
    return { state, kernelStarted: running(kernelProcess), mcpStarted: running(mcpProcess), kernelReady, mcpReady, error: lastError?.message || null };
  }

  function stop() {
    for (const child of [kernelProcess, mcpProcess]) {
      if (running(child)) child.kill();
    }
    kernelProcess = null;
    mcpProcess = null;
    state = "offline";
    lastError = null;
    log("sidecar stopped");
    return true;
  }

  return {
    config,
    inspect: () => inspectNewState(config),
    health: options => checkNewState(config, options),
    send: (message, options = {}) => sendToNewState(message, { ...options, config }),
    start,
    stop,
    isRunning: () => ({ state, kernel: running(kernelProcess), mcp: running(mcpProcess), installed: existsSync(config.root), error: lastError?.message || null })
  };
}
