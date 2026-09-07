import { readdirSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));

export const skill = {
  id: "repair-gate",
  name: "Repair Gate",
  execute: async (dir = HERE) => {
    const report = [];
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".mjs"))) {
      try {
        const mod = await import(`./${f}`);
        report.push({ file: f, status: mod.skill ? "ok" : "missing skill export" });
      } catch (e) {
        report.push({ file: f, status: `broken: ${e.message.split("\n")[0]}` });
      }
    }
    return report;
  }
};
export const apply = () => "Repair gate loaded.";