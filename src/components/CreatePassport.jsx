
import { useState } from "react";
import { createPassport, createApiKey, getPassport, verifyChain, getHistory, getTier } from "../api";
import ChainViz3D from "./ChainViz3D";
import SpiralViz from "./SpiralViz";
import newBanner from "../assets/new-banner.png";

const EXT_CHROME_URL = "https://chrome.google.com/webstore/detail/passioncraft-vibesafe/pending";

export default function CreatePassport() {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [zenodoToken, setZenodoToken] = useState("");
  const [zenodoVerified, setZenodoVerified] = useState(false);
  const [zenodoLoading, setZenodoLoading] = useState(false);
  const [zenodoError, setZenodoError] = useState("");
  const [extConfirmed, setExtConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [passport, setPassport] = useState(null);
  const [chain, setChain] = useState(null);
  const [history, setHistory] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  async function verifyZenodo() {
    if (!zenodoToken.trim()) return;
    setZenodoLoading(true); setZenodoError("");
    try {
      const r = await fetch("https://zenodo.org/api/deposit/depositions?size=1", {
        headers: { "Authorization": "Bearer " + zenodoToken.trim() }
      });
      if (r.ok) {
        setZenodoVerified(true);
        setTimeout(() => setStep(2), 800);
      } else {
        setZenodoError("Invalid token (status " + r.status + "). Get one at zenodo.org/account/settings/applications");
      }
    } catch(e) {
      setZenodoError("Could not reach Zenodo. Check connection.");
    }
    setZenodoLoading(false);
  }

  async function handleCreate() {
    if (!username.trim() || !zenodoVerified || !extConfirmed) return;
    setLoading(true); setError("");
    try {
      const p = await createPassport(username.trim(), zenodoToken.trim());
      if (p.error) { setError(p.error); setLoading(false); return; }
      const key = await createApiKey(p.id);
      if (key.error) { setError(key.error); setLoading(false); return; }
      setResult({ passport_id: p.id, username: p.username, api_key: key.api_key, scopes: key.scopes, hex_id: p.hex_id });
      setStep(3);
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
      setStep(4);
    } catch (e) { setError("Failed to load."); }
    setViewLoading(false);
  }

  function copyKey() {
    navigator.clipboard.writeText(result?.api_key || "");
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const progress = step / 4;
  const stepLabels = ["username", "zenodo", "extension", "api key", "passport"];

  // Banner — always at top
  const Banner = () => (
    <div style={{ marginBottom: 28, borderRadius: 12, overflow: "hidden",
      boxShadow: "0 0 40px rgba(139,0,255,0.2)" }}>
      <img src={newBanner} alt="QuantumPass"
        style={{ width: "100%", display: "block", objectFit: "cover",
          filter: "saturate(1.2) brightness(0.95)" }} />
    </div>
  );

  if (step === 4 && passport) {
    const sessions = history?.sessions || [];
    const latest = sessions[sessions.length - 1];
    const score = latest?.score || 0;
    const degrees = latest?.total_degrees || 0;
    const tier = getTier(score);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Banner />
        <div className="glow-card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <SpiralViz degrees={degrees} score={score} size={160} />
          </div>
          <div className="m" style={{ fontSize: 18, fontWeight: 700, color: tier.color }}>{passport.username}</div>
          <span className="tag" style={{ color: tier.color, background: tier.bg, marginTop: 6 }}>{tier.name}</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
            {[
              { v: score, l: "SCORE", c: "var(--a)" },
              { v: (degrees/360).toFixed(1), l: "REV", c: "var(--a2)" },
              { v: sessions.length, l: "BLOCKS", c: "#10b981" }
            ].map(s => (
              <div key={s.l}>
                <div className="m" style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
                <div className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.1em", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
          {chain && (
            <div className="m" style={{ fontSize: 10, marginTop: 12, color: chain.chain_intact ? "#10b981" : "#ef4444" }}>
              {chain.chain_intact ? "✓ CHAIN INTACT" : "✗ CHAIN BROKEN"}
            </div>
          )}
        </div>
        {sessions.length > 0 && <ChainViz3D sessions={sessions} height={300} />}
        <div className="glow-card" style={{ padding: 14 }}>
          <div className="m" style={{ fontSize: 9, color: "var(--a)", letterSpacing: "0.12em", marginBottom: 6 }}>API KEY</div>
          <div className="m" style={{ fontSize: 10, color: "#f59e0b", wordBreak: "break-all", lineHeight: 1.6 }}>{result?.api_key}</div>
          <button className="btn-ghost" style={{ marginTop: 10, fontSize: 10, padding: "5px 14px" }} onClick={copyKey}>
            {copied ? "✓ copied" : "copy"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Banner />

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          {stepLabels.map((l, i) => (
            <div key={l} className="m" style={{
              fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase",
              color: i <= step ? "var(--a)" : "var(--t2)",
              fontWeight: i === step ? 700 : 400
            }}>{l}</div>
          ))}
        </div>
        <div style={{ height: 2, background: "rgba(139,0,255,0.1)", borderRadius: 2 }}>
          <div style={{
            height: "100%", width: (progress*100)+"%",
            background: "linear-gradient(90deg,#8b00ff,#00d4ff)",
            borderRadius: 2, transition: "width 0.4s ease"
          }} />
        </div>
      </div>

      {/* STEP 0: Username */}
      {step === 0 && (
        <div className="glow-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="m" style={{ fontSize: 16, fontWeight: 700, color: "var(--t3)", marginBottom: 4 }}>
              choose your handle
            </div>
            <div style={{ fontSize: 11, color: "var(--t2)" }}>
              Your permanent QuantumPass identity.
            </div>
          </div>
          <input className="input" placeholder="username (alphanumeric)"
            value={username}
            onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g,""))}
            onKeyDown={e => e.key === "Enter" && username.trim() && setStep(1)}
            maxLength={32} />
          <button className="btn-prime" onClick={() => setStep(1)} disabled={!username.trim()}>
            continue →
          </button>
          <div className="m" style={{ fontSize: 9, color: "var(--t2)", textAlign: "center", letterSpacing: "0.06em" }}>
            FREE · NO EMAIL · ZENODO REQUIRED
          </div>
        </div>
      )}

      {/* STEP 1: Zenodo */}
      {step === 1 && (
        <div className="glow-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="m" style={{ fontSize: 16, fontWeight: 700, color: "var(--t3)", marginBottom: 4 }}>
              {zenodoVerified ? "✓ zenodo verified" : "link zenodo · gate 1 of 2"}
            </div>
            <div style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.6 }}>
              Zenodo anchors your session provenance to permanent citable DOIs.
              Every session gets a real academic record.
            </div>
          </div>
          {!zenodoVerified ? (
            <>
              <div style={{ padding: "10px 12px", background: "rgba(0,212,255,0.04)",
                borderRadius: 8, border: "1px solid rgba(0,212,255,0.15)",
                fontSize: 11, color: "var(--t)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--t3)" }}>Get your token:</strong><br/>
                1. <a href="https://zenodo.org/account/settings/applications/tokens/new/"
                  target="_blank" style={{ color: "#00d4ff" }}>zenodo.org → Account → Applications → New Token</a><br/>
                2. Enable <strong style={{ color: "var(--t3)" }}>deposit:write</strong> scope<br/>
                3. Paste below
              </div>
              <input className="input" type="password"
                placeholder="Zenodo personal access token"
                value={zenodoToken}
                onChange={e => setZenodoToken(e.target.value)} />
              {zenodoError && <div className="m" style={{ fontSize: 11, color: "#ef4444" }}>{zenodoError}</div>}
              <button className="btn-prime" onClick={verifyZenodo}
                disabled={zenodoLoading || !zenodoToken.trim()}>
                {zenodoLoading ? "verifying..." : "verify zenodo token →"}
              </button>
            </>
          ) : (
            <div style={{ padding: "12px 14px", background: "rgba(16,185,129,0.06)",
              borderRadius: 8, border: "1px solid rgba(16,185,129,0.2)",
              display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
              <span className="m" style={{ fontSize: 11, color: "#10b981" }}>
                Zenodo verified · deposit:write confirmed
              </span>
            </div>
          )}
          <button className="btn-ghost" style={{ fontSize: 10 }} onClick={() => setStep(0)}>← back</button>
        </div>
      )}

      {/* STEP 2: Extension */}
      {step === 2 && (
        <div className="glow-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="m" style={{ fontSize: 16, fontWeight: 700, color: "var(--t3)", marginBottom: 4 }}>
              install vibesafe · gate 2 of 2
            </div>
            <div style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.6 }}>
              VIBEsafe monitors your AI conversations, scores manipulation patterns,
              and closes sessions to your chain automatically.
            </div>
          </div>
          <div style={{ padding: 16, background: "rgba(139,0,255,0.04)", borderRadius: 10,
            border: "1px solid rgba(139,0,255,0.15)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 28 }}>⬡</div>
              <div>
                <div className="m" style={{ fontSize: 13, fontWeight: 700, color: "var(--t3)" }}>
                  QuantumPass VIBEsafe
                </div>
                <div style={{ fontSize: 10, color: "var(--t2)" }}>
                  Chrome Extension · Real-time AI session governance
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                "Scores every AI message live",
                "Detects manipulation patterns",
                "Auto-closes sessions to chain",
                "Mints Zenodo DOIs per session",
                "Works on 20+ LLM platforms",
                "Privacy-first"
              ].map(f => (
                <div key={f} style={{ display: "flex", gap: 6, fontSize: 10, color: "var(--t)" }}>
                  <span style={{ color: "#10b981" }}>✓</span> {f}
                </div>
              ))}
            </div>
            <a href={EXT_CHROME_URL} target="_blank" rel="noreferrer">
              <button className="btn-prime" style={{ width: "100%" }}>↓ Install Extension</button>
            </a>
          </div>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={extConfirmed}
              onChange={e => setExtConfirmed(e.target.checked)}
              style={{ marginTop: 2, accentColor: "#8b00ff", width: 14, height: 14 }} />
            <span style={{ fontSize: 11, color: "var(--t)", lineHeight: 1.5 }}>
              I've installed VIBEsafe and am ready to begin
            </span>
          </label>
          {error && <div className="m" style={{ fontSize: 11, color: "#ef4444" }}>{error}</div>}
          <button className="btn-prime" onClick={handleCreate} disabled={loading || !extConfirmed}>
            {loading ? "minting passport..." : "⬡ mint passport & issue api key →"}
          </button>
          <button className="btn-ghost" style={{ fontSize: 10 }} onClick={() => setStep(1)}>← back</button>
        </div>
      )}

      {/* STEP 3: Key issued */}
      {step === 3 && result && (
        <div className="glow-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⬡</div>
            <div className="m" style={{ fontSize: 16, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>
              passport minted
            </div>
            <div style={{ fontSize: 11, color: "var(--t2)" }}>
              Your API key is shown once. Copy it now.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { l: "HANDLE", v: result.username, c: "var(--a2)" },
              { l: "HEX ID", v: result.hex_id || result.passport_id?.slice(0,8)+"...", c: "var(--a)" },
            ].map(r => (
              <div key={r.l}>
                <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.12em", marginBottom: 3 }}>{r.l}</div>
                <div className="m" style={{ fontSize: 13, color: r.c }}>{r.v}</div>
              </div>
            ))}
            <div>
              <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.12em", marginBottom: 6 }}>
                API KEY · SHOWN ONCE
              </div>
              <div style={{ padding: "12px 14px", background: "rgba(245,158,11,0.04)",
                border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, position: "relative" }}>
                <div className="m" style={{ fontSize: 11, color: "#f59e0b", wordBreak: "break-all",
                  lineHeight: 1.7, paddingRight: 60 }}>
                  {result.api_key}
                </div>
                <button onClick={copyKey} style={{
                  position: "absolute", top: 10, right: 10,
                  background: copied ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.1)",
                  border: "1px solid "+(copied ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.2)"),
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                  color: copied ? "#10b981" : "#f59e0b", fontSize: 10, fontFamily: "monospace"
                }}>
                  {copied ? "✓" : "copy"}
                </button>
              </div>
            </div>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(139,0,255,0.04)",
            borderRadius: 8, border: "1px solid rgba(139,0,255,0.1)",
            fontSize: 11, color: "var(--t)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--t3)" }}>Next:</strong><br/>
            1. Copy API key above<br/>
            2. Open VIBEsafe extension → paste key + Zenodo token<br/>
            3. Visit any LLM — chain starts automatically
          </div>
          <button className="btn-prime" onClick={handleView} disabled={viewLoading}>
            {viewLoading ? "loading..." : "view my passport →"}
          </button>
        </div>
      )}
    </div>
  );
}
