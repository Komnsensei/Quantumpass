import { existsSync, readFileSync, writeFileSync } from "node:fs";

export function createLegacyPersonaAdapter({ registry, filePath } = {}) {
  if (!registry || !filePath) throw new Error("registry and filePath are required");

  function load() {
    if (!existsSync(filePath)) return;
    try {
      const entries = readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
      for (const entry of entries) registry.upsert({
        ...entry,
        description: entry.description || entry.desc || "",
        systemPrompt: entry.systemPrompt || "",
        temperature: Number.isFinite(entry.temperature) ? entry.temperature : 0.5,
        enabled: entry.enabled !== false
      });
    } catch { /* preserve legacy behavior: malformed entries are ignored */ }
  }

  function save() {
    const custom = registry.all().filter(persona => persona.custom);
    writeFileSync(filePath, custom.map(persona => JSON.stringify({
      ...persona,
      desc: persona.description || persona.desc || "",
      custom: true
    })).join("\n") + (custom.length ? "\n" : ""), "utf8");
  }

  return { load, save };
}
