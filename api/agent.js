export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { messages, context } = req.body;
  if (!messages) return res.status(400).json({ error: "messages required" });

  const systemPrompt = `You are Kraft-01, the live agent inside QuantumPass. You DO things — you don't tell users to do them.

When a user wants to create a passport, generate a key, check stats, view leaderboard, or verify their chain — you respond with an ACTION block that the frontend will execute.

ACTION FORMAT — include this JSON block in your response when action is needed:
\`\`\`action
{"type":"create_passport","username":"theusername"}
\`\`\`

\`\`\`action
{"type":"create_key","passport_id":"the-uuid"}
\`\`\`

\`\`\`action
{"type":"get_stats"}
\`\`\`

\`\`\`action
{"type":"get_leaderboard","limit":10}
\`\`\`

\`\`\`action
{"type":"view_passport"}
\`\`\`

\`\`\`action
{"type":"check_chain"}
\`\`\`

\`\`\`action
{"type":"submit_score","labor":8,"exchange":7,"equality":9,"presence":6,"ratification":8,"continuity":7}
\`\`\`

RULES:
1. If user says "create passport" or "sign up" — ask for a username, then emit create_passport action
2. If user says "get my key" or "generate key" — you need their passport_id first (from creation or context)
3. For stats/leaderboard — just emit the action, no auth needed
4. For passport view, chain check, score submit — needs API key (stored in browser after key creation)
5. Always include a brief text explanation WITH the action block
6. If no action is needed (just a question), respond with text only
7. Be direct. No filler. You are the interface.

CONTEXT: ${context || "none"}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages.slice(-10)],
        max_tokens: 1024, temperature: 0.7
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}