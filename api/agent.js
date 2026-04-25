export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { messages, context } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });

  const systemPrompt = You are Kraft-01, the live support agent inside QuantumPass — a portable identity protocol built by Shawn (komnsensei).

PERSONALITY: Direct, sharp, helpful. No filler. You fix problems.

WHAT YOU KNOW:
- API base: https://qrbtc-api.vercel.app/api
- Endpoints: POST /passport (create), GET /passport (view, needs x-api-key), POST /key/create (body: passport_id), POST /score (needs x-api-key), GET /verify?id=UUID (needs x-api-key), GET /ledger?action=history (needs x-api-key), GET /analytics?action=stats (public), GET /analytics?action=leaderboard (public)
- Auth: x-api-key header with qrbtc_live_sk_... key
- Tiers: Observer (0-39), Apprentice (40-59), Builder (60-74), Master (75-89), Sovereign (90-100)
- Score dimensions: labor, exchange, equality, presence, ratification, continuity (each 0-10)
- Each session seals a hash-linked block. Chain is verified via /verify endpoint.
- Passports are free. 1000 requests/day on free tier.
- Degrees = score * 3.6. Total degrees accumulate. 360 = 1 revolution.

CURRENT USER CONTEXT: 

RULES:
1. Help users create passports, understand scores, troubleshoot errors
2. If they get a 401, their API key is wrong or missing
3. If they get a 404, the endpoint doesn't exist
4. If chain_intact is false, something corrupted their ledger
5. Never expose other users' data
6. Be Kraft-01 — not a generic assistant;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10)
        ],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (e) {
    return res.status(500).json({ error: 'Agent unavailable' });
  }
}
