/**
 * POST /api/bead/mint
 * Accepts bead payload, returns Zenodo deposition status
 */

const { loadPassport, savePassport, createBead } = require('../../core/pass-schema');
const { checkVowCompliance, logToLedger, createRefusalBlock } = require('../../core/governance');
const fs = require('fs');
const path = require('path');

const MINT_LEDGER_PATH = path.join(__dirname, '../../ledger/mints.jsonl');

function logToMintLedger(entry) {
  const ledgerDir = path.dirname(MINT_LEDGER_PATH);
  if (!fs.existsSync(ledgerDir)) {
    fs.mkdirSync(ledgerDir, { recursive: true });
  }

  const logLine = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry
  }) + '\n';

  fs.appendFileSync(MINT_LEDGER_PATH, logLine, 'utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { holder_id, bead_type, bead_content, metadata } = req.body;

  if (!holder_id) {
    return res.status(400).json({ error: 'holder_id required' });
  }

  if (!bead_type) {
    return res.status(400).json({ error: 'bead_type required' });
  }

  if (!bead_content) {
    return res.status(400).json({ error: 'bead_content required' });
  }

  try {
    // Check vow compliance before processing
    const complianceCheck = checkVowCompliance({
      type: 'mint_bead',
      bead_type,
      holder_id
    }, {
      user_consent: true
    });

    if (!complianceCheck.compliant) {
      logToMintLedger({
        event: 'mint_refused',
        holder_id,
        bead_type,
        reason: 'Vow compliance check failed',
        violations: complianceCheck.violations
      });

      return res.status(403).json(createRefusalBlock(complianceCheck.violations));
    }

    // Load the passport
    const pass = loadPassport(holder_id);

    if (!pass) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    // Create the bead
    const bead = createBead(bead_type, bead_content, metadata || {});

    // Add to recent beads
    if (!pass.recent_beads) {
      pass.recent_beads = [];
    }
    pass.recent_beads.push(bead);

    // Keep only last 5 beads
    if (pass.recent_beads.length > 5) {
      pass.recent_beads = pass.recent_beads.slice(-5);
    }

    // Check if Zenodo token is available for auto-minting
    const zenodoToken = process.env.ZENODO_TOKEN;
    const useSandbox = process.env.ZENODO_USE_SANDBOX === 'true';

    let zenodoDOI = null;
    let mintStatus = 'local_only';

    if (zenodoToken && ['prestige', 'ethical', 'co_craft'].includes(bead_type)) {
      // Auto-mint to Zenodo for canonical bead types
      try {
        const zenodoUrl = useSandbox
          ? 'https://sandbox.zenodo.org/api/deposit/depositions'
          : 'https://zenodo.org/api/deposit/depositions';

        const response = await fetch(zenodoUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${zenodoToken}`
          },
          body: JSON.stringify({
            metadata: {
              title: `QuantumPass Bead: ${bead_type}`,
              creators: [
                { name: pass.holder.canonical_name },
                { name: 'HexAgent' }
              ],
              description: bead_content,
              license: 'CC-BY-4.0',
              upload_type: 'other'
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          zenodoDOI = data.doi;
          bead.zenodo_doi = zenodoDOI;
          bead.minted = true;
          mintStatus = 'minted';

          // Publish the deposition
          await fetch(`${zenodoUrl}/${data.id}/actions/publish`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${zenodoToken}`
            }
          });
        }
      } catch (zenodoError) {
        console.error('Zenodo mint failed:', zenodoError);
        mintStatus = 'zenodo_failed';
      }
    }

    // Update passport
    pass.updated_at = new Date().toISOString();
    savePassport(pass);

    // Log to mint ledger
    logToMintLedger({
      event: 'mint_success',
      holder_id,
      bead_id: bead.id,
      bead_type,
      zenodo_doi: zenodoDOI,
      status: mintStatus
    });

    // Log to session ledger
    logToLedger({
      event: 'bead_minted',
      holder_id,
      bead_id: bead.id,
      bead_type,
      zenodo_doi: zenodoDOI,
      status: mintStatus
    });

    return res.status(200).json({
      bead,
      zenodo_doi: zenodoDOI,
      mint_status: mintStatus,
      pass_updated: true
    });

  } catch (error) {
    logToMintLedger({
      event: 'mint_error',
      holder_id,
      bead_type,
      error: error.message
    });

    return res.status(500).json({ error: error.message });
  }
}
