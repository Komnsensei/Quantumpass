
import ChamberArch from "./ChamberArch";

function VitruvianIcon({ size = 80 }) {
  return (
    <div style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Purple ring */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        border: "2px solid rgba(139,0,255,0.5)",
        boxShadow: "0 0 20px rgba(139,0,255,0.3), inset 0 0 20px rgba(139,0,255,0.05)"
      }} />
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 60 80" fill="none">
        {/* Simplified Vitruvian body */}
        <circle cx="30" cy="12" r="7" stroke="#4ade80" strokeWidth="1.5" fill="none"
          style={{ filter: "drop-shadow(0 0 4px rgba(74,222,128,0.6))" }} />
        <line x1="30" y1="19" x2="30" y2="50" stroke="#4ade80" strokeWidth="1.5"
          style={{ filter: "drop-shadow(0 0 4px rgba(74,222,128,0.4))" }} />
        <line x1="8" y1="30" x2="52" y2="30" stroke="#4ade80" strokeWidth="1.5"
          style={{ filter: "drop-shadow(0 0 4px rgba(74,222,128,0.4))" }} />
        <line x1="30" y1="50" x2="14" y2="70" stroke="#4ade80" strokeWidth="1.5"
          style={{ filter: "drop-shadow(0 0 4px rgba(74,222,128,0.4))" }} />
        <line x1="30" y1="50" x2="46" y2="70" stroke="#4ade80" strokeWidth="1.5"
          style={{ filter: "drop-shadow(0 0 4px rgba(74,222,128,0.4))" }} />
        {/* Extended arms */}
        <line x1="2" y1="22" x2="58" y2="22" stroke="rgba(74,222,128,0.3)" strokeWidth="1" />
      </svg>
    </div>
  );
}

function AtomIcon({ size = 80 }) {
  return (
    <div style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        {/* Nucleus */}
        <circle cx="40" cy="40" r="8" fill="rgba(0,212,255,0.3)"
          style={{ filter: "drop-shadow(0 0 8px rgba(0,212,255,0.8))" }} />
        <circle cx="40" cy="40" r="4" fill="#00d4ff"
          style={{ filter: "drop-shadow(0 0 6px rgba(0,212,255,1))" }} />
        {/* Orbits */}
        <ellipse cx="40" cy="40" rx="32" ry="14" stroke="rgba(0,212,255,0.4)" strokeWidth="1.2"
          style={{ filter: "drop-shadow(0 0 4px rgba(0,212,255,0.4))" }} />
        <ellipse cx="40" cy="40" rx="32" ry="14" stroke="rgba(0,212,255,0.3)" strokeWidth="1.2"
          transform="rotate(60 40 40)"
          style={{ filter: "drop-shadow(0 0 4px rgba(0,212,255,0.3))" }} />
        <ellipse cx="40" cy="40" rx="32" ry="14" stroke="rgba(0,212,255,0.3)" strokeWidth="1.2"
          transform="rotate(120 40 40)"
          style={{ filter: "drop-shadow(0 0 4px rgba(0,212,255,0.3))" }} />
        {/* Orbital nodes */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = deg * Math.PI / 180;
          const x = 40 + 32 * Math.cos(rad);
          const y = 40 + 14 * Math.sin(rad);
          return <circle key={i} cx={x} cy={y} r={3} fill="#00d4ff"
            style={{ filter: "drop-shadow(0 0 4px rgba(0,212,255,0.8))" }} />;
        })}
      </svg>
    </div>
  );
}

export default function SymbolRow() {
  return (
    <div className="symbol-row" style={{ maxWidth: 960, margin: "0 auto", padding: "40px 48px" }}>
      <VitruvianIcon size={90} />
      <div className="symbol-connector" style={{ maxWidth: 140 }} />
      <ChamberArch size={90} animated={true} />
      <div className="symbol-connector" style={{ maxWidth: 140 }} />
      <AtomIcon size={90} />
    </div>
  );
}
