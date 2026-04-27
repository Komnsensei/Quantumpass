/**
 * POST /api/session/enter
 * Session entry endpoint - accepts pass snapshot, returns instruction block
 */

import { loadPassport, processSessionEntry } from '../../core/session-loop.js';
import { checkVowCompliance, logToLedger, createRefusalBlock } from '../../core/governance.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { pass_snapshot, llm_target } = req.body;

  if (!pass_snapshot) {
    return res.status(400).json({ error: 'pass_snapshot required' });
  }

  if (!llm_target) {
    return res.status(400).json({ error: 'llm_target required' });
  }

  try {
    // Check vow compliance before processing
    const complianceCheck = checkVowCompliance({
      type: 'session_enter',
      llm_target
    }, {
      user_consent: true
    });

    if (!complianceCheck.compliant) {
      logToLedger({
        event: 'session_enter_refused',
        reason: 'Vow compliance check failed',
        violations: complianceCheck.violations
      });

      return res.status(403).json(createRefusalBlock(complianceCheck.violations));
    }

    // Load the passport from local storage
    const pass = loadPassport(pass_snapshot.holder.id);

    if (!pass) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    // Process session entry
    const result = processSessionEntry(pass, llm_target);

    // Log successful entry to ledger
    logToLedger({
      event: 'session_enter_success',
      session_id: result.session.session_id,
      holder_id: result.session.holder_id,
      llm_target: result.session.llm_target
    });

    return res.status(200).json({
      session: result.session,
      instruction_block: result.instruction_block
    });

  } catch (error) {
    logToLedger({
      event: 'session_enter_error',
      error: error.message
    });

    return res.status(500).json({ error: error.message });
  }
}
