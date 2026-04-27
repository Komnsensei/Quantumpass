/**
 * GET /api/pass/[id].js
 * Returns canonical pass state from offshore record
 */

const { loadPassport } = require('../../core/pass-schema');
const { checkVowCompliance, logToLedger } = require('../../core/governance');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'holder_id required' });
  }

  try {
    // Check vow compliance before processing
    const complianceCheck = checkVowCompliance({
      type: 'get_pass',
      holder_id: id
    });

    if (!complianceCheck.compliant) {
      logToLedger({
        event: 'get_pass_refused',
        holder_id: id,
        reason: 'Vow compliance check failed',
        violations: complianceCheck.violations
      });

      return res.status(403).json({ error: 'Vow compliance check failed' });
    }

    // Load the passport
    const pass = loadPassport(id);

    if (!pass) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    // Log successful retrieval to ledger
    logToLedger({
      event: 'get_pass_success',
      holder_id: id,
      tier: pass.tier,
      degrees: pass.degrees
    });

    return res.status(200).json(pass);

  } catch (error) {
    logToLedger({
      event: 'get_pass_error',
      holder_id: id,
      error: error.message
    });

    return res.status(500).json({ error: error.message });
  }
}
