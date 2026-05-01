/**
 * qrBTC client bridge for QuantumPass scoring.
 * Safe default: if QRBTC_API_URL is unset or unreachable, return null and let
 * api/score.js fall back or return a controlled service-unavailable response.
 */

export const qrbtc = {
  async submitScore(payload, apiKey) {
    const baseUrl = process.env.QRBTC_API_URL;

    if (!baseUrl) {
      console.warn('[qrbtc] QRBTC_API_URL unset; skipping remote score submit');
      return null;
    }

    const url = `${baseUrl.replace(/\/$/, '')}/score`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn('[qrbtc] score submit failed', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn('[qrbtc] score submit error', error.message);
      return null;
    }
  }
};