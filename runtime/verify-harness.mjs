// runtime/verify-harness.mjs
// Runs local verification (tests + basic static signals) and returns a
// structured report with a numerical confidence score.

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export class VerificationHarness {
  constructor({
    cwd = process.cwd(),
    testCommand = "npm test",
    timeoutMs = 120_000
  } = {}) {
    this.cwd = cwd;
    this.testCommand = testCommand;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Execute the verification suite.
   * @returns {{ passed: boolean, confidence: number, failures: string[], outputSummary: string, durationMs: number }}
   */
  runVerification() {
    const started = Date.now();
    console.log(`[*] Verification harness starting in ${this.cwd} …`);

    let testPassed = false;
    let rawOutput = "";
    const failures = [];

    // Prefer package scripts if present; fall back gracefully
    const pkgPath = join(this.cwd, "package.json");
    let cmd = this.testCommand;
    if (existsSync(pkgPath) && this.testCommand === "npm test") {
      // leave as-is; npm will report missing script cleanly
    }

    try {
      rawOutput = execSync(cmd, {
        cwd: this.cwd,
        encoding: "utf8",
        timeout: this.timeoutMs,
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, FORCE_COLOR: "0" }
      });
      testPassed = true;
    } catch (error) {
      rawOutput = (error.stdout || "") + "\n" + (error.stderr || error.message || "");
      failures.push(
        error.stderr
          ? String(error.stderr).trim().slice(0, 800)
          : "Test execution returned non-zero exit code."
      );
    }

    // Simple but useful confidence heuristic
    let confidence = testPassed ? 0.92 : 0.18;
    const lower = rawOutput.toLowerCase();

    if (lower.includes("fail") || lower.includes("error") || lower.includes("err!")) {
      confidence = Math.max(0, confidence - 0.25);
    }
    if (lower.includes("pass") && testPassed) {
      confidence = Math.min(1, confidence + 0.05);
    }
    if (failures.length > 2) {
      confidence = Math.max(0, confidence - 0.1);
    }

    const durationMs = Date.now() - started;

    return {
      passed: testPassed && failures.length === 0,
      confidence: Number(confidence.toFixed(2)),
      failures,
      outputSummary: rawOutput.slice(-800),
      durationMs
    };
  }
}

export function createVerificationHarness(options) {
  return new VerificationHarness(options);
}
