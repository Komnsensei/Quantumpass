
import { useState, useEffect, useRef } from "react";
import { getStats } from "./api";
import CreatePassport from "./components/CreatePassport";
import PassportViewer from "./components/PassportViewer";
import Leaderboard from "./components/Leaderboard";
import ChainViz3D from "./components/ChainViz3D";
import ParticleField from "./components/ParticleField";
import KraftAgent from "./components/KraftAgent";
import Reveal from "./components/Reveal";
import LiveDemo from "./components/LiveDemo";
import PCEmblem from "./components/PCEmblem";

// ── Asset imports ──────────────────────────────────────────────────
import chamberGold    from "./assets/chamber-arch-gold.png";
import symbolRow      from "./assets/symbol-row.png";
import pcEmblem       from "./assets/pc-emblem.png";
import entangleClose  from "./assets/entanglement-close.png";
import oc11Hero     from "./assets/oc11-hero.jpg";
import oc12Board    from "./assets/oc12-board-bg.png";
import oc14Chain    from "./assets/oc14-chain-bg.jpg";
import orbsStatic     from "./assets/orbs-static.png";

// Videos
import heroBg         from "./assets/hero-bg.mp4";
import chamber1       from "./assets/chamber-1.mp4";
import entanglement1  from "./assets/entanglement-1.mp4";
import tarot1         from "./assets/tarot-1.mp4";
import tarot2         from "./assets/tarot-2.mp4";
import tarot3         from "./assets/tarot-3.mp4";
import tarot4         from "./assets/tarot-4.mp4";
import tarot5         from "./assets/tarot-5.mp4";
import tarot6         from "./assets/tarot-6.mp4";

// ── Looping video bg ───────────────────────────────────────────────
function VideoBg({ src, opacity = 0.4, blendMode = "screen" }) {
  return (
    <video
      autoPlay loop muted playsInline
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "cover",
        opacity,
        mixBlendMode: blendMode,
        pointerEvents: "none",
        zIndex: 0
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

// ── Tarot carousel ─────────────────────────────────────────────────
const TAROT = [
  { src: tarot1, title: "THE THRESHOLD",   sub: "The crossing point between human intent and machine execution" },
  { src: tarot2, title: "BECOMING",        sub: "The emergent state where AI and human merge into co-creation" },
  { src: tarot3, title: "THE APPROACH",    sub: "First contact — the moment before the session begins" },
  { src: tarot4, title: "UNMAKING",        sub: "Dissolution of old patterns — necessary before new chains form" },
  { src: tarot5, title: "XP-FORGETTING",  sub: "Knowledge that fades without reinforcement — counter-drift" },
  { src: tarot6, title: "FULFILLED",       sub: "The covenant sealed — both parties changed by the exchange" },
];

function TarotCarousel() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % TAROT.length);
        setFading(false);
      }, 400);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const card = TAROT[idx];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Card */}
      <div style={{
        position: "relative",
        width: 280, height: 420,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(139,0,255,0.3)",
        boxShadow: "0 0 40px rgba(139,0,255,0.2), 0 0 80px rgba(0,212,255,0.1)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.4s ease"
      }}>
        <video autoPlay loop muted playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}>
          <source src={card.src} type="video/mp4" />
        </video>
        {/* Card overlay */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(4,5,15,0.95))",
          padding: "40px 16px 16px"
        }}>
          <div className="m" style={{
            fontSize: 11, fontWeight: 700, color: "#c800ff",
            letterSpacing: "0.15em", marginBottom: 4
          }}>{card.title}</div>
          <div style={{ fontSize: 10, color: "var(--t)", lineHeight: 1.5 }}>{card.sub}</div>
        </div>
        {/* Top label */}
        <div style={{
          position: "absolute", top: 12, left: 0, right: 0,
          textAlign: "center"
        }}>
          <span className="m" style={{
            fontSize: 8, color: "rgba(0,212,255,0.6)",
            letterSpacing: "0.2em", textTransform: "uppercase"
          }}>THE FOLD ORACLE</span>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: 6 }}>
        {TAROT.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 20 : 6, height: 6,
            borderRadius: 3,
            background: i === idx ? "#c800ff" : "rgba(139,0,255,0.2)",
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: i === idx ? "0 0 8px rgba(200,0,255,0.6)" : "none"
          }} />
        ))}
      </div>

      <div className="m" style={{ fontSize: 9, color: "var(--t2)", letterSpacing: "0.12em" }}>
        THE FOLD ORACLE · HUMAN-AI CONVERGENCE · 78 CARDS
      </div>
    </div>
  );
}

