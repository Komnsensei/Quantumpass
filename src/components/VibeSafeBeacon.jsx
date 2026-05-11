import { useState, useEffect } from "react";

const STATES = {
  green:  { color: "#10b981", shadow: "rgba(16,185,129,0.8)", label: "SOVEREIGN",  desc: "Session balanced" },
  red:    { color: "#dc143c", shadow: "rgba(220,20,60,0.8)",  label: "LEADING",    desc: "Imbalance detected" },
  ghost:  { color: "#6b7280", shadow: "rgba(107,114,128,0.4)",label: "ENTROPY",    desc: "Engagement fading" },
};

export default function VibeSafeBeacon({ state = "green", position = "dialog" }) {
  const [pulse, setPulse] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const s = STATES[state] || STATES.green;

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), state === "ghost" ? 2000 : 900);
    return () => clearInterval(t);
  }, [state]);

  const isFixed = position === "global";

  return (
    <div
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
      style={{
        position: isFixed ? "fixed" : "absolute",
        top: isFixed ? 16 : 8,
        right: isFixed ? 80 : 8,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
      }}
    >
      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute",
          right: 24,
          top: -4,
          background: "rgba(4,5,15,0.95)",
          border: `1px solid ${s.color}40`,
          borderRadius: 8,
          padding: "6px 10px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: "0.1em" }}>
            VIBESAFE - {s.label}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
            {s.desc}
          </div>
        </div>
      )}

      {/* Outer ring pulse */}
      <div style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: `1px solid ${s.color}`,
        position: "absolute",
        opacity: pulse ? 0 : 0.4,
        transform: pulse ? "scale(2.2)" : "scale(1)",
        transition: "all 0.9s ease",
        pointerEvents: "none",
      }} />

      {/* Core dot */}
      <div style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: s.color,
        boxShadow: `0 0 ${pulse ? 14 : 8}px ${s.shadow}`,
        transition: "box-shadow 0.9s ease",
        position: "relative",
        zIndex: 1,
      }} />
    </div>
  );
}