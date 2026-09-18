// /aware status | step | report — CLI for the consciousness substrate.

import { createConsciousSubstrate } from "./consciousness/index.mjs";

let substrate = null;

function getSubstrate() {
  if (!substrate) {
    substrate = createConsciousSubstrate({ goal: "observe_and_report" });
  }
  return substrate;
}

export async function handleAwareCommand(args, { log = console.log } = {}) {
  const [sub, ...rest] = args;
  const s = getSubstrate();

  switch ((sub || "").toLowerCase()) {
    case "status": {
      log(JSON.stringify(s.status(), null, 2));
      break;
    }
    case "step": {
      const percept = rest.join(" ").trim() || "empty percept";
      const result = s.step(percept);
      log(result.report);
      log(JSON.stringify(result.metrics, null, 2));
      break;
    }
    case "report": {
      log(s.report());
      break;
    }
    case "goal": {
      const goal = rest.join(" ").trim();
      if (!goal) {
        log("[-] Usage: /aware goal <text>");
        break;
      }
      s.setGoal(goal);
      log(`[+] goal set: ${goal}`);
      break;
    }
    case "run": {
      // Convenience: N synthetic steps for a quick experiment
      const n = Math.min(50, Math.max(1, parseInt(rest[0], 10) || 10));
      const metrics = [];
      for (let i = 0; i < n; i++) {
        const r = s.step({ content: `percept_${i}`, priority: 0.4 + (i % 5) * 0.1, tags: ["broadcast"] });
        metrics.push(r.metrics);
      }
      log(s.report());
      log(JSON.stringify({ steps: n, final: metrics[metrics.length - 1] }, null, 2));
      break;
    }
    default:
      log(`
/aware — conscious substrate (GWT experiment)
  /aware status          Workspace + self-model + metrics
  /aware step <percept>  Inject percept, one reflective step
  /aware report          Last natural-language report
  /aware goal <text>     Set active goal in self-model
  /aware run [N]         Run N synthetic steps (default 10)
`);
  }
}
