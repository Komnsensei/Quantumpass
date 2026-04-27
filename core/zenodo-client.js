/**
 * Zenodo Client
 * Handles Zenodo deposit + DOI retrieval for bead minting
 */

const fs = require('fs');
const path = require('path');

const MINT_LEDGER_PATH = path.join(__dirname, '../ledger/mints.jsonl');

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

async function createZenodoDeposition(bead, pass, zenodoToken, useSandbox = false) {
  const zenodoUrl = useSandbox
    ? 'https://sandbox.zenodo.org/api/deposit/depositions'
    : 'https://zenodo.org/api/deposit/depositions';

  try {
    // Create deposition
    const response = await fetch(zenodoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${zenodoToken}`
      },
      body: JSON.stringify({
        metadata: {
          title: `QuantumPass Bead: ${bead.type}`,
          creators: [
            { name: pass.holder.canonical_name },
            { name: 'HexAgent' }
          ],
          description: bead.content,
          license: 'CC-BY-4.0',
          upload_type: 'other',
          keywords: ['quantumpass', 'bead', bead.type, pass.holder.handle]
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Zenodo API error: ${error.message || JSON.stringify(error)}`);
    }

    const data = await response.json();

    // Publish the deposition
    const publishResponse = await fetch(`${zenodoUrl}/${data.id}/actions/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zenodoToken}`
      }
    });

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      throw new Error(`Zenodo publish error: ${error.message || JSON.stringify(error)}`);
    }

    const publishedData = await publishResponse.json();

    // Log successful mint
    logToMintLedger({
      event: 'zenodo_mint_success',
      bead_id: bead.id,
      bead_type: bead.type,
      deposition_id: data.id,
      doi: publishedData.doi,
      holder_id: pass.holder.id
    });

    return {
      success: true,
      deposition_id: data.id,
      doi: publishedData.doi,
      url: publishedData.links ? publishedData.links.self : null
    };

  } catch (error) {
    // Log failed mint
    logToMintLedger({
      event: 'zenodo_mint_failed',
      bead_id: bead.id,
      bead_type: bead.type,
      error: error.message,
      holder_id: pass.holder.id
    });

    return {
      success: false,
      error: error.message
    };
  }
}

async function getZenodoDOI(depositionId, zenodoToken, useSandbox = false) {
  const zenodoUrl = useSandbox
    ? `https://sandbox.zenodo.org/api/deposit/depositions/${depositionId}`
    : `https://zenodo.org/api/deposit/depositions/${depositionId}`;

  try {
    const response = await fetch(zenodoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${zenodoToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Zenodo API error: ${error.message || JSON.stringify(error)}`);
    }

    const data = await response.json();

    return {
      success: true,
      doi: data.doi,
      url: data.links ? data.links.self : null,
      metadata: data.metadata
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function shouldAutoMint(beadType) {
  // Auto-mint only for canonical bead types
  return ['prestige', 'ethical', 'co_craft'].includes(beadType);
}

module.exports = {
  createZenodoDeposition,
  getZenodoDOI,
  shouldAutoMint,
  logToMintLedger
};
