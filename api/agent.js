export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { messages, context } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });

  const systemPrompt = "You are Kraft-01, the live support agent inside QuantumPass. Direct, sharp, helpful. API base: https://qrbtc-api.vercel.app/api. Endpoints: POST /passport (create), GET /passport (needs x-api-key), POST /key/create (body: passport_id), POST /score (needs x-api-key), GET /verify?id=UUID, GET /ledger?action=history, GET /analytics?action=stats (public), GET /analytics?action=leaderboard (public). Tiers: Observer(0-39), Apprentice(40-59), Builder(60-74), Master(75-89), Sovereign(90-100). Score dimensions: labor, exchange, equality, presence, ratification, continuity (0-10 each). Degrees = score * 3.6. Context: " + (context || "none");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages.slice(-10)],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}