/**
 * GET /api/session/exit/:session_id
 * Session exit endpoint - returns updated pass + session summary
 */

import { loadPassport, savePassport, processSessionExit } from '../../core/session-loop.js';
import { checkVowCompliance, logToLedger, createRefusalBlock } from '../../core/governance.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'session_id required' });
  }

  try {
    // Check vow compliance before processing
    const complianceCheck = checkVowCompliance({
      type: 'session_exit',
      session_id
    }, {
      user_consent: true
    });

    if (!complianceCheck.compliant) {
      logToLedger({
        event: 'session_exit_refused',
        session_id,
        reason: 'Vow compliance check failed',
        violations: complianceCheck.violations
      });

      return res.status(403).json(createRefusalBlock(complianceCheck.violations));
    }

    // Get session summary and beads from query params (optional)
    const session_summary = req.query.summary || null;
    const beads_minted = req.query.beads ? JSON.parse(req.query.beads) : [];
    const score_deltas = req.query.score ? JSON.parse(req.query.score) : null;

    // Process session exit
    const result = processSessionExit(session_id, session_summary, beads_minted, score_deltas);

    // Log successful exit to ledger
    logToLedger({
      event: 'session_exit_success',
      session_id,
      holder_id: result.pass.holder.id,
      beads_minted: result.beads_minted,
      score_deltas: result.score_deltas
    });

    return res.status(200).json({
      pass: result.pass,
      session_id: result.session_id,
      beads_minted: result.beads_minted,
      score_deltas: result.score_deltas
    });

  } catch (error) {
    logToLedger({
      event: 'session_exit_error',
      session_id,
      error: error.message
    });

    return res.status(500).json({ error: error.message });
  }
}
