import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { createActionBudget, withRetry } from "./autonomy-controls.mjs";

export function createTaskSupervisor({ filePath, execute, onEvent = () => {}, maxActions = 20, maxFailures = 5, retries = 2 } = {}) {
  if (typeof execute !== "function") throw new Error("task supervisor requires execute");
  let tasks = load();
  let active = null;
  let cancelled = false;

  function load() {
    try { const data = JSON.parse(readFileSync(filePath, "utf8")); return Array.isArray(data) ? data : []; }
    catch { return []; }
  }
  function save() {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(tasks, null, 2) + "\n", "utf8");
  }
  function emit(type, data = {}) { onEvent({ type, timestamp: new Date().toISOString(), ...data }); }
  function add(input) {
    const task = { id: randomUUID(), input: String(input), status: "queued", createdAt: Date.now(), attempts: 0 };
    tasks.push(task); save(); return task;
  }
  function cancel() { cancelled = true; if (active?.controller) active.controller.abort("task cancelled"); }
  async function runNext() {
    if (active) return { status: "busy", task: active.task };
    const task = tasks.find(item => item.status === "queued");
    if (!task) return null;
    cancelled = false;
    const controller = new AbortController();
    const budget = createActionBudget({ maxActions, maxFailures });
    active = { task, controller };
    task.status = "running"; task.startedAt = Date.now(); save();
    emit("task_started", { taskId: task.id, input: task.input });
    try {
      const result = await withRetry(({ signal }) => execute(task.input, { signal, task, budget }), {
        signal: controller.signal,
        retries,
        budget,
        onRetry: detail => emit("retry", { taskId: task.id, attempt: detail.attempt, delay: detail.delay, error: detail.error.message })
      });
      task.status = "completed"; task.result = result; task.completedAt = Date.now();
      emit("task_completed", { taskId: task.id, result });
      return task;
    } catch (error) {
      task.status = controller.signal.aborted || cancelled ? "cancelled" : "failed";
      task.error = { code: error.code || "TASK_FAILED", message: error.message };
      emit("task_failed", { taskId: task.id, error: task.error });
      return task;
    } finally {
      save(); active = null;
    }
  }
  return { add, cancel, runNext, list: () => tasks.map(task => ({ ...task })), status: () => ({ active: active?.task?.id || null, queued: tasks.filter(task => task.status === "queued").length }) };
}
