import { useState, useRef, useEffect } from "react";

const API = "https://qrbtc-api.vercel.app/api";

function parseAction(text) {
  const match = text.match(/```action\s*\n?([\s\S]*?)\n?```/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}

function cleanText(text) {
  return text.replace(/```action\s*\n?[\s\S]*?\n?```/g, "").trim();
}

async function executeAction(action, apiKey) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;

  switch (action.type) {
    case "create_passport":
      const cp = await fetch(API + "/passport", { method: "POST", headers, body: JSON.stringify({ username: action.username }) });
      return { label: "Passport Created", data: await cp.json() };

    case "create_key":
      const ck = await fetch(API + "/key/create", { method: "POST", headers, body: JSON.stringify({ passport_id: action.passport_id }) });
      return { label: "API Key Generated", data: await ck.json() };

    case "get_stats":
      const gs = await fetch(API + "/analytics?action=stats");
      return { label: "Network Stats", data: await gs.json() };

    case "get_leaderboard":
      const gl = await fetch(API + "/analytics?action=leaderboard&limit=" + (action.limit || 10));
      return { label: "Leaderboard", data: await gl.json() };

    case "view_passport":
      if (!apiKey) return { label: "Error", data: { error: "No API key. Create a passport first." } };
      const vp = await fetch(API + "/passport", { headers });
      return { label: "Your Passport", data: await vp.json() };

    case "check_chain":
      if (!apiKey) return { label: "Error", data: { error: "No API key." } };
      const cc = await fetch(API + "/ledger?action=history", { headers });
      return { label: "Chain Status", data: await cc.json() };

    case "submit_score":
      if (!apiKey) return { label: "Error", data: { error: "No API key." } };
      const ss = await fetch(API + "/score", { method: "POST", headers, body: JSON.stringify({
        labor: action.labor || 0, exchange: action.exchange || 0, equality: action.equality || 0,
        presence: action.presence || 0, ratification: action.ratification || 0, continuity: action.continuity || 0
      })});
      return { label: "Score Submitted", data: await ss.json() };

    default:
      return { label: "Unknown Action", data: { error: "Unknown action: " + action.type } };
  }
}

function ResultCard({ result }) {
  if (!result) return null;
  const isError = result.data?.error;
  return (
    <div style={{
      margin: "8px 0", padding: "10px 14px", borderRadius: 10,
      background: isError ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
      border: "1px solid " + (isError ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"),
      fontSize: 12, color: "#e2e8f0"
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: isError ? "#ef4444" : "#10b981" }}>
        {isError ? "⚠ " : "✓ "}{result.label}
      </div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 11, color: "#94a3b8" }}>
        {JSON.stringify(result.data, null, 2)}
      </pre>
    </div>
  );
}

export default function KraftAgent({ currentPage }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Kraft-01 online. I run QuantumPass. Say \"create passport\" to get started, or ask me anything.", result: null }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("qp_api_key") || "");
  const [passportId, setPassportId] = useState(() => localStorage.getItem("qp_passport_id") || "");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const chatMsgs = updated.map(m => ({ role: m.role, content: m.content }));
      const ctx = [
        "Page: " + (currentPage || "home"),
        apiKey ? "Has API key" : "No API key",
        passportId ? "Passport: " + passportId : "No passport"
      ].join(". ");

      const r = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMsgs.slice(-12), context: ctx })
      });
      const data = await r.json();
      const reply = data.reply || data.error || "No response";
      const action = parseAction(reply);
      const text = cleanText(reply);

      let result = null;
      if (action) {
        result = await executeAction(action, apiKey);

        if (action.type === "create_passport" && result.data?.id) {
          setPassportId(result.data.id);
          localStorage.setItem("qp_passport_id", result.data.id);
        }
        if (action.type === "create_key" && result.data?.key) {
          setApiKey(result.data.key);
          localStorage.setItem("qp_api_key", result.data.key);
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: text || "Done.", result }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection failed: " + e.message, result: null }]);
    }
    setLoading(false);
  }

  return (
    <>
      <button onClick={() => setOpen(!open)} style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
        border: "none", cursor: "pointer",
        boxShadow: open ? "0 0 30px rgba(124,58,237,0.6)" : "0 0 20px rgba(124,58,237,0.3)",
        transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24
      }}>{open ? "\u2715" : "\u26A1"}</button>

      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 24, zIndex: 9998,
          width: 400, maxHeight: 540, background: "#0a0a0f",
          border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16,
          overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
        }}>
          <div style={{
            padding: "14px 18px", borderBottom: "1px solid rgba(124,58,237,0.2)",
            background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.05))"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }} />
              <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14 }}>Kraft-01</span>
              <span style={{ color: "#64748b", fontSize: 11 }}>{apiKey ? "Authenticated" : "QuantumPass Agent"}</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", maxHeight: 380, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i}>
                <div style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%", padding: "10px 14px",
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))" : "rgba(255,255,255,0.05)",
                  color: "#e2e8f0", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  marginLeft: m.role === "user" ? "auto" : 0
                }}>{m.content}</div>
                {m.result && <ResultCard result={m.result} />}
              </div>
            ))}
            {loading && (
              <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.05)", color: "#64748b", fontSize: 13 }}>
                \u26A1 executing...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(124,58,237,0.2)", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="create passport, check stats..."
              style={{ flex: 1, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none" }}
            />
            <button onClick={send} disabled={loading || !input.trim()} style={{
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)", border: "none", borderRadius: 10,
              padding: "0 16px", cursor: "pointer", color: "white", fontWeight: 600, fontSize: 13,
              opacity: loading || !input.trim() ? 0.5 : 1
            }}>Go</button>
          </div>
        </div>
      )}
    </>
  );
}