import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { qrbtc } from '../core/qrbtc-client.js';
import { logToLedger } from '../core/governance.js';
import { requireApiKey, setCors } from './_lib/auth.js';

const DIMS = ['labor','exchange','equality','presence','ratification','continuity'];

function readLocalPassport(holder_id) {
  const safeId = String(holder_id || '').replace(/[^a-zA-Z0-9_.-]/g, '');
  const file = join(process.cwd(), 'passes', `${safeId}.json`);

  if (!existsSync(file)) return null;

  return JSON.parse(readFileSync(file, 'utf8'));
}

function buildLocalScoreResult(holder_id, body) {
  const passport = readLocalPassport(holder_id);
  if (!passport) return null;

  const dimensions = {};
  let submitted_score = 0;
  let submitted_count = 0;

  for (const d of DIMS) {
    if (typeof body[d] === 'number') {
      dimensions[d] = body[d];
      submitted_score += body[d];
      submitted_count++;
    }
  }

  return {
    ok: true,
    source: 'local_passport_fallback',
    holder_id,
    score: submitted_count ? submitted_score : null,
    dimensions,
    degrees_total: passport.degrees,
    degrees_delta: 0,
    tier: passport.tier,
    tier_changed: false,
    vow_standing: passport.vow_standing,
    archive_anchor: passport.archive_anchor,
    passport: {
      holder: passport.holder,
      tier: passport.tier,
      degrees: passport.degrees,
      vow_standing: passport.vow_standing,
      updated_at: passport.updated_at
    }
  };
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!requireApiKey(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { holder_id, session_id, api_key } = req.body || {};

  if (!holder_id) return res.status(400).json({ error: 'holder_id required' });
  if (!api_key) return res.status(400).json({ error: 'api_key required' });

  const scorePayload = { holder_id };

  for (const d of DIMS) {
    if (typeof req.body[d] === 'number') {
      scorePayload[d] = req.body[d];
    }
  }

  let result = null;

  try {
    result = await qrbtc.submitScore(scorePayload, api_key);
  } catch (err) {
    result = null;
  }

  if (!result) {
    const localResult = buildLocalScoreResult(holder_id, req.body || {});

    if (localResult && process.env.NODE_ENV !== 'production') {
      logToLedger({
        event: 'score_submitted_local_fallback',
        holder_id,
        session_id: session_id || null,
        result: {
          score: localResult.score,
          degrees_delta: localResult.degrees_delta,
          tier: localResult.tier,
          tier_changed: localResult.tier_changed,
          source: localResult.source
        }
      });

      return res.status(200).json(localResult);
    }

    logToLedger({
      event: 'score_submitted_qrbtc_failed',
      holder_id,
      session_id: session_id || null,
      error: 'qrbtc-api unreachable'
    });

    return res.status(502).json({ error: 'Scoring service unavailable' });
  }

  logToLedger({
    event: 'score_submitted',
    holder_id,
    session_id: session_id || null,
    result: {
      score: result.score,
      degrees_delta: result.degrees_delta,
      tier: result.tier,
      tier_changed: result.tier_changed
    }
  });

  return res.status(200).json(result);
}
