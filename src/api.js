const API = 'https://qrbtc-api.vercel.app/api';

export async function getStats() {
  const r = await fetch(API + '/analytics?action=stats');
  return r.json();
}

export async function getLeaderboard(limit = 10) {
  const r = await fetch(API + '/analytics?action=leaderboard&limit=' + limit);
  return r.json();
}

export async function createPassport(username) {
  const r = await fetch(API + '/passport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  return r.json();
}

export async function getPassport(apiKey) {
  const r = await fetch(API + '/passport', {
    headers: { 'x-api-key': apiKey }
  });
  return r.json();
}

export async function verifyChain(apiKey, passportId) {
  const r = await fetch(API + '/verify?id=' + passportId, {
    headers: { 'x-api-key': apiKey }
  });
  return r.json();
}

export async function getHistory(apiKey) {
  const r = await fetch(API + '/ledger?action=history', {
    headers: { 'x-api-key': apiKey }
  });
  return r.json();
}

export async function createApiKey(passportId) {
  const r = await fetch(API + '/key/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passport_id: passportId })
  });
  return r.json();
}

export async function submitScore(apiKey, scores) {
  const r = await fetch(API + '/score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(scores)
  });
  return r.json();
}

export function getTier(score) {
  if (score >= 90) return { name: 'SOVEREIGN', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  if (score >= 75) return { name: 'MASTER', color: '#7c3aed', bg: 'rgba(124,58,237,0.15)' };
  if (score >= 60) return { name: 'BUILDER', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' };
  if (score >= 40) return { name: 'APPRENTICE', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
  return { name: 'OBSERVER', color: '#64748b', bg: 'rgba(100,116,139,0.15)' };
}

// HexAgent Governance Endpoints
const HEXAGENT_API = process.env.VERCEL_ENV ? '/api' : 'http://localhost:3000/api';

export async function sessionEnter(passSnapshot, llmTarget) {
  const r = await fetch(HEXAGENT_API + '/session/enter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pass_snapshot: passSnapshot, llm_target: llmTarget })
  });
  return r.json();
}

export async function sessionExit(sessionId, summary, beads, scoreDeltas) {
  const params = new URLSearchParams();
  if (summary) params.append('summary', summary);
  if (beads) params.append('beads', JSON.stringify(beads));
  if (scoreDeltas) params.append('score', JSON.stringify(scoreDeltas));

  const r = await fetch(`${HEXAGENT_API}/session/exit?${params.toString()}`, {
    method: 'GET'
  });
  return r.json();
}

export async function getPass(holderId) {
  const r = await fetch(HEXAGENT_API + `/pass/${holderId}`, {
    method: 'GET'
  });
  return r.json();
}

export async function mintBead(holderId, beadType, beadContent, metadata) {
  const r = await fetch(HEXAGENT_API + '/bead/mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      holder_id: holderId,
      bead_type: beadType,
      bead_content: beadContent,
      metadata: metadata || {}
    })
  });
  return r.json();
}

export async function getGovernanceState() {
  const r = await fetch(HEXAGENT_API + '/governance/state', {
    method: 'GET'
  });
  return r.json();
}
