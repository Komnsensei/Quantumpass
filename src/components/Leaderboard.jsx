import { useState, useEffect } from "react";
import { getLeaderboard, getTier } from "../api";

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(20).then(data => {
      const map = new Map();
      (data || []).forEach(e => {
        if (!map.has(e.passport_id) || e.total_degrees > map.get(e.passport_id).total_degrees) {
          map.set(e.passport_id, e);
        }
      });
      setEntries([...map.values()].sort((a, b) => b.total_degrees - a.total_degrees));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="m" style={{ textAlign: "center", padding: 40, color: "var(--t2)", fontSize: 11 }}>loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Header row */}
      <div style={{ display: "flex", padding: "0 16px 8px", borderBottom: "1px solid var(--b)" }}>
        <span className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.12em", width: 32 }}>RANK</span>
        <span className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.12em", flex: 1 }}>PASSPORT</span>
        <span className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.12em", width: 60, textAlign: "right" }}>REV</span>
        <span className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.12em", width: 60, textAlign: "right" }}>SCORE</span>
        <span className="m" style={{ fontSize: 8, color: "var(--t2)", letterSpacing: "0.12em", width: 70, textAlign: "right" }}>TIER</span>
      </div>

      {entries.map((e, i) => {
        const tier = getTier(e.score);
        return (
          <div key={e.passport_id} className="card" style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderRadius: 6 }}>
            <span className="m" style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? "var(--a)" : "var(--t2)", width: 32 }}>{i + 1}</span>
            <span className="m" style={{ fontSize: 11, color: "var(--t)", flex: 1 }}>{e.passport_id.slice(0, 12)}...</span>
            <span className="m" style={{ fontSize: 10, color: "var(--t2)", width: 60, textAlign: "right" }}>{(e.total_degrees / 360).toFixed(1)}</span>
            <span className="m" style={{ fontSize: 13, fontWeight: 700, color: tier.color, width: 60, textAlign: "right" }}>{e.score}</span>
            <span style={{ width: 70, textAlign: "right" }}>
              <span className="tag" style={{ color: tier.color, background: tier.bg }}>{tier.name}</span>
            </span>
          </div>
        );
      })}

      {entries.length === 0 && (
        <div className="card" style={{ textAlign: "center", color: "var(--t2)", fontSize: 12, padding: 40 }}>
          No passports yet.
        </div>
      )}
    </div>
  );
}