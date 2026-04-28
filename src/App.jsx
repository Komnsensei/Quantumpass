import { useState, useEffect } from "react";
import { getStats } from "./api";
import CreatePassport from "./components/CreatePassport";
import PassportViewer from "./components/PassportViewer";
import Leaderboard from "./components/Leaderboard";
import ChainViz3D from "./components/ChainViz3D";
import ParticleField from "./components/ParticleField";
import KraftAgent from "./components/KraftAgent";
import Reveal from "./components/Reveal";
import LiveDemo from "./components/LiveDemo";

function Hex({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <polygon points="14,1 27,7.5 27,20.5 14,27 1,20.5 1,7.5" stroke="#7c3aed" strokeWidth="1.2" fill="none" />
      <polygon points="14,6 22,10.5 22,17.5 14,22 6,17.5 6,10.5" stroke="#06b6d4" strokeWidth="0.6" fill="none" opacity="0.5" />
      <circle cx="14" cy="14" r="1.5" fill="#7c3aed" />
    </svg>
  );
}

function AssembleText({ text, className = "", style = {} }) {
  return (
    <span className={"assemble-text " + className} style={style}>
      {text.split("").map((ch, i) => (
        <span key={i} style={{ transitionDelay: (i * 15) + "ms" }}>{ch === " " ? "\u00A0" : ch}</span>
      ))}
    </span>
  );
}

