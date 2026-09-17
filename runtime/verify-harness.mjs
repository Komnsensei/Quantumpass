// runtime/verify-harness.mjs
// Runs local verification (tests + basic static signals) and returns a
// structured report with a numerical confidence score.

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Infer the best test command for a project directory.
 * Used by local vibe/automation modules.
 */
export function detectTestCommand(cwd = process.cwd()) {
  const pkgPath = join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const scripts = pkg.scripts || {};
      if (scripts.test) return "npm test";
      if (scripts["test:unit"]) return "npm run test:unit";
      if (scripts.smoke) return "npm run smoke";
    } catch {
      /* ignore */
    }
    return "npm test";
  }
  if (existsSync(join(cwd, "pytest.ini")) || existsSync(join(cwd, "pyproject.toml"))) {
    return "pytest -q";
  }
  if (existsSync(join(cwd, "Cargo.toml"))) return "cargo test";
  if (existsSync(join(cwd, "go.mod"))) return "go test ./...";
  return "npm test";
}

export class VerificationHarness {
  constructor({
    cwd = process.cwd(),
    testCommand = null,
    timeoutMs = 120_000
  } = {}) {
    this.cwd = cwd;
    this.testCommand = testCommand || detectTestCommand(cwd);
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
    const cmd = this.testCommand;

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
