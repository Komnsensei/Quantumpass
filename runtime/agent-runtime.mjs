import { randomUUID } from "node:crypto";
import { createActionBudget, createCircuitBreaker, withRetry } from "./autonomy-controls.mjs";

export class AgentRuntime {
  constructor({ ask, personaRegistry, continuity = null, onEvent = () => {}, autonomyConfirmed = false, maxActions = 20, maxFailures = 5, retries = 2 } = {}) {
    if (typeof ask !== "function") throw new Error("AgentRuntime requires an ask function");
    this.ask = ask;
    this.personas = personaRegistry;
    this.continuity = continuity;
    this.onEvent = onEvent;
    this.autonomyConfirmed = autonomyConfirmed;
    this.history = [];
    this.activeTurn = null;
    this.paused = null;
    this.maxActions = maxActions;
    this.maxFailures = maxFailures;
    this.retries = retries;
    this.breaker = createCircuitBreaker();
  }

  emit(type, data = {}) {
    this.onEvent({ type, timestamp: new Date().toISOString(), ...data });
  }

  confirmAutonomy() {
    this.autonomyConfirmed = true;
    this.emit("autonomy", { enabled: true });
  }

  revokeAutonomy() {
    this.autonomyConfirmed = false;
    this.emit("autonomy", { enabled: false });
  }

  switchPersona(id) {
    const persona = this.personas.set(id);
    this.emit("persona", { persona });
    return persona;
  }

  pause(reason = "user requested pause") {
    if (!this.activeTurn) return false;
    this.activeTurn.controller.abort(reason);
    this.paused = { id: this.activeTurn.id, input: this.activeTurn.input, reason };
    this.emit("paused", { turnId: this.activeTurn.id, reason });
    return true;
  }

  resume() {
    const pending = this.paused;
    if (!pending || this.activeTurn) return false;
    this.paused = null;
    this.emit("resumed", { turnId: pending.id, note: "continuing with a fresh provider request because the previous request was aborted" });
    return this.run(pending.input, { turnId: pending.id });
  }

  async run(input, { turnId = randomUUID() } = {}) {
    if (this.activeTurn) throw new Error("another turn is already running");
    const controller = new AbortController();
    const persona = this.personas.current();
    const turn = { id: turnId, input: String(input), controller, persona };
    this.activeTurn = turn;
    this.emit("started", { turnId, persona, input: turn.input });
    this.emit("thinking", { turnId, summary: `${persona?.name || "Agent"} is planning the next action` });
    const budget = createActionBudget({ maxActions: this.maxActions, maxFailures: this.maxFailures });

    try {
      const context = this.continuity?.contextBlock?.(5000) || "";
      const prompt = [
        persona?.systemPrompt || "Be a helpful coding agent.",
        this.autonomyConfirmed
          ? "Autonomy is confirmed for this session. Still ask before destructive, external, credential, or high-impact actions."
          : "Autonomy is not confirmed. Ask before taking any action beyond explanation.",
        context ? `Continuity context:\n${context}` : "",
        `User request:\n${turn.input}`
      ].filter(Boolean).join("\n\n");

      const response = await withRetry(({ signal }) => this.ask(prompt, {
        signal,
        persona,
        onProgress: event => this.emit(event.type || "progress", { turnId, ...event })
      }), {
        signal: controller.signal,
        retries: this.retries,
        breaker: this.breaker,
        budget,
        onRetry: info => this.emit("retry", { turnId, attempt: info.attempt, delay: info.delay, error: info.error.message })
      });
      const text = typeof response === "string" ? response : response?.content || "";
      this.history.push({ role: "user", text: turn.input }, { role: "assistant", text });
      this.continuity?.remember?.("observation", turn.input, { tags: [persona?.id || "agent"] });
      this.emit("completed", { turnId, content: text, budget: budget.state(), circuit: this.breaker.state() });
      return { turnId, content: text };
    } catch (error) {
      if (controller.signal.aborted) {
        this.emit("question", { turnId, prompt: "The turn was interrupted. What should I do next?" });
        return { turnId, paused: true, reason: error.message || "interrupted" };
      }
      this.emit("error", { turnId, error: error.message, code: error.code || "RUNTIME_ERROR", budget: budget.state(), circuit: this.breaker.state() });
      throw error;
    } finally {
      if (this.activeTurn?.id === turnId) this.activeTurn = null;
    }
  }
}
