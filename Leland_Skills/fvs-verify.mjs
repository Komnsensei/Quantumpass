import { createHash } from "crypto";
import { readFileSync } from "fs";
export const skill = {
  id: "fvs-verify",
  name: "FVSMB Engine Verify",
  execute: async (file, expectedSha) => {
    const actual = createHash("sha256").update(readFileSync(file)).digest("hex");
    return actual === expectedSha
      ? `PASS ${file}`
      : `FAIL ${file} (${actual.slice(0, 12)} != ${String(expectedSha).slice(0, 12)})`;
  }
};
export const apply = () => "FVS verify loaded.";