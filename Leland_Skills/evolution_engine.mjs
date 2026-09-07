import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
export const skill = {
  id: "evolution-engine",
  name: "Evolution Engine",
  execute: async (dir = "Leland_Skills") => {
    const files = readdirSync(dir).filter((f) => f.endsWith(".mjs"));
    return files.map((f) => {
      const src = readFileSync(join(dir, f), "utf8");
      return {
        file: f,
        sha: createHash("sha256").update(src).digest("hex").slice(0, 12),
        bytes: Buffer.byteLength(src)
      };
    });
  }
};
export const apply = () => "Evolution engine loaded.";