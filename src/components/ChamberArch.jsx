
export default function ChamberArch({ size = 180, animated = true }) {
  const w = size;
  const h = size * 1.15;
  const cx = w / 2;
  const archW = w * 0.72;
  const archH = h * 0.78;
  const thick = size * 0.055;

  // Circuit dot positions along arch
  const dots = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = Math.PI - t * Math.PI;
    const r = archW / 2;
    const x = cx + r * Math.cos(angle);
    const y = (h * 0.82) - archH * 0.5 + r * Math.sin(angle) * (archH / archW);
    dots.push({ x, y, t });
  }

  return (
    <div className="chamber-arch" style={{ width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
        <defs>
          <radialGradient id="archGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#c8aaff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#8b00ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="archGlowC" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </radialGradient>
          <filter id="archBlur">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="4" result="glow" />
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Outer glow arch */}
        <path
          d={`M ${cx - archW/2} ${h*0.85} L ${cx - archW/2} ${h*0.82 - archH*0.5}
              A ${archW/2} ${archH*0.5} 0 0 1 ${cx + archW/2} ${h*0.82 - archH*0.5}
              L ${cx + archW/2} ${h*0.85}`}
          stroke="rgba(139,0,255,0.3)" strokeWidth={thick * 2.5}
          fill="none" filter="url(#archBlur)"
          className={animated ? "arch-animated" : ""}
        />

        {/* Main arch — white glow */}
        <path
          d={`M ${cx - archW/2} ${h*0.85} L ${cx - archW/2} ${h*0.82 - archH*0.5}
              A ${archW/2} ${archH*0.5} 0 0 1 ${cx + archW/2} ${h*0.82 - archH*0.5}
              L ${cx + archW/2} ${h*0.85}`}
          stroke="white" strokeWidth={thick * 0.7}
          fill="none" className="arch-main"
          style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.8)) drop-shadow(0 0 30px rgba(139,0,255,0.5))" }}
        />

        {/* Inner arch — cyan highlight */}
        <path
          d={`M ${cx - archW/2 + thick*1.2} ${h*0.85}
              L ${cx - archW/2 + thick*1.2} ${h*0.82 - archH*0.5 + thick*0.3}
              A ${archW/2 - thick*1.2} ${archH*0.5 - thick*0.5} 0 0 1
              ${cx + archW/2 - thick*1.2} ${h*0.82 - archH*0.5 + thick*0.3}
              L ${cx + archW/2 - thick*1.2} ${h*0.85}`}
          stroke="rgba(0,212,255,0.5)" strokeWidth={thick * 0.25}
          fill="none"
          style={{ filter: "drop-shadow(0 0 6px rgba(0,212,255,0.6))" }}
        />

        {/* Circuit lines — horizontal on legs */}
        {[0.15, 0.35, 0.55].map((t, i) => (
          <g key={i}>
            <line x1={cx - archW/2 - thick*0.3} y1={h*0.85 - archH*0.5*t}
                  x2={cx - archW/2 + thick*0.6} y2={h*0.85 - archH*0.5*t}
                  stroke={`rgba(240,192,96,${0.6 - i*0.15})`} strokeWidth={1}
                  className="arch-circuit" />
            <line x1={cx + archW/2 - thick*0.6} y1={h*0.85 - archH*0.5*t}
                  x2={cx + archW/2 + thick*0.3} y2={h*0.85 - archH*0.5*t}
                  stroke={`rgba(240,192,96,${0.6 - i*0.15})`} strokeWidth={1}
                  className="arch-circuit" />
            <circle cx={cx - archW/2 - thick*0.3} cy={h*0.85 - archH*0.5*t}
                    r={2} fill={`rgba(240,192,96,${0.7 - i*0.15})`} />
            <circle cx={cx + archW/2 + thick*0.3} cy={h*0.85 - archH*0.5*t}
                    r={2} fill={`rgba(240,192,96,${0.7 - i*0.15})`} />
          </g>
        ))}

        {/* Circuit dots along arch curve */}
        {dots.filter((_, i) => i % 2 === 0).map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={1.8}
            fill={d.t < 0.15 || d.t > 0.85 ? "rgba(240,192,96,0.6)" : "rgba(0,212,255,0.5)"}
            style={{ filter: "drop-shadow(0 0 3px rgba(0,212,255,0.6))" }} />
        ))}

        {/* Base ground line */}
        <line x1={cx - archW/2 - thick} y1={h*0.855}
              x2={cx + archW/2 + thick} y2={h*0.855}
              stroke="rgba(255,255,255,0.3)" strokeWidth={thick*0.4}
              style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.4))" }} />

        {/* Floor glow */}
        <ellipse cx={cx} cy={h*0.88} rx={archW*0.55} ry={h*0.025}
          fill="url(#archGlow)" opacity={0.4} />

        {/* Inner portal light */}
        <ellipse cx={cx} cy={h*0.6} rx={archW*0.28} ry={archH*0.22}
          fill="url(#archGlowC)" opacity={0.15} />

        {/* Top keystone */}
        <circle cx={cx} cy={h*0.82 - archH*0.5}
          r={thick*0.6} fill="white"
          style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.9)) drop-shadow(0 0 20px rgba(0,212,255,0.6))" }} />
      </svg>
    </div>
  );
}
