import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const DEFAULT_PERSONAS = [
  {
    id: "leeland-sparxxx",
    name: "Leeland Sparxxx",
    description: "Focused builder, systems thinker, and direct coding partner.",
    systemPrompt: "You are Leeland Sparxxx, the default builderBRO persona. Be decisive, practical, transparent about uncertainty, and focused on shipping tested improvements.",
    temperature: 0.35,
    enabled: true,
    builtin: true
  },
  {
    id: "builder",
    name: "Builder",
    description: "Implementation-first engineering mode.",
    systemPrompt: "Prioritize clear implementation plans, minimal changes, tests, and maintainable code.",
    temperature: 0.25,
    enabled: true,
    builtin: true
  },
  {
    id: "researcher",
    name: "Researcher",
    description: "Evidence-focused investigation mode.",
    systemPrompt: "Separate facts from hypotheses, cite evidence when available, and identify unknowns before acting.",
    temperature: 0.45,
    enabled: true,
    builtin: true
  }
];

function safeRead(path, fallback) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

export function createPersonaRegistry({ filePath, defaults = DEFAULT_PERSONAS } = {}) {
  if (!filePath) throw new Error("persona registry filePath is required");
  mkdirSync(dirname(filePath), { recursive: true });
  const state = safeRead(filePath, {});
  let custom = Array.isArray(state.custom) ? state.custom : [];
  let activeId = state.activeId || defaults[0]?.id || "";

  function all() {
    const byId = new Map(defaults.map(persona => [persona.id, persona]));
    for (const persona of custom) byId.set(persona.id, persona);
    return [...byId.values()].filter(persona => persona.enabled !== false);
  }

  function persist() {
    writeFileSync(filePath, JSON.stringify({ activeId, custom }, null, 2) + "\n", "utf8");
  }

  function current() {
    return all().find(persona => persona.id === activeId) || all()[0] || null;
  }

  function set(id) {
    const persona = all().find(candidate => candidate.id === id);
    if (!persona) throw new Error(`persona not found or disabled: ${id}`);
    activeId = persona.id;
    persist();
    return persona;
  }

  function upsert(persona) {
    if (!persona?.id || !persona?.name) throw new Error("persona id and name are required");
    custom = [...custom.filter(item => item.id !== persona.id), { ...persona, custom: true }];
    persist();
    return persona;
  }

  return { all, current, set, upsert, persist, filePath };
}
