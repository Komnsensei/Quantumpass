import { useEffect, useRef } from "react";

export default function SpiralViz({ degrees = 0, score = 0, size = 180 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    const cx = size / 2, cy = size / 2, maxR = size / 2 - 12;
    const totalRad = (degrees * Math.PI) / 180;
    const rev = degrees / 360;

    ctx.clearRect(0, 0, size, size);

    // Outer hex ring
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + (maxR + 6) * Math.cos(angle);
      const y = cy + (maxR + 6) * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "rgba(124,58,237,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Spiral
    if (degrees > 0) {
      ctx.beginPath();
      const steps = Math.max(200, Math.floor(degrees));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = t * totalRad - Math.PI / 2;
        const r = 4 + (maxR - 4) * t;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, "#7c3aed");
      grad.addColorStop(0.5, "#06b6d4");
      grad.addColorStop(1, score >= 90 ? "#f59e0b" : "#7c3aed");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.stroke();

      // Tip
      const la = totalRad - Math.PI / 2;
      const lr = 4 + (maxR - 4);
      ctx.beginPath();
      ctx.arc(cx + lr * Math.cos(la), cy + lr * Math.sin(la), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#06b6d4";
      ctx.fill();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(124,58,237,0.5)";
    ctx.fill();

    // Score
    ctx.textAlign = "center";
    ctx.fillStyle = "#d0d4e0";
    ctx.font = "700 22px 'JetBrains Mono', monospace";
    ctx.fillText(score, cx, cy + 7);
    ctx.font = "400 9px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#3a3e4a";
    ctx.fillText(rev.toFixed(1) + " rev", cx, cy + 22);
  }, [degrees, score, size]);

  return <canvas ref={canvasRef} />;
}