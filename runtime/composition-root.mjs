import { join } from "node:path";
import { homedir } from "node:os";
import { createContinuityEngine } from "../bro-continuity.mjs";
import { AgentRuntime } from "./agent-runtime.mjs";
import { createCommandRouter } from "./command-router.mjs";
import { createNewStateConfig } from "./newstate-adapter.mjs";
import { createNewStateService } from "./newstate-service.mjs";
import { createPersonaRegistry } from "./personas.mjs";
import { createVisualShell } from "./visual-shell.mjs";
import { createLegacyPersonaAdapter } from "./legacy-persona-adapter.mjs";
import { createPolicy } from "./policy.mjs";
import { createRAGAdapter } from "./rag-adapter.mjs";
import { createTaskSupervisor } from "./task-supervisor.mjs";
import { createInterface } from "node:readline";

export function createCompositionRoot({
  ask,
  legacy = async () => true,
  output = process.stdout,
  dataDir = join(homedir(), ".bro"),
  newStateConfig = createNewStateConfig()
} = {}) {
  const visualShell = createVisualShell({ output });
  const personas = createPersonaRegistry({ filePath: join(dataDir, "personas.json") });
  const legacyPersonas = createLegacyPersonaAdapter({ registry: personas, filePath: join(homedir(), ".bro_personas") });
  legacyPersonas.load();
  const continuity = createContinuityEngine({ dataDir });
  const rag = createRAGAdapter();
  const newState = createNewStateService({ config: newStateConfig, output });
  const runtime = new AgentRuntime({
    ask,
    personaRegistry: personas,
    continuity,
    onEvent: event => visualShell.render(event)
  });
  const tasks = createTaskSupervisor({
    filePath: join(dataDir, "autonomous-tasks.json"),
    execute: input => runtime.run(input),
    onEvent: event => visualShell.render(event)
  });
  const authorize = createPolicy({
    output,
    confirm: ({ input, action, source }) => new Promise(resolve => {
      if (!process.stdin.isTTY) { output.write(`Blocked (non-interactive): ${action}: ${input}\n`); return resolve(false); }
      const rl = createInterface({ input: process.stdin, output });
      rl.question(`Allow ${action} \"${String(input).slice(0, 80)}\"? (y/N) `, answer => {
        rl.close();
        resolve(/^y(es)?$/i.test(String(answer).trim()));
      });
    })
  });
  const router = createCommandRouter({
    runtime,
    visualShell,
    newStateService: newState,
    legacy,
    authorize,
    tasks,
    output
  });
  return { runtime, personas, continuity, rag, tasks, visualShell, newState, router, legacyPersonas, authorize };
}