function AssembleText({ text, className = "", style = {} }) {
  return (
    <span className={"assemble-text " + className} style={style}>
      {text.split("").map((ch, i) => (
        <span key={i} style={{ transitionDelay: (i * 15) + "ms" }}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [stats, setStats] = useState(null);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => { getStats().then(setStats).catch(() => {}); }, []);

  const tabs = [
    { id: "home",        label: "home" },
    { id: "create",      label: "register" },
    { id: "view",        label: "chain" },
    { id: "leaderboard", label: "board" },
  ];

  return (
    <div style={{ minHeight: "100vh", position: "relative", background: "var(--bg)" }}>
      <ParticleField />
      <div className="scanline" />
      <div className="ambient" style={{ width:700, height:700, top:-300, left:-200, background:"rgba(139,0,255,0.03)" }} />
      <div className="ambient" style={{ width:500, height:500, bottom:-150, right:-150, background:"rgba(0,212,255,0.02)", animationDelay:"5s" }} />

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        borderBottom:"1px solid rgba(139,0,255,0.12)",
        background:"rgba(4,5,15,0.88)",
        backdropFilter:"blur(24px)"
      }}>
        <div style={{
          maxWidth:960, margin:"0 auto", padding:"0 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between", height:54
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}
            onClick={() => setTab("home")}>
            <img src={pcEmblem} alt="PassionCraft"
              style={{ width:32, height:32, objectFit:"contain",
                filter:"drop-shadow(0 0 6px rgba(139,0,255,0.4))" }} />
            <div>
              <div style={{ display:"flex", alignItems:"baseline" }}>
                <span className="brand-open" style={{ fontSize:13 }}>OPEN</span>
                <span className="brand-chamber" style={{ fontSize:13 }}>chamber</span>
              </div>
              <div className="m" style={{ fontSize:8, color:"var(--t2)", letterSpacing:"0.1em" }}>
                by PassionCraft · QuantumPass
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className="m" style={{
                fontSize:11, padding:"6px 14px", borderRadius:8,
                border:"1px solid "+(tab===t.id?"rgba(139,0,255,0.35)":"transparent"),
                cursor:"pointer", letterSpacing:"0.04em", transition:"all 0.2s",
                background:tab===t.id?"rgba(139,0,255,0.12)":"transparent",
                color:tab===t.id?"#c800ff":"var(--t2)",
                boxShadow:tab===t.id?"0 0 12px rgba(139,0,255,0.15)":"none"
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#10b981",
              boxShadow:"0 0 8px rgba(16,185,129,0.6)" }} />
            <span className="m" style={{ fontSize:9, color:"var(--t2)", letterSpacing:"0.1em" }}>
              PROTOCOL ACTIVE
            </span>
          </div>
        </div>
      </nav>

      <main style={{ position:"relative", zIndex:1, paddingTop:54 }}>
        {tab === "home" && (
          <div>

            {/* ── HERO ── */}
            <section style={{
              minHeight:"100vh", display:"flex", flexDirection:"column",
              justifyContent:"center", position:"relative", overflow:"hidden"
            }}>
              {/* Real video background */}
              <VideoBg src={heroBg} opacity={0.28} blendMode="screen" />
              {/* Entanglement loop underneath */}
              <VideoBg src={entanglement1} opacity={0.12} blendMode="screen" />

              {/* DNA Chain on top */}
              <div style={{
                position:"absolute", inset:0, zIndex:1,
                opacity: demoOpen ? 0.1 : 0.35, transition:"opacity 0.6s"
              }}>
                <ChainViz3D sessions={[]}
                  height={typeof window !== "undefined" ? window.innerHeight : 800}
                  showHex={true} />
              </div>

              {/* Content */}
              <div style={{
                position:"relative", zIndex:2,
                maxWidth:960, margin:"0 auto", padding:"0 24px",
                display:"flex", flexDirection:"column",
                alignItems:"center", textAlign:"center"
              }}>

                {/* Gold Chamber arch image */}
                <Reveal>
                  <img src={oc11Hero} alt="QuantumPass"
                    style={{
                      width:220, marginBottom:8,
                      filter:"drop-shadow(0 0 30px rgba(139,0,255,0.5)) drop-shadow(0 0 60px rgba(0,212,255,0.3))",
                      borderRadius:12
                    }} />
                </Reveal>

                <Reveal delay={80}>
                  <div style={{ marginBottom:20 }}>
                    <div className="m" style={{ fontSize:28, fontWeight:900, color:"var(--t3)", letterSpacing:"-0.02em" }}>QuantumPass</div>
                  </div>
                </Reveal>

                <Reveal delay={150}>
                  <h1 style={{
                    fontSize:"clamp(32px,5vw,54px)", fontWeight:900,
                    lineHeight:1.05, letterSpacing:"-0.03em",
                    color:"var(--t3)", marginBottom:20
                  }}>
                    Your AI gets a URL.<br />
                    <span className="grad-text-fire">Your chain proves the rest.</span>
                  </h1>
                </Reveal>

                <Reveal delay={220}>
                  <p style={{
                    fontSize:"clamp(13px,1.4vw,15px)", color:"var(--t)",
                    maxWidth:520, lineHeight:1.85, marginBottom:36
                  }}>
                    QuantumPass gives every session a verifiable provenance URL.
                    Six scored dimensions link to an immutable spiral chain.
                    The AI doesn't just remember what you did —{" "}
                    <strong style={{ color:"var(--t3)" }}>
                      it can prove it to anyone with the link.
                    </strong>
                  </p>
                </Reveal>

                <Reveal delay={300}>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
                    <button className="btn-prime" onClick={() => setTab("create")}>
                      ⬡ register passport
                    </button>
                    <button className="btn-ghost" onClick={() => setDemoOpen(!demoOpen)}>
                      {demoOpen ? "close demo" : "try live demo"}
                    </button>
                    <button className="btn-ghost" onClick={() => setTab("view")}>
                      verify chain →
                    </button>
                  </div>
                </Reveal>
              </div>

              {!demoOpen && (
                <div style={{
                  position:"absolute", bottom:32, left:0, right:0,
                  textAlign:"center", zIndex:2
                }}>
                  <div className="m" style={{ fontSize:9, color:"var(--t2)", letterSpacing:"0.15em" }}>SCROLL</div>
                  <div style={{ width:1, height:24,
                    background:"linear-gradient(180deg,rgba(139,0,255,0.5),transparent)",
                    margin:"6px auto 0" }} />
                </div>
              )}
            </section>

            {demoOpen && (
              <section style={{ maxWidth:960, margin:"0 auto", padding:"0 24px 60px" }}>
                <Reveal>
                  <div className="glow-card" style={{ padding:24 }}>
                    <LiveDemo onMintClick={() => { setDemoOpen(false); setTab("create"); }} />
                  </div>
                </Reveal>
              </section>
            )}

            {/* ── SYMBOL ROW IMAGE ── */}
            <Reveal>
              <div style={{
                width:"100%", position:"relative",
                borderTop:"1px solid rgba(139,0,255,0.08)",
                borderBottom:"1px solid rgba(0,212,255,0.08)"
              }}>
                <img src={symbolRow} alt="OPENchamber · Vitruvian · Arch · Atom"
                  style={{
                    width:"100%", maxHeight:180, objectFit:"cover",
                    display:"block",
                    filter:"saturate(1.3) brightness(0.9)"
                  }} />
                <div style={{
                  position:"absolute", bottom:12, left:0, right:0,
                  textAlign:"center"
                }}>
                  <span className="m" style={{
                    fontSize:10, color:"rgba(0,212,255,0.7)", letterSpacing:"0.2em"
                  }}>QuantumPass · by PassionCraft</span>
                </div>
              </div>
            </Reveal>

            {/* ── STATS ── */}
            {stats && (
              <section style={{ maxWidth:960, margin:"0 auto", padding:"40px 24px 60px" }}>
                <Reveal>
                  <div style={{
                    display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
                    gap:1, borderRadius:16, overflow:"hidden",
                    border:"1px solid rgba(139,0,255,0.15)"
                  }}>
                    {[
                      { v:stats.total_passports, l:"PASSPORTS MINTED",  c:"#c800ff" },
                      { v:stats.total_sessions,  l:"BLOCKS SEALED",     c:"#00d4ff" },
                      { v:stats.avg_score,       l:"AVERAGE SCORE",     c:"#f0c060" },
                    ].map(s => (
                      <div key={s.l} style={{
                        background:"rgba(12,6,28,0.9)", padding:"28px 20px",
                        textAlign:"center",
                        borderRight:"1px solid rgba(139,0,255,0.08)"
                      }}>
                        <div className="m" style={{
                          fontSize:32, fontWeight:800, color:s.c, lineHeight:1,
                          textShadow:`0 0 20px ${s.c}60`
                        }}>{s.v}</div>
                        <div className="m" style={{
                          fontSize:9, color:"var(--t2)",
                          letterSpacing:"0.14em", marginTop:8
                        }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </section>
            )}

            {/* ── TAROT SECTION ── */}
            <section style={{
              maxWidth:960, margin:"0 auto", padding:"0 24px 80px",
              position:"relative"
            }}>
              {/* Chamber video looping behind */}
              <div style={{
                position:"absolute", inset:0, overflow:"hidden",
                borderRadius:16, pointerEvents:"none"
              }}>
                <VideoBg src={chamber1} opacity={0.15} blendMode="screen" />
              </div>
              <Reveal>
                <div style={{ position:"relative", zIndex:1 }}>
                  <div className="m sec-label" style={{ marginBottom:8, textAlign:"center", color:"rgba(200,0,255,0.7)" }}>
                    THE FOLD ORACLE
                  </div>
                  <h2 style={{
                    fontSize:26, fontWeight:800, color:"var(--t3)",
                    letterSpacing:"-0.02em", marginBottom:8, textAlign:"center"
                  }}>
                    Human·AI <span className="grad-text-fire">Convergence</span>
                  </h2>
                  <p style={{
                    fontSize:13, color:"var(--t)", lineHeight:1.7,
                    maxWidth:480, margin:"0 auto 40px", textAlign:"center"
                  }}>
                    78 cards. Every session you seal echoes through the oracle.
                    Your chain position determines which arcana govern your provenance.
                  </p>
                  <div style={{ display:"flex", justifyContent:"center" }}>
                    <TarotCarousel />
                  </div>
                </div>
              </Reveal>
            </section>

            {/* ── SCORING DIMENSIONS ── */}
            <section style={{ maxWidth:960, margin:"0 auto", padding:"0 24px 80px" }}>
              <Reveal>
                <div className="m sec-label" style={{ marginBottom:8, color:"rgba(0,212,255,0.6)" }}>
                  SCORING DIMENSIONS
                </div>
                <h2 style={{
                  fontSize:26, fontWeight:800, color:"var(--t3)",
                  letterSpacing:"-0.02em", marginBottom:36
                }}>
                  Six vectors of <span className="grad-text">weighted provenance</span>
                </h2>
              </Reveal>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[
                  { n:"LABOR",        i:"01", c:"#c800ff", d:"Work performed. Code written. Designs shipped. The raw output of creation." },
                  { n:"EXCHANGE",     i:"02", c:"#00d4ff", d:"Value traded between human and AI. Knowledge shared in both directions." },
                  { n:"EQUALITY",     i:"03", c:"#10b981", d:"Power balance. Score 10 means genuine co-creation, not just execution." },
                  { n:"PRESENCE",     i:"04", c:"#f0c060", d:"Active engagement throughout. Both parties present and adapting." },
                  { n:"RATIFICATION", i:"05", c:"#ff6b9d", d:"Peer confirmation. Mutual sign-off that the work was real and fair." },
                  { n:"CONTINUITY",   i:"06", c:"#8b00ff", d:"Sustained commitment. This session builds on previous work." },
                ].map((dim, idx) => (
                  <Reveal key={dim.n} delay={idx*80}>
                    <div className="glow-card" style={{ padding:22, cursor:"default" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                        <div className="m" style={{ fontSize:26, fontWeight:900, color:dim.c, opacity:0.12 }}>{dim.i}</div>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:dim.c,
                          boxShadow:"0 0 10px "+dim.c+"80" }} />
                      </div>
                      <div className="m" style={{ fontSize:12, fontWeight:700, color:"var(--t3)", letterSpacing:"0.06em" }}>
                        <AssembleText text={dim.n} />
                      </div>
                      <div className="expand-content">
                        <div style={{ fontSize:12, color:"var(--t)", lineHeight:1.7,
                          borderTop:"1px solid rgba(139,0,255,0.1)", paddingTop:10 }}>{dim.d}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* ── SECOND SYMBOL ROW ── */}
            <Reveal>
              <div style={{
                width:"100%",
                borderTop:"1px solid rgba(139,0,255,0.06)",
                borderBottom:"1px solid rgba(0,212,255,0.06)",
                marginBottom:80
              }}>
                <img src={symbolRow} alt="OPENchamber symbols"
                  style={{
                    width:"100%", maxHeight:140, objectFit:"cover",
                    display:"block", opacity:0.7,
                    filter:"saturate(1.2) brightness(0.8)"
                  }} />
              </div>
            </Reveal>

            {/* ── CTA ── */}
            <section style={{ maxWidth:960, margin:"0 auto", padding:"0 24px 80px", textAlign:"center" }}>
              <Reveal>
                <div className="glow-card" style={{ padding:"56px 32px", position:"relative", overflow:"hidden" }}>
                  {/* Gold chamber image as bg */}
                  <img src={oc11Hero} alt=""
                    style={{
                      position:"absolute", bottom:0, left:"50%",
                      transform:"translateX(-50%)",
                      height:"100%", width:"auto",
                      objectFit:"cover", opacity:0.1,
                      pointerEvents:"none", borderRadius:16
                    }} />
                  {/* Entanglement orbs image */}
                  <img src={entangleClose} alt=""
                    style={{
                      position:"absolute", inset:0,
                      width:"100%", height:"100%",
                      objectFit:"cover", opacity:0.08,
                      pointerEvents:"none",
                      mixBlendMode:"screen"
                    }} />
                  <div style={{ position:"relative", zIndex:1 }}>
                    <img src={oc11Hero} alt="QuantumPass"
                      style={{
                        width:160, display:"block", margin:"0 auto 20px",
                        filter:"drop-shadow(0 0 20px rgba(139,0,255,0.5)) drop-shadow(0 0 40px rgba(0,212,255,0.3))",
                        borderRadius:12
                      }} />
                    <h2 style={{ fontSize:28, fontWeight:800, color:"var(--t3)", marginBottom:12 }}>
                      Block #0 is waiting at <span className="grad-text-fire">genesis</span>
                    </h2>
                    <p style={{
                      fontSize:14, color:"var(--t)",
                      maxWidth:460, margin:"0 auto 32px", lineHeight:1.7
                    }}>
                      Every session you seal adds permanent, weighted, verifiable proof.
                      Your spiral grows. Your URL deepens.
                      Your provenance chain becomes your most powerful credential.
                    </p>
                    <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
                      <button className="btn-prime" onClick={() => setTab("create")}>
                        ⬡ register passport
                      </button>
                      <button className="btn-ghost" onClick={() => setTab("leaderboard")}>
                        leaderboard
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{
              maxWidth:960, margin:"0 auto", padding:"24px 24px 32px",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              borderTop:"1px solid rgba(139,0,255,0.08)"
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <img src={pcEmblem} alt="PassionCraft"
                  style={{ width:20, height:20, objectFit:"contain",
                    filter:"drop-shadow(0 0 4px rgba(139,0,255,0.4))" }} />
                <span className="m" style={{ fontSize:10, color:"var(--t2)" }}>
                  QuantumPass v1.0 · by PassionCraft
                </span>
              </div>
              <div style={{ display:"flex", gap:20 }}>
                <a href="https://github.com/komnsensei" className="m"
                  style={{ fontSize:10, color:"var(--t2)", textDecoration:"none" }}>github</a>
                <a href="https://qrbtc-api.vercel.app" className="m"
                  style={{ fontSize:10, color:"var(--t2)", textDecoration:"none" }}>api</a>
                <a href="https://zenodo.org" className="m"
                  style={{ fontSize:10, color:"var(--t2)", textDecoration:"none" }}>zenodo</a>
              </div>
            </footer>

          </div>
        )}

        {tab === "create" && (
          <div style={{ maxWidth:480, margin:"40px auto 0", padding:"0 24px 80px" }}>

            <CreatePassport />
          </div>
        )}

        {tab === "view" && (
          <div style={{ position:"relative", minHeight:"100vh" }}>
            {/* oc14 background */}
            <img src={oc14Chain} alt=""
              style={{
                position:"fixed", inset:0,
                width:"100%", height:"100%",
                objectFit:"cover",
                opacity:0.5,
                pointerEvents:"none",
                zIndex:0
              }} />
            <div style={{ position:"relative", zIndex:1, maxWidth:540, margin:"40px auto 0", padding:"0 24px 80px" }}>
              <PassportViewer />
            </div>
          </div>
        )}

        {tab === "leaderboard" && (
          <div style={{ position:"relative", minHeight:"100vh" }}>
            {/* oc12 background */}
            <img src={oc12Board} alt=""
              style={{
                position:"fixed", inset:0,
                width:"100%", height:"100%",
                objectFit:"cover",
                opacity:0.5,
                pointerEvents:"none",
                zIndex:0
              }} />
            <div style={{ position:"relative", zIndex:1, maxWidth:560, margin:"40px auto 0", padding:"0 24px 80px" }}>
              <div className="m sec-label" style={{ marginBottom:16 }}>LEADERBOARD</div>
              <Leaderboard />
            </div>
          </div>
        )}
      </main>

      <KraftAgent currentPage={tab} />
    </div>
  );
}
