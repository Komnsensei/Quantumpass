import { readdirSync, statSync } from "fs";
import { join } from "path";
export const skill = {
  id: "deep-recon",
  name: "Deep Recon",
  execute: async (root = ".") => {
    const walk = (dir) =>
      readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : [full];
      });
    return walk(root);
  }
};
export const apply = () => "Deep recon loaded.";