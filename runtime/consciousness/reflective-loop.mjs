// Reflective loop: every step, update self-model from workspace and emit a report.

import { computeMetrics } from "./metrics.mjs";

export class ReflectiveLoop {
  /**
   * @param {{ workspace: import('./workspace.mjs').GlobalWorkspace, selfModel: import('./self-model.mjs').SelfModel, activeGoal?: string }} deps
   */
  constructor({ workspace, selfModel, activeGoal = null } = {}) {
    if (!workspace || !selfModel) throw new Error("ReflectiveLoop requires workspace + selfModel");
    this.workspace = workspace;
    this.selfModel = selfModel;
    this.activeGoal = activeGoal;
    this.lastReport = "";
    this.prevReport = "";
    this.history = [];
  }

  setGoal(goal) {
    this.activeGoal = goal;
    this.selfModel.setGoal(goal);
  }

  /**
   * Inject a percept, run one reflective step, return report + metrics.
   */
  step(percept) {
    const content = typeof percept === "string" ? percept : percept?.content;
    const event = this.workspace.broadcast({
      content,
      source: (typeof percept === "object" && percept?.source) || "sensor",
      priority: (typeof percept === "object" && percept?.priority) ?? 0.6,
      tags: (typeof percept === "object" && percept?.tags) || ["broadcast"]
    });

    const top = this.workspace.top(1)[0];
    if (top) this.selfModel.setFocus(top.content);
    this.selfModel.tick();

    this.prevReport = this.lastReport;
    this.lastReport = this._composeReport(event, top);

    const metrics = computeMetrics({
      workspace: this.workspace,
      selfModel: this.selfModel,
      lastReport: this.lastReport,
      prevReport: this.prevReport,
      activeGoal: this.activeGoal
    });

    this.history.push({ eventId: event.id, report: this.lastReport, metrics });
    return { event, report: this.lastReport, metrics };
  }

  _composeReport(event, top) {
    const sm = this.selfModel.snapshot();
    const lines = [
      `[aware] step=${sm.stepCount}`,
      `goal=${sm.goal ?? "(none)"}`,
      `focus=${(top?.content || sm.focus || "(empty)").slice(0, 160)}`,
      `last_percept=${String(event.content).slice(0, 120)}`,
      sm.lastError ? `last_error=${sm.lastError.slice(0, 80)}` : null
    ].filter(Boolean);
    return lines.join(" | ");
  }

  report() {
    return this.lastReport || "(no steps yet)";
  }

  status() {
    const metrics = computeMetrics({
      workspace: this.workspace,
      selfModel: this.selfModel,
      lastReport: this.lastReport,
      prevReport: this.prevReport,
      activeGoal: this.activeGoal
    });
    return {
      selfModel: this.selfModel.snapshot(),
      workspace: this.workspace.snapshot().map(e => ({
        id: e.id,
        priority: e.priority,
        source: e.source,
        content: e.content.slice(0, 100)
      })),
      metrics,
      lastReport: this.lastReport
    };
  }
}
