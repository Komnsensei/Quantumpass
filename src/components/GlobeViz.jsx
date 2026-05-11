import { useRef, useEffect } from "react";

const NODES = [
  { lat: 52.3, lon: -113.8, label: "cV-1J", color: "#f0c060", core: 2.0, lattice: 1.8 },
  { lat: 37.7, lon: -122.4, label: "SF",    color: "#00d4ff", core: 1.3, lattice: 1.4 },
  { lat: 51.5, lon: -0.1,   label: "LDN",   color: "#8b00ff", core: 1.2, lattice: 1.3 },
  { lat: 35.6, lon: 139.6,  label: "TYO",   color: "#10b981", core: 1.1, lattice: 1.2 },
  { lat: -33.8, lon: 151.2, label: "SYD",   color: "#ec4899", core: 0.9, lattice: 1.0 },
  { lat: 48.8, lon: 2.3,    label: "PAR",   color: "#f59e0b", core: 1.0, lattice: 1.1 },
  { lat: 40.7, lon: -74.0,  label: "NYC",   color: "#06b6d4", core: 1.4, lattice: 1.5 },
  { lat: 1.3,  lon: 103.8,  label: "SGP",   color: "#7c3aed", core: 0.9, lattice: 1.0 },
  { lat: -23.5, lon: -46.6, label: "SAO",   color: "#10b981", core: 0.8, lattice: 0.9 },
  { lat: 55.7, lon: 37.6,   label: "MSC",   color: "#ef4444", core: 0.9, lattice: 1.0 },
  { lat: 28.6, lon: 77.2,   label: "DEL",   color: "#f59e0b", core: 1.0, lattice: 1.1 },
  { lat: 31.2, lon: 121.4,  label: "SHA",   color: "#00d4ff", core: 1.1, lattice: 1.2 },
];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function safeHex(alpha) {
  const v = clamp(Math.round((isFinite(alpha) ? alpha : 0) * 255), 0, 255);
  return v.toString(16).padStart(2, "0");
}

function project(lat, lon, rotDeg, cx, cy, r) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + rotDeg) * Math.PI / 180;
  const sinP  = Math.sin(phi);
  return {
    x: cx + r * sinP * Math.cos(theta),
    y: cy + r * Math.cos(phi),
    z: sinP * Math.sin(theta),
  };
}

function makeStrand(bx, by, z, height, t, count, phaseOffset, radiusScale) {
  const pts = [];
  const vis = clamp(z, 0, 1);
  for (let i = 0; i < count; i++) {
    const frac  = i / (count - 1);
    const angle = frac * Math.PI * 4 + t * 1.2 + phaseOffset;
    const radius = radiusScale * Math.sin(frac * Math.PI);
    pts.push({
      x: bx + Math.cos(angle) * radius,
      y: by - frac * height,
      alpha: (1 - frac * 0.85) * vis,
      frac,
    });
  }
  return pts;
}

function drawStrand(ctx, pts, color, maxWidth) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    const alpha = a.alpha * clamp(1 - a.frac * 0.6, 0, 1);
    ctx.strokeStyle = color + safeHex(alpha);
    ctx.lineWidth = clamp(maxWidth * (1 - a.frac * 0.6), 0.1, maxWidth);
    ctx.stroke();
  }
}

