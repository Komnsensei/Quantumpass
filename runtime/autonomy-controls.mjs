export class AutonomyError extends Error {
  constructor(message, { code = "AUTONOMY_ERROR", retryable = false, cause = null } = {}) {
    super(message, { cause });
    this.name = "AutonomyError";
    this.code = code;
    this.retryable = retryable;
  }
}

export function createCircuitBreaker({ failureThreshold = 3, cooldownMs = 30000 } = {}) {
  let failures = 0;
  let openedAt = 0;
  return {
    allow() {
      if (!openedAt) return true;
      if (Date.now() - openedAt >= cooldownMs) { openedAt = 0; failures = 0; return true; }
      return false;
    },
    success() { failures = 0; openedAt = 0; },
    failure() { failures += 1; if (failures >= failureThreshold) openedAt = Date.now(); },
    state() { return { failures, open: Boolean(openedAt), openedAt }; }
  };
}

export function createActionBudget({ maxActions = 20, maxFailures = 5 } = {}) {
  let actions = 0;
  let failures = 0;
  return {
    consume() {
      if (actions >= maxActions) throw new AutonomyError("Autonomy action budget exhausted", { code: "ACTION_BUDGET_EXHAUSTED" });
      actions += 1;
      return actions;
    },
    failure() {
      failures += 1;
      if (failures > maxFailures) throw new AutonomyError("Autonomy failure budget exhausted", { code: "FAILURE_BUDGET_EXHAUSTED" });
    },
    state() { return { actions, failures, maxActions, maxFailures }; }
  };
}

export async function withRetry(operation, { signal, retries = 2, baseDelayMs = 250, breaker = null, budget = null, onRetry = () => {} } = {}) {
  let attempt = 0;
  while (true) {
    if (signal?.aborted) throw new AutonomyError("Operation cancelled", { code: "CANCELLED", retryable: false });
    if (breaker && !breaker.allow()) throw new AutonomyError("Operation circuit is open", { code: "CIRCUIT_OPEN", retryable: true });
    budget?.consume();
    try {
      const result = await operation({ attempt, signal });
      breaker?.success();
      return result;
    } catch (error) {
      const normalized = error instanceof AutonomyError ? error : new AutonomyError(error?.message || "Operation failed", { cause: error, retryable: true });
      breaker?.failure();
      budget?.failure();
      if (!normalized.retryable || attempt >= retries) throw normalized;
      const delay = baseDelayMs * (2 ** attempt);
      onRetry({ attempt: attempt + 1, delay, error: normalized });
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new AutonomyError("Operation cancelled", { code: "CANCELLED" })); }, { once: true });
      });
      attempt += 1;
    }
  }
}

export function safeToolResult(tool, args, result, startedAt = Date.now()) {
  const text = typeof result === "string" ? result : JSON.stringify(result);
  return { tool, args: String(args || ""), ok: !/^ERR\b/.test(text), result: text, ms: Date.now() - startedAt };
}
