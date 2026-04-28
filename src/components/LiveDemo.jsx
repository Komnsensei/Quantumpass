import { useState, useEffect, useCallback } from "react";
import SpiralViz from "./SpiralViz";

const DIMS = [
  { key: "labor", label: "Labor", color: "#7c3aed" },
  { key: "exchange", label: "Exchange", color: "#06b6d4" },
  { key: "equality", label: "Equality", color: "#10b981" },
  { key: "presence", label: "Presence", color: "#f59e0b" },
  { key: "ratification", label: "Ratification", color: "#ec4899" },
  { key: "continuity", label: "Continuity", color: "#8b5cf6" },
];

function getTier(score) {
  if (score >= 90) return { name: "SOVEREIGN", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  if (score >= 75) return { name: "MASTER", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" };
  if (score >= 60) return { name: "BUILDER", color: "#06b6d4", bg: "rgba(6,182,212,0.1)" };
  if (score >= 40) return { name: "APPRENTICE", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
  return { name: "OBSERVER", color: "#6a6f82", bg: "rgba(106,111,130,0.1)" };
}

function fakeHash() {
  let s = "";
  const hex = "0123456789abcdef";
  for (let i = 0; i < 64; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}

function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const from = display;
    const anim = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round((from + (value - from) * ease) * 10) / 10);
      if (t < 1) requestAnimationFrame(anim);
    };
    anim();
  }, [value]);
  return <>{typeof display === "number" ? (Number.isInteger(display) ? display : display.toFixed(1)) : display}</>;
}

