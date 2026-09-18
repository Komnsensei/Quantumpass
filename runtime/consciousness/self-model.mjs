// Persistent higher-order self-model (HOT / Attention Schema style).
// Beliefs about goals, errors, focus — stored under ~/.bro/consciousness/

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

function defaultPath() {
  return join(homedir(), ".bro", "consciousness", "self-model.json");
}

export class SelfModel {
  constructor({ path = defaultPath() } = {}) {
    this.path = path;
    this.state = {
      goal: null,
      focus: null,
      lastError: null,
      beliefs: {},
      updatedAt: null,
      stepCount: 0
    };
    this._load();
  }

  _load() {
    try {
      if (existsSync(this.path)) {
        this.state = { ...this.state, ...JSON.parse(readFileSync(this.path, "utf8")) };
      }
    } catch {
      /* start clean */
    }
  }

  _save() {
    const dir = join(homedir(), ".bro", "consciousness");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    this.state.updatedAt = new Date().toISOString();
    writeFileSync(this.path, JSON.stringify(this.state, null, 2));
  }

  setGoal(goal) {
    this.state.goal = goal;
    this._save();
  }

  setFocus(focus) {
    this.state.focus = focus;
    this._save();
  }

  recordError(err) {
    this.state.lastError = String(err || "").slice(0, 500);
    this._save();
  }

  believe(key, value) {
    this.state.beliefs[key] = value;
    this._save();
  }

  tick() {
    this.state.stepCount = (this.state.stepCount || 0) + 1;
    this._save();
  }

  snapshot() {
    return { ...this.state, beliefs: { ...this.state.beliefs } };
  }

  /**
   * Higher-order accuracy proxy: does stored goal match the active goal argument?
   */
  goalAccuracy(activeGoal) {
    if (!this.state.goal && !activeGoal) return 1;
    if (!this.state.goal || !activeGoal) return 0;
    return this.state.goal === activeGoal ? 1 : 0;
  }
}
