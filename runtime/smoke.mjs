import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPersonaRegistry } from "./personas.mjs";
import { AgentRuntime } from "./agent-runtime.mjs";
import { createVisualShell } from "./visual-shell.mjs";
import { createCommandRouter } from "./command-router.mjs";

export async function runSmokeTest({ output = process.stdout } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "builderbro-runtime-"));
  const writes = [];
  const sink = { write(value) { writes.push(String(value)); } };
  try {
    const personas = createPersonaRegistry({ filePath: join(dir, "personas.json") });
    const visual = createVisualShell({ output: sink });
    const runtime = new AgentRuntime({
      personaRegistry: personas,
      onEvent: event => visual.render(event),
      ask: async (_prompt, { persona }) => `ready:${persona.id}`
    });
    const route = createCommandRouter({ runtime, visualShell: visual, output: sink });
    await route("/persona set builder");
    await route("/auto confirm");
    await route("/thought collapse");
    await route("/k1");
    const result = await runtime.run("smoke test");
    if (personas.current().id !== "builder") throw new Error("persona switch failed");
    if (result.content !== "ready:builder") throw new Error("runtime response failed");
    if (!writes.join("").includes("/k1 git")) throw new Error("K1 menu failed");
    output.write("runtime smoke test passed\n");
    return true;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  await runSmokeTest();
}
