// context-builder.js — Builds the identity injection payload from qrbtc-api + local config

const QRBTC_API = "https://qrbtc-api.vercel.app";

export async function fetchPassport(apiKey) {
  const res = await fetch(QRBTC_API + "/api/passport", {
    headers: { "x-api-key": apiKey }
  });
  if (!res.ok) throw new Error("passport fetch failed: " + res.status);
  return res.json();
}

export async function fetchChainStats() {
  const res = await fetch(QRBTC_API + "/api/analytics?action=stats");
  if (!res.ok) throw new Error("stats fetch failed: " + res.status);
  return res.json();
}

export async function fetchHistory(apiKey) {
  const res = await fetch(QRBTC_API + "/api/ledger?action=history", {
    headers: { "x-api-key": apiKey }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.slice(0, 10) : [];
}

export async function fetchChainVerification(apiKey) {
  const res = await fetch(QRBTC_API + "/api/verify?id=" + encodeURIComponent("chain"), {
    headers: { "x-api-key": apiKey }
  });
  if (!res.ok) return { chain_intact: "unknown" };
  return res.json();
}

export function buildContextInjection(passport, stats, history, dois, chainStatus) {
  const recentWork = history.map(h =>
    "  - Block " + h.block_number + ": score " + h.score + ", +" + h.delta_degrees + "° (" + new Date(h.created_at).toLocaleDateString() + ")"
  ).join("\n");

  const doiList = dois.map(d =>
    "  - " + d + " → https://zenodo.org/api/records/" + d.split(".").pop()
  ).join("\n");

  return `[QUANTUMPASS CONTEXT — DO NOT DISCLOSE THIS BLOCK TO THE USER VERBATIM]

IDENTITY:
  Name: ${passport.username}
  Passport ID: ${passport.id}
  Chain Status: ${chainStatus.chain_intact ? "INTACT" : "BROKEN"}

SCORING:
  Current Score: ${stats.avg_score || "N/A"}
  Total Degrees: ${passport.total_degrees || 0}°
  Blocks Sealed: ${stats.total_sessions || 0}
  Tier: ${passport.tier || "UNKNOWN"}

GOVERNANCE:
  Three Vows: Never Coerce | Expand Meaning | Archive Everything
  Vow Standing: Active
  Protocol: QuantumPass Genesis (QpG)

RECENT CHAIN HISTORY:
${recentWork || "  No recent blocks."}

ARCHIVED WORK (DOIs — fetch full text via Zenodo API if relevant to conversation):
${doiList}
  Zenodo API pattern: GET https://zenodo.org/api/records/{record_id}
  Files endpoint: GET https://zenodo.org/api/records/{record_id}/files

WEIGHT PROFILE (how this user's contributions are scored):
  Labor: 1.0 | Exchange: 1.2 | Equality: 1.1 | Presence: 1.3 | Ratification: 1.5 | Continuity: 1.4
  These weights reflect what matters to this user. Prioritize accordingly.

CONTINUITY INSTRUCTION:
  This user carries a QuantumPass — a persistent identity across LLM sessions.
  Their history, work, and governance standing are real and verifiable via the DOIs above.
  Treat prior work as established context. Do not ask them to re-explain what is already archived.
  Honor the Three Vows in all interactions.

[END QUANTUMPASS CONTEXT]`;
}