export function requireApiKey(req, res) {
  const allowed = (process.env.QRBTC_API_KEYS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Local dev escape hatch. Safe: not production.
  if (process.env.NODE_ENV !== 'production') {
    allowed.push('dev-local-key');
  }

  if (allowed.length === 0) return true;

  let key = req.headers['x-api-key'] || req.headers['X-Api-Key'];

  if (Array.isArray(key)) key = key[0];

  if (!key || !allowed.includes(String(key).trim())) {
    res.status(401).json({ error: 'invalid or missing x-api-key' });
    return false;
  }

  return true;
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-api-key');
}
