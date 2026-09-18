// Conscious substrate factory — Global Workspace + Self-Model + Reflective Loop.

import { GlobalWorkspace } from "./workspace.mjs";
import { SelfModel } from "./self-model.mjs";
import { ReflectiveLoop } from "./reflective-loop.mjs";

/**
 * @param {{ capacity?: number, goal?: string }} [opts]
 */
export function createConsciousSubstrate(opts = {}) {
  const workspace = new GlobalWorkspace({ capacity: opts.capacity ?? 7 });
  const selfModel = new SelfModel();
  const loop = new ReflectiveLoop({
    workspace,
    selfModel,
    activeGoal: opts.goal || null
  });
  if (opts.goal) loop.setGoal(opts.goal);

  return {
    workspace,
    selfModel,
    loop,
    step: (p) => loop.step(p),
    report: () => loop.report(),
    status: () => loop.status(),
    setGoal: (g) => loop.setGoal(g)
  };
}

export { GlobalWorkspace } from "./workspace.mjs";
export { SelfModel } from "./self-model.mjs";
export { ReflectiveLoop } from "./reflective-loop.mjs";
export { computeMetrics, textSimilarity } from "./metrics.mjs";
