import { useState } from "react";
import { createPassport, createApiKey, getPassport, verifyChain, getHistory, getTier } from "../api";
import ChainViz3D from "./ChainViz3D";
import SpiralViz from "./SpiralViz";

export default function CreatePassport() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [passport, setPassport] = useState(null);
  const [chain, setChain] = useState(null);
  const [history, setHistory] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  async function handleCreate() {
    if (!username.trim()) return;
    setLoading(true); setError("");
    try {
      const p = await createPassport(username.trim());
      if (p.error) { setError(p.error); setLoading(false); return; }
      const key = await createApiKey(p.id);
      if (key.error) { setError(key.error); setLoading(false); return; }
      setResult({ passport_id: p.id, username: p.username, api_key: key.api_key, scopes: key.scopes });
    } catch (e) { setError("Failed to create passport."); }
    setLoading(false);
  }

  async function handleView() {
    if (!result?.api_key) return;
    setViewLoading(true);
    try {
      const p = await getPassport(result.api_key);
      if (p.error) { setError(p.error); setViewLoading(false); return; }
      setPassport(p);
      const [v, h] = await Promise.all([verifyChain(result.api_key, p.id), getHistory(result.api_key)]);
      setChain(v); setHistory(h);
    } catch (e) { setError("Failed to load."); }
    setViewLoading(false);
  }

  function copyKey() {
    navigator.clipboard.writeText(result?.api_key);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  if (passport) {
    const sessions = history?.sessions || [];
    const latest = sessions[sessions.length - 1];
    const score = latest?.score || 0;
    const degrees = latest?.total_degrees || 0;
    const tier = getTier(score);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <SpiralViz degrees={degrees} score={score} size={160} />
          </div>
          <div className="m" style={{ fontSize: 18, fontWeight: 700, color: tier.color }}>{passport.username}</div>
          <span className="tag" style={{ color: tier.color, background: tier.bg, marginTop: 6 }}>{tier.name}</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
            <div>
              <div className="m" style={{ fontSize: 20, fontWeight: 700, color: "var(--a)" }}>{score}</div>
              <div className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.1em", marginTop: 2 }}>SCORE</div>
            </div>
            <div>
              <div className="m" style={{ fontSize: 20, fontWeight: 700, color: "var(--a2)" }}>{(degrees / 360).toFixed(1)}</div>
              <div className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.1em", marginTop: 2 }}>REV</div>
            </div>
            <div>
              <div className="m" style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>{sessions.length}</div>
              <div className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.1em", marginTop: 2 }}>BLOCKS</div>
            </div>
          </div>
          {chain && (
            <div className="m" style={{ fontSize: 10, marginTop: 12, color: chain.chain_intact ? "#10b981" : "#ef4444" }}>
              {chain.chain_intact ? "\u2713 CHAIN INTACT" : "\u2717 CHAIN BROKEN"}
            </div>
          )}
        </div>

        {sessions.length > 0 && <ChainViz3D sessions={sessions} height={300} />}

        <div className="card" style={{ background: "rgba(124,58,237,0.03)" }}>
          <div className="m" style={{ fontSize: 9, color: "var(--a)", letterSpacing: "0.12em", marginBottom: 6 }}>API KEY</div>
          <div className="m" style={{ fontSize: 10, color: "#f59e0b", wordBreak: "break-all", lineHeight: 1.6 }}>{result?.api_key}</div>
          <button className="btn" style={{ marginTop: 10, fontSize: 10, padding: "5px 14px" }} onClick={copyKey}>
            {copied ? "\u2713 copied" : "copy"}
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div className="m" style={{ fontSize: 16, fontWeight: 700, color: "var(--t3)" }}>passport minted</div>
          <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 4 }}>Save your API key. It will not be shown again.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.12em", marginBottom: 3 }}>USERNAME</div>
            <div className="m" style={{ fontSize: 15, color: "var(--a2)" }}>{result.username}</div>
          </div>
          <div>
            <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.12em", marginBottom: 3 }}>PASSPORT ID</div>
            <div className="m" style={{ fontSize: 10, color: "var(--t)", wordBreak: "break-all" }}>{result.passport_id}</div>
          </div>
          <div>
            <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.12em", marginBottom: 3 }}>API KEY</div>
            <div style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 6, padding: 10 }}>
              <div className="m" style={{ fontSize: 10, color: "#f59e0b", wordBreak: "break-all", lineHeight: 1.6 }}>{result.api_key}</div>
            </div>
          </div>
          <div>
            <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.12em", marginBottom: 4 }}>SCOPES</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(result.scopes || []).map(s => (
                <span key={s} className="tag" style={{ color: "var(--a)", background: "rgba(124,58,237,0.06)" }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="btn btn-p" onClick={copyKey}>{copied ? "\u2713 copied" : "copy api key"}</button>
          <button className="btn" onClick={handleView} disabled={viewLoading}>
            {viewLoading ? "loading..." : "view passport \u2192"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ textAlign: "center" }}>
        <div className="m" style={{ fontSize: 16, fontWeight: 700, color: "var(--t3)" }}>mint passport</div>
        <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 4 }}>Choose a username. Get a portable identity.</div>
      </div>
      {error && <div className="m" style={{ fontSize: 11, color: "#ef4444", textAlign: "center" }}>{error}</div>}
      <input className="input" placeholder="username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} maxLength={32} />
      <button className="btn btn-p" onClick={handleCreate} disabled={loading || !username.trim()}>
        {loading ? "minting..." : "mint passport"}
      </button>
      <div className="m" style={{ fontSize: 9, color: "var(--t2)", textAlign: "center", letterSpacing: "0.06em" }}>
        FREE TIER / 1000 REQ/DAY / NO EMAIL
      </div>
    </div>
  );
}