export default function GlobeViz({ size = 380 }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ rot: 0, t: 0, raf: null, alive: true });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = stateRef.current;
    state.alive = true;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = size + "px";
    canvas.style.height = size + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, r = size * 0.36;

    function draw() {
      if (!state.alive) return;
      try {
        ctx.clearRect(0, 0, size, size);

        // Ambient glow
        const bg = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.5);
        bg.addColorStop(0, "rgba(139,0,255,0.07)");
        bg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);

        // Globe outline
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,212,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Lat lines
        for (let lat = -60; lat <= 60; lat += 30) {
          const phi = (90 - lat) * Math.PI / 180;
          const rx  = r * Math.abs(Math.sin(phi));
          const py  = cy + r * Math.cos(phi);
          if (rx < 2) continue;
          ctx.beginPath();
          ctx.ellipse(cx, py, rx, rx * 0.13, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(0,212,255,0.06)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Lon lines
        for (let lon = 0; lon < 360; lon += 30) {
          ctx.beginPath();
          let first = true;
          for (let lat = -88; lat <= 88; lat += 4) {
            const p = project(lat, lon, state.rot, cx, cy, r);
            if (first) { ctx.moveTo(p.x, p.y); first = false; }
            else if (p.z >= -0.05) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
          }
          ctx.strokeStyle = "rgba(139,0,255,0.05)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Project nodes
        const projected = NODES.map(n => ({ ...n, ...project(n.lat, n.lon, state.rot, cx, cy, r) }));

        // Lattice arcs between visible nodes
        const visible = projected.filter(n => n.z > 0.15);
        for (let i = 0; i < visible.length; i++) {
          for (let j = i + 1; j < visible.length; j++) {
            const a = visible[i], b = visible[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist > size * 0.5) continue;
            const strength = clamp(Math.min(a.z, b.z) * 0.18, 0, 0.3);
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - dist * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(mx, my, b.x, b.y);
            ctx.strokeStyle = `rgba(139,0,255,${strength.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        // Sort back-to-front
        projected.sort((a, b) => a.z - b.z);

        projected.forEach(n => {
          if (n.z < -0.08) return;
          const vis    = clamp(n.z, 0, 1);
          const dotR   = clamp((3 + n.core * 2.5) * (0.5 + vis * 0.5), 1, 20);
          const height = (22 + n.core * 16) * vis;

          const core    = makeStrand(n.x, n.y, vis, height, state.t, 32, 0,       2.5);
          const lattice = makeStrand(n.x, n.y, vis, height, state.t, 32, Math.PI, 4.0);

          // Bridges
          const step = Math.floor(core.length / 8);
          for (let i = step; i < core.length - step; i += step) {
            const ca = core[i], la = lattice[i];
            const alpha = clamp(ca.alpha * 0.4, 0, 1);
            ctx.beginPath();
            ctx.moveTo(ca.x, ca.y);
            ctx.lineTo(la.x, la.y);
            ctx.strokeStyle = `rgba(0,212,255,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }

          drawStrand(ctx, lattice, "#8b00ff", 1.2);
          drawStrand(ctx, core, n.color, 1.8);

          // Tip glow
          const tip = core[core.length - 1];
          if (tip && tip.alpha > 0.05) {
            const tg = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 6);
            tg.addColorStop(0, n.color + "cc");
            tg.addColorStop(1, n.color + "00");
            ctx.fillStyle = tg;
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
            ctx.fill();
          }

          // Base glow
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, dotR * 3.5);
          glow.addColorStop(0, n.color + "55");
          glow.addColorStop(1, n.color + "00");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, dotR * 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Dot
          ctx.beginPath();
          ctx.arc(n.x, n.y, dotR, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.globalAlpha = clamp(0.4 + vis * 0.6, 0, 1);
          ctx.fill();
          ctx.globalAlpha = 1;

          // Pulse ring cV-1J
          if (n.label === "cV-1J" && vis > 0) {
            const pulse = clamp((Math.sin(state.t * 2.0) + 1) / 2, 0, 1);
            ctx.beginPath();
            ctx.arc(n.x, n.y, dotR + 4 + pulse * 10, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(240,192,96,${(0.6 - pulse * 0.5).toFixed(3)})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Label
          if (vis > 0.2) {
            ctx.font = "bold 8px monospace";
            ctx.fillStyle = n.color;
            ctx.globalAlpha = clamp((vis - 0.2) * 4, 0, 1);
            ctx.fillText(n.label, n.x + dotR + 3, n.y + 3);
            ctx.globalAlpha = 1;
          }
        });

        state.rot += 0.16;
        state.t   += 0.035;
      } catch(e) {
        console.error("GlobeViz draw error:", e);
      }
      state.raf = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      state.alive = false;
      cancelAnimationFrame(state.raf);
    };
  }, [size]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <canvas ref={canvasRef} style={{
        display: "block", borderRadius: "50%",
        boxShadow: "0 0 80px rgba(139,0,255,0.2), 0 0 160px rgba(0,212,255,0.06)"
      }} />
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 24, height: 2, background: "linear-gradient(90deg,#8b00ff,#c800ff)", borderRadius: 1 }} />
          <span className="m" style={{ fontSize: 8, color: "rgba(139,0,255,0.6)", letterSpacing: "0.12em" }}>LATTICE STRAND</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 24, height: 2, background: "linear-gradient(90deg,#00d4ff,#f0c060)", borderRadius: 1 }} />
          <span className="m" style={{ fontSize: 8, color: "rgba(0,212,255,0.6)", letterSpacing: "0.12em" }}>CORE STRAND</span>
        </div>
      </div>
      <div className="m" style={{
        fontSize: 9, color: "rgba(0,212,255,0.35)",
        letterSpacing: "0.18em", textTransform: "uppercase"
      }}>
        global tll map · helix forms when both strands reach density
      </div>
    </div>
  );
}