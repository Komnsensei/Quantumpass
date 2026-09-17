// runtime/autonomous-loop.mjs
// Drives the full loop: Theory -> Generation -> Verification -> Immune Injection

import { ImmuneSystem } from "./immune-system.mjs";
import { VerificationHarness } from "./verify-harness.mjs";
import { TheoryStore } from "./theory-store.mjs";

/** Notice injected into prompts when generation budget is constrained. */
export function generationBudgetNotice({ maxActions = 20, maxFailures = 5 } = {}) {
  return `Generation budget: at most ${maxActions} actions and ${maxFailures} failures this turn. Prefer minimal diffs; stop when verification passes.`;
}

export class AutonomousLoop {
  constructor(options = {}) {
    this.immune = new ImmuneSystem(options);
    this.harness = new VerificationHarness(options);
    this.theory = new TheoryStore(options);
    this.options = options;
  }

  /**
   * Prepares the contextual injection string for an LLM prompt before code generation.
   */
  buildAgentContext(claimId) {
    const claim = this.theory.getClaim(claimId);
    const immuneContext = this.immune.loadImmuneContext();
    const budget = generationBudgetNotice(this.options);

    return {
      claim,
      systemPromptAdditions: `
=== ACTIVE IMMUNE SYSTEM & ANTI-PATTERNS ===
${immuneContext}

=== TARGET THEORY CLAIM ===
${claim ? JSON.stringify(claim, null, 2) : "No active claim selected."}

=== ${budget} ===
`
    };
  }

  /**
   * Evaluates generated code against the verification harness and handles feedback.
   */
  evaluateIteration(claimId) {
    console.log(`[*] Running verification for claim: ${claimId}`);
    const result = this.harness.runVerification();

    if (!result.passed) {
      const failureReason = result.failures.join(" | ") || "Verification check failed non-zero exit.";
      this.immune.injectAntiPattern(claimId, failureReason);
      console.log(`[-] Iteration failed [Confidence: ${result.confidence}]. Anti-pattern logged.`);
    } else {
      console.log(`[+] Iteration verified successfully! [Confidence: ${result.confidence}]`);
    }

    return result;
  }
}

export function createAutonomousLoop(options) {
  return new AutonomousLoop(options);
}
