import { useRef, useEffect, useMemo } from "react";

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export default function ChainViz3D({ sessions = [], height = 400 }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ rot: 0, t: 0, raf: null, alive: true });

  const demo = useMemo(() => {
    if (sessions.length > 0) return sessions;
    return Array.from({ length: 12 }, (_, i) => ({
      id: "d" + i,
      score: 25 + Math.floor(Math.random() * 70),
    }));
  }, [sessions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = stateRef.current;
    state.alive = true;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const cx = W / 2, cy = H / 2;

    const COLORS = ["#2a2e3a","#10b981","#06b6d4","#7c3aed","#f59e0b"];
    function scoreColor(s) {
      if (s >= 90) return COLORS[4];
      if (s >= 75) return COLORS[3];
      if (s >= 60) return COLORS[2];
      if (s >= 40) return COLORS[1];
      return COLORS[0];
    }

    function draw() {
      if (!state.alive) return;
      try {
        ctx.clearRect(0, 0, W, H);

        // Ambient
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
        bg.addColorStop(0, "rgba(124,58,237,0.04)");
        bg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const n = demo.length;
        const spiralPts = demo.map((s, i) => {
          const t     = i / Math.max(n - 1, 1);
          const angle = t * Math.PI * 2 * Math.max(n / 3, 1) + state.rot;
          const radius = (0.08 + t * 0.28) * Math.min(W, H);
          const yOff   = (t - 0.5) * H * 0.72;
          // project 3D spiral onto 2D with fake perspective
          const cosR = Math.cos(state.rot * 0.4);
          const x    = cx + Math.cos(angle) * radius * cosR;
          const y    = cy + yOff + Math.sin(angle) * radius * 0.18;
          const z    = Math.sin(angle); // -1..1 depth
          return { x, y, z, score: s.score, i, t };
        });

        // Grid lines
        for (let i = -6; i <= 6; i++) {
          const gx = cx + (i / 6) * W * 0.48;
          ctx.beginPath();
          ctx.moveTo(gx, cy - H * 0.5);
          ctx.lineTo(gx, cy + H * 0.5);
          ctx.strokeStyle = "rgba(124,58,237,0.04)";
          ctx.lineWidth = 0.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx - W * 0.5, cy + (i / 6) * H * 0.48);
          ctx.lineTo(cx + W * 0.5, cy + (i / 6) * H * 0.48);
          ctx.stroke();
        }

        // Spiral curve
        if (spiralPts.length > 1) {
          ctx.beginPath();
          ctx.moveTo(spiralPts[0].x, spiralPts[0].y);
          for (let i = 1; i < spiralPts.length; i++) {
            ctx.lineTo(spiralPts[i].x, spiralPts[i].y);
          }
          ctx.strokeStyle = "rgba(124,58,237,0.15)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Blocks sorted back-to-front
        const sorted = [...spiralPts].sort((a, b) => a.z - b.z);
        sorted.forEach(pt => {
          const color = scoreColor(pt.score);
          const isLatest = pt.i === n - 1;
          const depth  = clamp((pt.z + 1) / 2, 0.1, 1);
          const dotR   = clamp((isLatest ? 10 : 5) * depth, 2, 14);
          const alpha  = clamp(0.3 + depth * 0.7, 0, 1);

          // Glow
          const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, dotR * 3);
          g.addColorStop(0, color + Math.round(alpha * 80).toString(16).padStart(2, "0"));
          g.addColorStop(1, color + "00");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, dotR * 3, 0, Math.PI * 2);
          ctx.fill();

          // Dot
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, dotR, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Pulse latest
          if (isLatest) {
            const pulse = (Math.sin(state.t * 2.5) + 1) / 2;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, dotR + 4 + pulse * 8, 0, Math.PI * 2);
            ctx.strokeStyle = color + Math.round((0.6 - pulse * 0.5) * 255).toString(16).padStart(2, "0");
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });

        // Hex rings center
        for (let ring = 0; ring < 3; ring++) {
          const rr = (30 + ring * 22) * (1 + Math.sin(state.t * 0.4 + ring) * 0.04);
          ctx.beginPath();
          for (let s = 0; s <= 6; s++) {
            const a = (s / 6) * Math.PI * 2 - Math.PI / 6;
            const hx = cx + Math.cos(a) * rr;
            const hy = cy + Math.sin(a) * rr;
            s === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
          }
          ctx.strokeStyle = `rgba(124,58,237,${(0.08 - ring * 0.02).toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        state.rot += 0.004;
        state.t   += 0.03;
      } catch(e) {
        console.error("ChainViz draw error:", e);
      }
      state.raf = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      state.alive = false;
      cancelAnimationFrame(state.raf);
    };
  }, [demo, height]);

  return (
    <div style={{ width: "100%", height, position: "relative", borderRadius: 14, overflow: "hidden",
      background: "radial-gradient(ellipse at center, rgba(124,58,237,0.03), transparent 70%)" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center" }}>
        <span className="m" style={{ fontSize: 9, color: "rgba(124,58,237,0.3)", letterSpacing: "0.12em" }}>
          {sessions.length > 0 ? sessions.length + " BLOCKS SEALED" : "DEMO CHAIN"}
        </span>
      </div>
    </div>
  );
}