export default function LiveDemo({ onMintClick }) {
  const [step, setStep] = useState(0); // 0=start, 1=passport, 2=scoring, 3=sealed, 4=chain
  const [username, setUsername] = useState("");
  const [passportId] = useState("d7f3c1a0-" + Math.random().toString(16).slice(2, 6) + "-4b2e-9a1f-" + Math.random().toString(16).slice(2, 14));
  const [scores, setScores] = useState({});
  const [blocks, setBlocks] = useState([]);
  const [animatingDim, setAnimatingDim] = useState(-1);
  const [sealingHash, setSealingHash] = useState("");
  const [hashRevealed, setHashRevealed] = useState(0);

  // Step 1: Create passport
  function handleCreatePassport() {
    if (!username.trim()) return;
    setStep(1);
    setTimeout(() => setStep(2), 1500);
  }

  // Step 2: Animate scores filling in one by one
  useEffect(() => {
    if (step !== 2) return;
    setScores({});
    setAnimatingDim(-1);

    let i = 0;
    const fillNext = () => {
      if (i >= DIMS.length) {
        setTimeout(() => setStep(3), 600);
        return;
      }
      setAnimatingDim(i);
      const val = Math.round((4 + Math.random() * 6) * 10) / 10;
      setTimeout(() => {
        setScores(prev => ({ ...prev, [DIMS[i].key]: val }));
        i++;
        setTimeout(fillNext, 300);
      }, 500);
    };
    setTimeout(fillNext, 400);
  }, [step]);

  // Step 3: Seal block — hash reveal
  useEffect(() => {
    if (step !== 3) return;
    const hash = fakeHash();
    setSealingHash(hash);
    setHashRevealed(0);

    let c = 0;
    const iv = setInterval(() => {
      c += 2;
      setHashRevealed(c);
      if (c >= 64) {
        clearInterval(iv);
        // Compute score
        const weights = { labor: 0.2, exchange: 0.2, equality: 0.2, presence: 0.15, ratification: 0.15, continuity: 0.1 };
        let total = 0;
        for (const k in weights) total += (scores[k] || 0) * weights[k];
        const score = Math.round(total * 10);
        const degrees = Math.round((score / 100) * 360 * 100) / 100;
        const prevDeg = blocks.reduce((s, b) => s + b.degrees, 0);

        setBlocks(prev => [...prev, {
          id: prev.length + 1,
          score,
          degrees,
          totalDegrees: prevDeg + degrees,
          hash,
          prevHash: prev.length > 0 ? prev[prev.length - 1].hash : "genesis",
        }]);

        setTimeout(() => setStep(4), 800);
      }
    }, 30);
    return () => clearInterval(iv);
  }, [step]);

  const latestBlock = blocks[blocks.length - 1];
  const totalDegrees = latestBlock ? latestBlock.totalDegrees : 0;
  const latestScore = latestBlock ? latestBlock.score : 0;
  const tier = getTier(latestScore);

  function sealAnother() {
    setStep(2);
  }

  return (
    <div>
      {/* Demo banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: step > 0 ? "#10b981" : "#f59e0b", boxShadow: step > 0 ? "0 0 8px rgba(16,185,129,0.5)" : "none" }} />
          <span className="m" style={{ fontSize: 10, color: "var(--t)", letterSpacing: "0.1em" }}>
            {step === 0 ? "INTERACTIVE DEMO" : step < 4 ? "PROCESSING..." : "DEMO \u2014 BLOCK #" + blocks.length + " SEALED"}
          </span>
        </div>
        {blocks.length > 0 && step === 4 && (
          <button className="btn-ghost" style={{ fontSize: 10, padding: "4px 12px" }} onClick={() => { setBlocks([]); setStep(0); setUsername(""); setScores({}); }}>
            restart
          </button>
        )}
      </div>

      {/* Step 0: Enter username */}
      {step === 0 && (
        <div style={{ maxWidth: 380, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--t3)", marginBottom: 6 }}>Try it. No signup needed.</div>
          <div style={{ fontSize: 13, color: "var(--t)", marginBottom: 24, lineHeight: 1.6 }}>
            Enter any username. Watch the protocol score, hash, and seal a block in real time.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="pick a username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreatePassport()}
              style={{ flex: 1 }}
            />
            <button className="btn-prime" onClick={handleCreatePassport} disabled={!username.trim()} style={{ whiteSpace: "nowrap" }}>
              mint demo
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Passport minted confirmation */}
      {step === 1 && (
        <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "#10b981", fontWeight: 600, marginBottom: 8 }}>Passport minted</div>
          <div style={{ padding: 16, background: "rgba(16,185,129,0.04)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="m" style={{ fontSize: 10, color: "var(--t2)" }}>USERNAME</span>
              <span className="m" style={{ fontSize: 12, color: "var(--t3)" }}>{username}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="m" style={{ fontSize: 10, color: "var(--t2)" }}>PASSPORT</span>
              <span className="m" style={{ fontSize: 10, color: "var(--t)" }}>{passportId.slice(0, 18)}...</span>
            </div>
          </div>
          <div className="m" style={{ fontSize: 10, color: "var(--t2)", marginTop: 12 }}>Submitting first session...</div>
        </div>
      )}

      {/* Step 2: Live scoring */}
      {step === 2 && (
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t3)", marginBottom: 4 }}>Scoring session</div>
          <div style={{ fontSize: 12, color: "var(--t)", marginBottom: 16 }}>Six dimensions evaluated in real time.</div>
          <div style={{ padding: 16, background: "rgba(10,10,16,0.6)", borderRadius: 10, border: "1px solid var(--b)" }}>
            {DIMS.map((d, i) => {
              const val = scores[d.key];
              const active = i <= animatingDim;
              const filling = i === animatingDim && val === undefined;
              return (
                <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: i < 5 ? "1px solid rgba(124,58,237,0.05)" : "none" }}>
                  <div className="m" style={{ fontSize: 11, width: 100, color: active ? d.color : "var(--t2)", fontWeight: active ? 600 : 400, transition: "color 0.3s" }}>
                    {d.label}
                  </div>
                  <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.03)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      width: val ? (val * 10) + "%" : filling ? "60%" : "0%",
                      background: d.color,
                      boxShadow: val ? "0 0 8px " + d.color + "30" : "none",
                      transition: val ? "width 0.4s ease-out" : "width 0.3s",
                      opacity: val ? 1 : filling ? 0.3 : 0,
                    }} />
                  </div>
                  <div className="m" style={{ fontSize: 13, fontWeight: 700, width: 32, textAlign: "right", color: val ? "var(--t3)" : "var(--t2)" }}>
                    {val ? val.toFixed(1) : filling ? "..." : "\u2014"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Hashing */}
      {step === 3 && (
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t3)", marginBottom: 4 }}>Sealing block #{blocks.length + 1}</div>
          <div style={{ fontSize: 12, color: "var(--t)", marginBottom: 16 }}>Computing SHA-256 hash...</div>

          {/* Scores summary */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {DIMS.map(d => (
              <div key={d.key} style={{ padding: "4px 10px", background: "rgba(124,58,237,0.04)", borderRadius: 6, border: "1px solid var(--b)" }}>
                <span className="m" style={{ fontSize: 9, color: d.color }}>{d.label.slice(0, 3).toUpperCase()}</span>
                <span className="m" style={{ fontSize: 11, color: "var(--t3)", marginLeft: 6 }}>{scores[d.key]?.toFixed(1)}</span>
              </div>
            ))}
          </div>

          {/* Hash reveal */}
          <div style={{ padding: 16, background: "rgba(10,10,16,0.6)", borderRadius: 10, border: "1px solid var(--b)" }}>
            <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.12em", marginBottom: 6 }}>BLOCK HASH</div>
            <div className="m" style={{ fontSize: 11, wordBreak: "break-all", lineHeight: 1.6 }}>
              <span style={{ color: "#10b981" }}>{sealingHash.slice(0, hashRevealed)}</span>
              <span style={{ color: "var(--t2)" }}>{sealingHash.slice(hashRevealed).replace(/./g, "\u00B7")}</span>
            </div>
            {hashRevealed >= 64 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                <span className="m" style={{ fontSize: 10, color: "#10b981" }}>HASH VERIFIED</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Chain view — the real payoff */}
      {step === 4 && (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          {/* Passport card */}
          <div style={{ display: "flex", gap: 20, alignItems: "center", padding: 20, background: "rgba(10,10,16,0.6)", borderRadius: 12, border: "1px solid var(--b)", marginBottom: 16 }}>
            <SpiralViz degrees={totalDegrees} score={latestScore} size={120} />
            <div style={{ flex: 1 }}>
              <div className="m" style={{ fontSize: 18, fontWeight: 700, color: tier.color }}>{username}</div>
              <div style={{ marginTop: 4, marginBottom: 12 }}>
                <span className="tag" style={{ color: tier.color, background: tier.bg }}>{tier.name}</span>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <div className="m" style={{ fontSize: 20, fontWeight: 700, color: "var(--a)" }}><AnimatedNumber value={latestScore} /></div>
                  <div className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.1em" }}>SCORE</div>
                </div>
                <div>
                  <div className="m" style={{ fontSize: 20, fontWeight: 700, color: "var(--a2)" }}><AnimatedNumber value={parseFloat((totalDegrees / 360).toFixed(2))} /></div>
                  <div className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.1em" }}>REVOLUTIONS</div>
                </div>
                <div>
                  <div className="m" style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>{blocks.length}</div>
                  <div className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.1em" }}>BLOCKS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chain integrity */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "rgba(16,185,129,0.03)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.1)", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.4)" }} />
              <span className="m" style={{ fontSize: 11, color: "#10b981" }}>CHAIN INTACT</span>
            </div>
            <span className="m" style={{ fontSize: 9, color: "var(--t2)" }}>
              {blocks[0]?.hash.slice(0, 8)}...{latestBlock?.hash.slice(-8)}
            </span>
          </div>

          {/* Block list */}
          <div style={{ padding: 16, background: "rgba(10,10,16,0.6)", borderRadius: 10, border: "1px solid var(--b)", marginBottom: 16 }}>
            <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.12em", marginBottom: 8 }}>BLOCK HISTORY</div>
            {blocks.map((b, i) => {
              const t = getTier(b.score);
              return (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < blocks.length - 1 ? "1px solid rgba(124,58,237,0.05)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="m" style={{ fontSize: 10, color: "var(--t2)", width: 22 }}>#{b.id}</span>
                    <span className="m" style={{ fontSize: 10, color: "var(--t2)" }}>{b.hash.slice(0, 16)}...</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="m" style={{ fontSize: 10, color: "var(--t2)" }}>{b.degrees.toFixed(0)}\u00B0</span>
                    <span className="m" style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{b.score}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Provenance URL preview */}
          <div style={{ padding: 14, background: "rgba(124,58,237,0.03)", borderRadius: 8, border: "1px solid var(--b)", textAlign: "center", marginBottom: 16 }}>
            <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.1em", marginBottom: 6 }}>YOUR PROVENANCE URL</div>
            <div className="m" style={{ fontSize: 11 }}>
              <span style={{ color: "var(--t2)" }}>quantumpass.vercel.app/verify/</span>
              <span style={{ color: "var(--a)" }}>{passportId.slice(0, 8)}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--t)", marginTop: 8, lineHeight: 1.5 }}>
              Anyone with this link sees your score, tier, degree count, and full chain integrity.
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn-prime" onClick={sealAnother} style={{ fontSize: 11 }}>
              seal another block
            </button>
            <button className="btn-ghost" onClick={onMintClick} style={{ fontSize: 11 }}>
              mint real passport
            </button>
          </div>
        </div>
      )}
    </div>
  );
}