function App() {
  const [tab, setTab] = useState("home");
  const [stats, setStats] = useState(null);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => { getStats().then(setStats).catch(() => {}); }, []);

  const tabs = [
    { id: "home", label: "index" },
    { id: "create", label: "mint" },
    { id: "view", label: "chain" },
    { id: "leaderboard", label: "board" },
  ];

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <ParticleField />
      <div className="scanline" />
      <div className="ambient" style={{ width: 600, height: 600, top: -200, left: -200, background: "rgba(124,58,237,0.04)" }} />
      <div className="ambient" style={{ width: 400, height: 400, bottom: -100, right: -100, background: "rgba(6,182,212,0.03)", animationDelay: "4s" }} />

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid rgba(124,58,237,0.06)", background: "rgba(5,5,8,0.88)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setTab("home")}>
            <Hex />
            <span className="m" style={{ fontWeight: 600, fontSize: 13, color: "var(--t3)" }}>quantumpass</span>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className="m"
                style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s",
                  background: tab === t.id ? "rgba(124,58,237,0.12)" : "transparent",
                  color: tab === t.id ? "#7c3aed" : "var(--t2)" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main style={{ position: "relative", zIndex: 1, paddingTop: 54 }}>

        {tab === "home" && (
          <div>
            {/* HERO */}
            <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: demoOpen ? 0.15 : 1, transition: "opacity 0.6s" }}>
                <ChainViz3D sessions={[]} height={typeof window !== "undefined" ? window.innerHeight : 800} showHex={true} />
              </div>
              <div style={{ position: "relative", zIndex: 2, maxWidth: 960, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <Reveal>
                  <div className="m sec-label" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.5)", display: "inline-block" }} />
                    PROTOCOL ACTIVE
                  </div>
                </Reveal>
                <Reveal delay={100}>
                  <h1 style={{ fontSize: "clamp(34px, 5.5vw, 56px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", color: "var(--t3)", marginBottom: 20 }}>
                    Your AI gets a URL.<br />
                    <span className="grad-text">Your chain proves the rest.</span>
                  </h1>
                </Reveal>
                <Reveal delay={200}>
                  <p style={{ fontSize: "clamp(13px, 1.5vw, 15px)", color: "var(--t)", maxWidth: 540, lineHeight: 1.8, marginBottom: 32 }}>
                    QuantumPass gives every session a verifiable provenance URL. Six scored dimensions of contribution link to an immutable spiral chain. The AI doesn't just remember what you did &#8212; it can <strong style={{ color: "var(--t3)" }}>prove it to anyone with the link</strong>.
                  </p>
                </Reveal>
                <Reveal delay={300}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                    <button className="btn-prime" onClick={() => setTab("create")}>mint passport</button>
                    <button className="btn-ghost" onClick={() => setDemoOpen(!demoOpen)}>
                      {demoOpen ? "close demo" : "try live demo"}
                    </button>
                    <button className="btn-ghost" onClick={() => setTab("view")}>verify chain</button>
                  </div>
                </Reveal>
              </div>
              {!demoOpen && (
                <div style={{ position: "absolute", bottom: 32, left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
                  <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.15em" }}>SCROLL</div>
                  <div style={{ width: 1, height: 20, background: "linear-gradient(180deg, var(--t2), transparent)", margin: "6px auto 0" }} />
                </div>
              )}
            </section>

            {/* LIVE DEMO */}
            {demoOpen && (
              <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 60px" }}>
                <Reveal>
                  <div className="glow-card" style={{ padding: 24 }}>
                    <LiveDemo onMintClick={() => { setDemoOpen(false); setTab("create"); }} />
                  </div>
                </Reveal>
              </section>
            )}

            {/* STATS */}
            {stats && (
              <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 60px" }}>
                <Reveal>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--b)", borderRadius: 12, overflow: "hidden" }}>
                    {[
                      { v: stats.total_passports, l: "PASSPORTS MINTED", c: "#7c3aed" },
                      { v: stats.total_sessions, l: "BLOCKS SEALED", c: "#06b6d4" },
                      { v: stats.avg_score, l: "AVERAGE SCORE", c: "#f59e0b" },
                    ].map(s => (
                      <div key={s.l} style={{ background: "var(--bg)", padding: "28px 20px", textAlign: "center" }}>
                        <div className="m" style={{ fontSize: 30, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
                        <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.12em", marginTop: 8 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </section>
            )}

            {/* THE STORY */}
            <section style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px 80px" }}>
              <Reveal>
                <div className="m sec-label" style={{ marginBottom: 8 }}>THE PROBLEM</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--t3)", letterSpacing: "-0.02em", marginBottom: 16, lineHeight: 1.2 }}>
                  LLMs forget. Platforms vanish.<br /><span style={{ color: "var(--t)" }}>Your work history disappears with them.</span>
                </h2>
                <p style={{ fontSize: 14, color: "var(--t)", lineHeight: 1.8, maxWidth: 600, marginBottom: 40 }}>
                  You build with AI for months. The context window resets. The platform shuts down. Your collaboration history &#8212; every insight, every artifact &#8212; gone. No receipt. No proof. No chain of custody.
                </p>
              </Reveal>
              <Reveal delay={100}>
                <div className="m sec-label" style={{ marginBottom: 8 }}>THE SOLUTION</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--t3)", letterSpacing: "-0.02em", marginBottom: 24, lineHeight: 1.2 }}>
                  A <span className="grad-text">verifiable URL</span> for every session.<br />
                  A <span className="grad-text">weighted score</span> for every contribution.
                </h2>
              </Reveal>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { step: "1", title: "SCORE", sub: "Six dimensions, weighted", detail: "Each session scores labor, exchange, equality, presence, ratification, and continuity on a 0\u201310 scale. The composite maps to degrees on your spiral.", color: "#7c3aed" },
                  { step: "2", title: "CHAIN", sub: "SHA-256 hash-linked blocks", detail: "Every scored session seals a block. Each block\u2019s hash includes the previous hash, your score, degrees, and timestamp. Break one link, the chain fails.", color: "#06b6d4" },
                  { step: "3", title: "URL", sub: "Verifiable provenance link", detail: "Your passport generates a permanent URL. Any LLM, employer, or collaborator can visit it and verify your entire scored, hash-linked chain.", color: "#f59e0b" },
                ].map((s, idx) => (
                  <Reveal key={s.step} delay={idx * 120}>
                    <div className="glow-card" style={{ padding: 24, height: "100%", cursor: "default" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div className="m" style={{ fontSize: 32, fontWeight: 900, color: s.color, opacity: 0.15 }}>{s.step}</div>
                        <div>
                          <div className="m" style={{ fontSize: 13, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.04em" }}>{s.title}</div>
                          <div className="m" style={{ fontSize: 10, color: "var(--t2)" }}>{s.sub}</div>
                        </div>
                      </div>
                      <div className="expand-content">
                        <div style={{ fontSize: 12, color: "var(--t)", lineHeight: 1.7, borderTop: "1px solid var(--b)", paddingTop: 12 }}>{s.detail}</div>
                      </div>
                      <div className="m" style={{ fontSize: 8, color: "var(--t2)", marginTop: 8, letterSpacing: "0.1em" }}>HOVER TO EXPAND</div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* SCORING DIMENSIONS */}
            <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>
              <Reveal>
                <div className="m sec-label" style={{ marginBottom: 8 }}>SCORING DIMENSIONS</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--t3)", letterSpacing: "-0.02em", marginBottom: 12 }}>
                  Six vectors of <span className="grad-text">weighted provenance</span>
                </h2>
                <p style={{ fontSize: 13, color: "var(--t)", lineHeight: 1.7, maxWidth: 560, marginBottom: 36 }}>
                  Each dimension is scored 0\u201310 per session. The weighted composite becomes your block score. Scores convert to degrees. Degrees accumulate into revolutions. <strong style={{ color: "var(--t3)" }}>Hover each to learn more.</strong>
                </p>
              </Reveal>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { n: "LABOR", i: "01", c: "#7c3aed", d: "Work performed. Code written. Designs shipped. Hours invested. The raw output of creation. Score 0 means nothing produced. Score 10 means you shipped." },
                  { n: "EXCHANGE", i: "02", c: "#06b6d4", d: "Value traded between human and AI. Knowledge shared, resources committed, teaching in both directions. High exchange means both parties left richer." },
                  { n: "EQUALITY", i: "03", c: "#10b981", d: "Power balance. Did one side dominate? Did the AI just execute orders, or contribute original direction? Score 10 means genuine co-creation." },
                  { n: "PRESENCE", i: "04", c: "#f59e0b", d: "Active engagement throughout. Not just starting strong and fading. Were both parties present, responsive, and adapting for the full session?" },
                  { n: "RATIFICATION", i: "05", c: "#ec4899", d: "Peer confirmation. The other party agrees the work was real, the exchange fair, the output matches claims. Mutual sign-off." },
                  { n: "CONTINUITY", i: "06", c: "#8b5cf6", d: "Sustained commitment. This session connects to previous work, builds on patterns, extends a relationship rather than starting cold." },
                ].map((dim, idx) => (
                  <Reveal key={dim.n} delay={idx * 80}>
                    <div className="glow-card" style={{ padding: 22, cursor: "default" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div className="m" style={{ fontSize: 26, fontWeight: 900, color: dim.c, opacity: 0.12 }}>{dim.i}</div>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: dim.c, boxShadow: "0 0 10px " + dim.c + "40" }} />
                      </div>
                      <div className="m" style={{ fontSize: 12, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.06em" }}>
                        <AssembleText text={dim.n} />
                      </div>
                      <div className="expand-content">
                        <div style={{ fontSize: 12, color: "var(--t)", lineHeight: 1.7, borderTop: "1px solid var(--b)", paddingTop: 10 }}>{dim.d}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* THE URL STORY */}
            <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>
              <Reveal>
                <div className="glow-card" style={{ padding: "40px 32px", textAlign: "center" }}>
                  <div className="m sec-label" style={{ marginBottom: 12 }}>HOW THE LLM USES IT</div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--t3)", marginBottom: 16 }}>
                    One URL. <span className="grad-text">Complete provenance.</span>
                  </h2>
                  <div style={{ maxWidth: 540, margin: "0 auto", textAlign: "left" }}>
                    {[
                      { s: "01", t: "You mint a passport. You receive an API key and a unique passport ID." },
                      { s: "02", t: "After each session, scores are submitted. A new block seals to your chain with a SHA-256 hash linking it to every previous block." },
                      { s: "03", t: "Your passport generates a verifiable URL. Anyone who visits sees your username, tier, total score, spiral degree count, and full chain integrity." },
                      { s: "04", t: "You give this URL to an LLM. Now it doesn\u2019t just see your prompt \u2014 it sees weighted proof of your contribution history. All scored. All chained. All verifiable." },
                      { s: "05", t: "Over time, your spiral grows. Degrees accumulate. Tiers ascend. The URL never changes but the proof behind it deepens with every block sealed." },
                    ].map(s => (
                      <div key={s.s} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "8px 0" }}>
                        <div className="m" style={{ fontSize: 11, fontWeight: 700, color: "var(--a)", minWidth: 24 }}>{s.s}</div>
                        <div style={{ fontSize: 13, color: "var(--t)", lineHeight: 1.7 }}>{s.t}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 24, padding: "14px 20px", background: "rgba(124,58,237,0.04)", borderRadius: 8, border: "1px solid var(--b)", display: "inline-block" }}>
                    <span className="m" style={{ fontSize: 12, color: "var(--t2)" }}>quantumpass.vercel.app/verify/</span>
                    <span className="m" style={{ fontSize: 12, color: "var(--a)" }}>your-passport-id</span>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* TIERS */}
            <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>
              <Reveal>
                <div className="m sec-label" style={{ marginBottom: 8 }}>TIER STRUCTURE</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--t3)", letterSpacing: "-0.02em", marginBottom: 12 }}>
                  Ascend through <span className="grad-text-gold">accumulated proof</span>
                </h2>
                <p style={{ fontSize: 13, color: "var(--t)", lineHeight: 1.7, maxWidth: 540, marginBottom: 36 }}>
                  Your tier is determined by composite score. Each tier carries different trust weight when an LLM evaluates your provenance URL. <strong style={{ color: "var(--t3)" }}>Hover to see what each tier means.</strong>
                </p>
              </Reveal>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {[
                  { name: "OBSERVER", range: "0\u201339", color: "#505872", bar: 20, desc: "Watching. Learning. Chain started but shallow. Low trust weight in provenance checks." },
                  { name: "APPRENTICE", range: "40\u201359", color: "#10b981", bar: 40, desc: "Contributing. Real labor and exchange. Building credibility. Moderate trust weight." },
                  { name: "BUILDER", range: "60\u201374", color: "#06b6d4", bar: 60, desc: "Consistent output. Multiple verified sessions. Chain shows real depth. Solid trust weight." },
                  { name: "MASTER", range: "75\u201389", color: "#7c3aed", bar: 80, desc: "High-scoring across all six dimensions. Chain integrity proven over time. Significant trust weight." },
                  { name: "SOVEREIGN", range: "90\u2013100", color: "#f59e0b", bar: 100, desc: "Peak provenance. Maximum trust weight. Your URL carries the highest verification signal possible." },
                ].map((t, idx) => (
                  <Reveal key={t.name} delay={idx * 80}>
                    <div className="glow-card" style={{ padding: "18px 12px", textAlign: "center", cursor: "default" }}>
                      <div style={{ height: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 12 }}>
                        <div style={{ width: 4, height: (t.bar / 100) * 44, background: "linear-gradient(180deg, " + t.color + ", " + t.color + "20)", borderRadius: 4 }} />
                      </div>
                      <div className="m" style={{ fontSize: 9, fontWeight: 700, color: t.color, letterSpacing: "0.1em" }}>{t.name}</div>
                      <div className="m" style={{ fontSize: 10, color: "var(--t2)", marginTop: 3 }}>{t.range}</div>
                      <div className="expand-content">
                        <div style={{ fontSize: 10, color: "var(--t)", lineHeight: 1.5, paddingTop: 6, borderTop: "1px solid var(--b)" }}>{t.desc}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px", textAlign: "center" }}>
              <Reveal>
                <div className="glow-card" style={{ padding: "48px 32px" }}>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--t3)", marginBottom: 12 }}>
                    Block #0 is waiting at <span className="grad-text">genesis</span>
                  </h2>
                  <p style={{ fontSize: 14, color: "var(--t)", maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.7 }}>
                    Every session you seal adds permanent, weighted, verifiable proof. Your spiral grows. Your URL deepens. Your provenance chain becomes your most powerful credential.
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button className="btn-prime" onClick={() => setTab("create")}>mint passport</button>
                    <button className="btn-ghost" onClick={() => setTab("leaderboard")}>leaderboard</button>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* Footer */}
            <footer style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--b)", paddingTop: 24 }}>
              <span className="m" style={{ fontSize: 10, color: "var(--t2)" }}>quantumpass v1.0</span>
              <div style={{ display: "flex", gap: 20 }}>
                <a href="https://github.com/komnsensei" className="m" style={{ fontSize: 10, color: "var(--t2)", textDecoration: "none" }}>github</a>
                <a href="https://qrbtc-api.vercel.app" className="m" style={{ fontSize: 10, color: "var(--t2)", textDecoration: "none" }}>api</a>
              </div>
            </footer>
          </div>
        )}

        {tab === "create" && (
          <div style={{ maxWidth: 420, margin: "40px auto 0", padding: "0 24px 80px" }}>
            <CreatePassport />
          </div>
        )}

        {tab === "view" && (
          <div style={{ maxWidth: 500, margin: "40px auto 0", padding: "0 24px 80px" }}>
            <PassportViewer />
          </div>
        )}

        {tab === "leaderboard" && (
          <div style={{ maxWidth: 560, margin: "40px auto 0", padding: "0 24px 80px" }}>
            <div className="m sec-label" style={{ marginBottom: 16 }}>LEADERBOARD</div>
            <Leaderboard />
          </div>
        )}
      </main>
      <KraftAgent currentPage={tab} />
    </div>
  );
}

export default App;