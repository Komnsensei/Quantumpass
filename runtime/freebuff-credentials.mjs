// runtime/freebuff-credentials.mjs
// Load auth from Freebuff/Codebuff CLI login files (never hardcode tokens).

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CANDIDATES = [
  join(homedir(), ".config", "manicode", "credentials.json"),
  join(homedir(), ".config", "codebuff", "credentials.json")
];

/**
 * @returns {{ authToken: string, fingerprintId?: string, email?: string, name?: string, path: string } | null}
 */
export function loadFreebuffCredentials() {
  for (const path of CANDIDATES) {
    try {
      if (!existsSync(path)) continue;
      const raw = JSON.parse(readFileSync(path, "utf8"));
      const entry = raw.default || raw;
      const authToken = entry.authToken || entry.token || entry.apiKey || "";
      if (!authToken) continue;
      return {
        authToken,
        fingerprintId: entry.fingerprintId || null,
        email: entry.email || null,
        name: entry.name || null,
        path
      };
    } catch {
      /* try next */
    }
  }
  // Env fallbacks
  const envToken =
    process.env.FREEBUFF_TOKEN ||
    process.env.CODEBUFF_API_KEY ||
    process.env.MANICODE_API_KEY ||
    "";
  if (envToken) {
    return { authToken: envToken, path: "env" };
  }
  return null;
}

export function freebuffCredentialsPath() {
  for (const path of CANDIDATES) {
    if (existsSync(path)) return path;
  }
  return CANDIDATES[0];
}
