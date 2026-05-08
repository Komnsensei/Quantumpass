
export default function EntanglementOrbs({ opacity = 0.4 }) {
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", opacity
    }}>
      {/* Left orb — purple */}
      <div className="orb-left" style={{
        width: 420, height: 420,
        position: "absolute", left: "8%", top: "50%",
        transform: "translateY(-50%)"
      }} />
      {/* Right orb — cyan */}
      <div className="orb-right" style={{
        width: 380, height: 380,
        position: "absolute", right: "8%", top: "50%",
        transform: "translateY(-50%)"
      }} />
      {/* Bridge */}
      <div className="entangle-bridge" style={{
        position: "absolute",
        left: "28%", right: "28%",
        top: "50%", transform: "translateY(-50%)",
        height: 2,
        background: "linear-gradient(90deg, rgba(139,0,255,0.6), rgba(255,255,255,0.8), rgba(0,212,255,0.6))",
        filter: "blur(1px)",
        boxShadow: "0 0 12px rgba(255,255,255,0.4), 0 0 30px rgba(139,0,255,0.3)"
      }} />
      {/* Bridge particles */}
      {[0.35, 0.45, 0.5, 0.55, 0.65].map((pos, i) => (
        <div key={i} style={{
          position: "absolute",
          left: (pos * 100) + "%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: i === 2 ? 10 : 6,
          height: i === 2 ? 10 : 6,
          borderRadius: "50%",
          background: i === 2 ? "white" : (i < 2 ? "rgba(139,0,255,0.8)" : "rgba(0,212,255,0.8)"),
          boxShadow: i === 2
            ? "0 0 20px rgba(255,255,255,0.9), 0 0 40px rgba(139,0,255,0.5)"
            : `0 0 10px ${i < 2 ? "rgba(200,0,255,0.7)" : "rgba(0,212,255,0.7)"}`,
          animation: `entangle-flow ${2 + i * 0.3}s ease-in-out infinite`,
          animationDelay: i * 0.2 + "s"
        }} />
      ))}
    </div>
  );
}
