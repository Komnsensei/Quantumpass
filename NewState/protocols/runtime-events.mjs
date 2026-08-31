export const RUNTIME_EVENTS = Object.freeze([
  "started",
  "thinking",
  "progress",
  "tool",
  "question",
  "paused",
  "resumed",
  "persona",
  "autonomy",
  "completed",
  "error"
]);

export function isRuntimeEvent(event) {
  return Boolean(event && RUNTIME_EVENTS.includes(event.type));
}
