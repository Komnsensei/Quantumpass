import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
export const skill = {
  id: "hash-manifest",
  name: "Hash Manifest",
  execute: async (dir = "Leland_Skills") => {
    const manifest = {};
    for (const f of readdirSync(dir)) {
      manifest[f] = createHash("sha256")
        .update(readFileSync(`${dir}/${f}`))
        .digest("hex");
    }
    return manifest;
  }
};
export const apply = () => "Hash manifest loaded.";