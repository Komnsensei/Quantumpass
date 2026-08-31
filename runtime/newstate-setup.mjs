import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { inspectNewState, NEWSTATE_REPOSITORY } from "./newstate-adapter.mjs";

export function discoverNewStateCandidates({ rootDir = process.cwd(), candidates = null } = {}) {
  const paths = candidates || [
    join(rootDir, "..", "NEWSTATE"),
    join(rootDir, "..", "newstate"),
    join(rootDir, "NEWSTATE"),
    join(rootDir, "newstate")
  ];
  return paths.map(path => resolve(path)).filter((path, index, all) => all.indexOf(path) === index).map(root => ({
    root,
    exists: existsSync(root),
    inspection: inspectNewState({
      repository: NEWSTATE_REPOSITORY,
      root,
      serverUrl: "http://127.0.0.1:8080",
      mcpUrl: "http://127.0.0.1:3100",
      enginePath: join(root, "kernel", "governor", "fvsmb-engine.cjs"),
      serverPath: join(root, "server.cjs"),
      mcpServerPath: join(root, "mcp-server", "index.js")
    })
  }));
}

export function validateNewStateWorkspace(root) {
  const resolvedRoot = resolve(root);
  const config = {
    repository: NEWSTATE_REPOSITORY,
    root: resolvedRoot,
    serverUrl: "http://127.0.0.1:8080",
    mcpUrl: "http://127.0.0.1:3100",
    enginePath: join(resolvedRoot, "kernel", "governor", "fvsmb-engine.cjs"),
    serverPath: join(resolvedRoot, "server.cjs"),
    mcpServerPath: join(resolvedRoot, "mcp-server", "index.js")
  };
  const inspection = inspectNewState(config);
  let packageError = null;
  if (inspection.rootExists) {
    try {
      const pkg = JSON.parse(readFileSync(join(resolvedRoot, "package.json"), "utf8"));
      inspection.package = { name: pkg.name || null, version: pkg.version || null };
    } catch (error) { packageError = error.message; }
  }
  return { ...inspection, packageError, valid: inspection.rootExists && inspection.serverExists && inspection.mcpServerExists && !packageError };
}

export function registerNewStateWorkspace(root, { filePath = join(homedir(), ".bro", "newstate-config.json"), now = Date.now } = {}) {
  const validation = validateNewStateWorkspace(root);
  if (!validation.valid) throw new Error(`NewState workspace validation failed at ${validation.root}`);
  mkdirSync(dirname(filePath), { recursive: true });
  const registration = { root: validation.root, enginePath: validation.enginePath, registeredAt: now(), status: "configured" };
  writeFileSync(filePath, JSON.stringify(registration, null, 2) + "\n", "utf8");
  return { ...registration, filePath, validation };
}
