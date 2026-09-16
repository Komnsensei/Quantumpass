// runtime/theory-cli-bridge.mjs
// CLI bridge for /theory add | list | build

import { TheoryStore } from "./theory-store.mjs";
import { AutonomousLoop } from "./autonomous-loop.mjs";

const theoryStore = new TheoryStore();
const autonomousLoop = new AutonomousLoop();

export async function handleTheoryCommand(args) {
  const [subcommand, id, ...rest] = args;

  switch (subcommand) {
    case "add": {
      if (!id || rest.length === 0) {
        console.log("[-] Usage: /theory add <id> \"statement...\"");
        return;
      }
      const statement = rest.join(" ");
      theoryStore.addClaim({
        id,
        statement,
        invariants: [{
          id: "inv_default",
          description: "Default execution success",
          formalExpression: "exit_code == 0"
        }]
      });
      console.log(`[+] Claim '${id}' added successfully.`);
      break;
    }

    case "list": {
      const claims = theoryStore.listClaims();
      console.log("\n=== REGISTERED THEORY CLAIMS ===");
      if (claims.length === 0) {
        console.log("No claims found. Use /theory add <id> \"statement\" to create one.");
      } else {
        claims.forEach(c => {
          console.log(`- [${c.id}]: ${c.statement}`);
          if (c.invariants?.length) {
            c.invariants.forEach(inv => {
              console.log(`    · inv: ${inv.description}${inv.formalExpression ? ` (${inv.formalExpression})` : ""}`);
            });
          }
        });
      }
      console.log("");
      break;
    }

    case "build": {
      if (!id) {
        console.log("[-] Usage: /theory build <id>");
        return;
      }
      const claim = theoryStore.getClaim(id);
      if (!claim) {
        console.log(`[-] Claim '${id}' not found.`);
        return;
      }

      console.log(`[*] Initializing autonomous build loop for claim: ${id}`);
      const contextData = autonomousLoop.buildAgentContext(id);

      // Context is prepared for injection into the LLM runtime / synthesis step
      console.log(`[+] Context prepared with active immunity and invariant bounds.`);

      // Evaluate verification harness (runs against current project)
      const result = autonomousLoop.evaluateIteration(id);
      console.log(`[+] Build evaluation finished. Passed: ${result.passed} | Confidence: ${result.confidence}`);
      if (result.failures?.length) {
        console.log("    Failures:");
        result.failures.forEach(f => console.log("    - " + f.slice(0, 200)));
      }
      break;
    }

    default:
      console.log("[-] Unknown theory command. Available: add, list, build");
      console.log("    /theory add <id> \"statement...\"");
      console.log("    /theory list");
      console.log("    /theory build <id>");
  }
}
