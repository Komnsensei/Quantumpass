import { useState } from "react";
import { getPassport, verifyChain, getHistory, getTier } from "../api";
import ChainViz3D from "./ChainViz3D";
import SpiralViz from "./SpiralViz";

export default function PassportViewer() {
  const [apiKey, setApiKey] = useState("");
  const [passport, setPassport] = useState(null);
  const [chain, setChain] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup() {
    if (!apiKey.trim()) return;
    setLoading(true); setError("");
    try {
      const p = await getPassport(apiKey);
      if (p.error) { setError(p.error); setLoading(false); return; }
      setPassport(p);
      const [v, h] = await Promise.all([verifyChain(apiKey, p.id), getHistory(apiKey)]);
      setChain(v); setHistory(h);
    } catch (e) { setError("Failed to load passport."); }
    setLoading(false);
  }

  if (!passport) {
    return (
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ textAlign: "center" }}>
          <div className="m" style={{ fontSize: 16, fontWeight: 700, color: "var(--t3)" }}>verify chain</div>
          <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 4 }}>Enter your API key to inspect your chain</div>
        </div>
        {error && <div className="m" style={{ fontSize: 11, color: "#ef4444", textAlign: "center" }}>{error}</div>}
        <input className="input" placeholder="qrbtc_live_sk_..." value={apiKey} onChange={e => setApiKey(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLookup()} type="password" />
        <button className="btn btn-p" onClick={handleLookup} disabled={loading || !apiKey.trim()}>
          {loading ? "verifying..." : "verify chain"}
        </button>
      </div>
    );
  }

  const sessions = history?.sessions || [];
  const latest = sessions[sessions.length - 1];
  const score = latest?.score || 0;
  const degrees = latest?.total_degrees || 0;
  const tier = getTier(score);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Identity card */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <SpiralViz degrees={degrees} score={score} size={100} />
        <div style={{ flex: 1 }}>
          <div className="m" style={{ fontSize: 18, fontWeight: 700, color: tier.color }}>{passport.username}</div>
          <span className="tag" style={{ color: tier.color, background: tier.bg, marginTop: 4 }}>{tier.name}</span>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <div>
              <div className="m" style={{ fontSize: 16, fontWeight: 700, color: "var(--a)" }}>{score}</div>
              <div className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.1em" }}>SCORE</div>
            </div>
            <div>
              <div className="m" style={{ fontSize: 16, fontWeight: 700, color: "var(--a2)" }}>{(degrees / 360).toFixed(1)}</div>
              <div className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.1em" }}>REV</div>
            </div>
            <div>
              <div className="m" style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>{sessions.length}</div>
              <div className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.1em" }}>BLOCKS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chain integrity */}
      {chain && (
        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: chain.chain_intact ? "#10b981" : "#ef4444" }} />
            <span className="m" style={{ fontSize: 11, color: chain.chain_intact ? "#10b981" : "#ef4444" }}>
              {chain.chain_intact ? "CHAIN INTACT" : "CHAIN BROKEN"}
            </span>
          </div>
          <span className="m" style={{ fontSize: 9, color: "var(--t2)" }}>
            {chain.first_block?.slice(0, 8)}...{chain.last_block?.slice(-8)}
          </span>
        </div>
      )}

      {/* 3D Chain */}
      {sessions.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 0, marginTop: 4 }}>CHAIN VISUALIZATION</div>
          <ChainViz3D sessions={sessions} height={360} />
        </>
      )}

      {sessions.length === 0 && (
        <div className="card" style={{ textAlign: "center", color: "var(--t2)", fontSize: 12, padding: 28 }}>
          <div className="m" style={{ fontSize: 13, color: "var(--t)", marginBottom: 4 }}>Empty chain</div>
          Submit your first session to seal Block #1
        </div>
      )}

      {/* Block list */}
      {sessions.length > 0 && (
        <div className="card">
          <div className="section-label" style={{ marginBottom: 8 }}>BLOCK HISTORY</div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {sessions.map((s, i) => {
              const t = getTier(s.score);
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--b)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="m" style={{ fontSize: 9, color: "var(--t2)", width: 20 }}>#{i + 1}</span>
                    <span className="m" style={{ fontSize: 9, color: "var(--t2)" }}>{s.session_hash?.slice(0, 16)}...</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="m" style={{ fontSize: 9, color: "var(--t2)" }}>{s.degrees_delta?.toFixed(0)}\u00B0</span>
                    <span className="m" style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{s.score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <button className="btn" style={{ fontSize: 10 }} onClick={() => { setPassport(null); setChain(null); setHistory(null); setApiKey(""); }}>
          \u2190 back
        </button>
      </div>
    </div>
  );
}