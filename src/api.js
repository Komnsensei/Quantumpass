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
