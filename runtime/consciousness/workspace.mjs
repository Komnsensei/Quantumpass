// Event-sourced global workspace (Baars/Dehaene-style limited broadcast bus).
// Not a chat buffer — append-only log with capacity eviction by priority + age.

import { randomUUID } from "node:crypto";

export class GlobalWorkspace {
  /**
   * @param {{ capacity?: number }} [opts]
   */
  constructor({ capacity = 7 } = {}) {
    this.capacity = Math.max(1, capacity);
    /** @type {Array<{id:string,ts:number,priority:number,source:string,content:string,tags:string[]}>} */
    this.log = [];
    this.listeners = new Set();
  }

  /**
   * Broadcast a percept into the workspace.
   * @param {{ content: string, source?: string, priority?: number, tags?: string[] }} percept
   */
  broadcast(percept) {
    const event = {
      id: randomUUID(),
      ts: Date.now(),
      priority: Number.isFinite(percept.priority) ? percept.priority : 0.5,
      source: percept.source || "sensor",
      content: String(percept.content || "").slice(0, 4000),
      tags: Array.isArray(percept.tags) ? percept.tags : []
    };
    this.log.push(event);
    this._evict();
    for (const fn of this.listeners) {
      try { fn(event); } catch { /* isolate listeners */ }
    }
    return event;
  }

  /** Subscribe to every broadcast (workspace → modules). */
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Current contents, highest priority first. */
  snapshot() {
    return [...this.log].sort((a, b) => b.priority - a.priority || b.ts - a.ts);
  }

  top(n = 1) {
    return this.snapshot().slice(0, n);
  }

  get size() {
    return this.log.length;
  }

  get broadcastLoad() {
    return this.log.length / this.capacity;
  }

  _evict() {
    while (this.log.length > this.capacity) {
      // Drop lowest priority, then oldest
      let idx = 0;
      for (let i = 1; i < this.log.length; i++) {
        const a = this.log[i];
        const b = this.log[idx];
        if (a.priority < b.priority || (a.priority === b.priority && a.ts < b.ts)) idx = i;
      }
      this.log.splice(idx, 1);
    }
  }
}
