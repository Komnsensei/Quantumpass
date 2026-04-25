import { useEffect, useRef } from 'react';

export default function SpiralViz({ degrees = 0, score = 0, size = 280 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 20;
    const totalRad = (degrees * Math.PI) / 180;
    const revolutions = degrees / 360;

    // Background glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    glow.addColorStop(0, 'rgba(124,58,237,0.08)');
    glow.addColorStop(1, 'rgba(6,182,212,0.02)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    // Draw spiral
    ctx.beginPath();
    const steps = Math.max(500, Math.floor(degrees * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * totalRad - Math.PI / 2;
      const r = 8 + (maxR - 8) * t;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#7c3aed');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, score >= 90 ? '#f59e0b' : '#7c3aed');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#7c3aed';
    ctx.fill();

    // Tip dot
    const tipAngle = totalRad - Math.PI / 2;
    const tipR = 8 + (maxR - 8);
    const tipX = cx + (degrees > 0 ? tipR * Math.cos(tipAngle) * (degrees / (Math.max(degrees, 360))) : 0);
    const tipY = cy + (degrees > 0 ? tipR * Math.sin(tipAngle) * (degrees / (Math.max(degrees, 360))) : 0);

    if (degrees > 0) {
      const lastT = 1;
      const lastAngle = lastT * totalRad - Math.PI / 2;
      const lastR = 8 + (maxR - 8) * lastT;
      const lx = cx + lastR * Math.cos(lastAngle);
      const ly = cy + lastR * Math.sin(lastAngle);

      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Center text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px Inter, system-ui';
    ctx.fillText(score, cx, cy + 10);
    ctx.font = '11px Inter, system-ui';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(revolutions.toFixed(1) + ' rev', cx, cy + 28);

  }, [degrees, score, size]);

  return <canvas ref={canvasRef} style={{ borderRadius: '50%' }} />;
}
