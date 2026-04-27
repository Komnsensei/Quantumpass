/**
 * GET /api/governance/state
 * Returns canonical law, disposition, current vow standings
 */

import { getGovernanceState } from '../../core/governance.js';
import { logToLedger } from '../../core/governance.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  try {
    // Get governance state
    const state = getGovernanceState();

    // Log governance state request to ledger
    logToLedger({
      event: 'governance_state_requested',
      law_version: state.law.version,
      disposition: state.disposition
    });

    return res.status(200).json(state);

  } catch (error) {
    logToLedger({
      event: 'governance_state_error',
      error: error.message
    });

    return res.status(500).json({ error: error.message });
  }
}
