import { useState, useEffect } from 'react';
import { getLeaderboard, getTier } from '../api';

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(10).then(data => {
      // Deduplicate by passport_id, keep highest score
      const map = new Map();
      (data.leaderboard || []).forEach(e => {
        if (!map.has(e.passport_id) || e.total_degrees > map.get(e.passport_id).total_degrees) {
          map.set(e.passport_id, e);
        }
      });
      setEntries([...map.values()].sort((a, b) => b.total_degrees - a.total_degrees));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-500">Loading leaderboard...</div>;

  return (
    <div className="space-y-3">
      {entries.map((e, i) => {
        const tier = getTier(e.score);
        return (
          <div key={e.passport_id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold" style={{ color: tier.color }}>#{i + 1}</span>
              <div>
                <div className="font-mono text-sm text-slate-400">
                  {e.passport_id.slice(0, 8)}...
                </div>
                <div className="text-xs text-slate-500">
                  {(e.total_degrees / 360).toFixed(1)} revolutions
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: tier.color }}>{e.score}</div>
              <span className="tier-badge" style={{ color: tier.color, background: tier.bg }}>
                {tier.name}
              </span>
            </div>
          </div>
        );
      })}
      {entries.length === 0 && (
        <div className="text-center py-8 text-slate-500">No passports yet. Be the first.</div>
      )}
    </div>
  );
}
