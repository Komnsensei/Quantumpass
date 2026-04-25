import { useState } from 'react';
import { getPassport, verifyChain, getHistory, getTier } from '../api';
import SpiralViz from './SpiralViz';

export default function PassportViewer() {
  const [apiKey, setApiKey] = useState('');
  const [passport, setPassport] = useState(null);
  const [chain, setChain] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLookup() {
    if (!apiKey.trim()) return;
    setLoading(true);
    setError('');
    try {
      const p = await getPassport(apiKey);
      if (p.error) { setError(p.error); setLoading(false); return; }
      setPassport(p);

      const [v, h] = await Promise.all([
        verifyChain(apiKey, p.id),
        getHistory(apiKey)
      ]);
      setChain(v);
      setHistory(h);
    } catch (e) {
      setError('Failed to load passport.');
    }
    setLoading(false);
  }

  if (!passport) {
    return (
      <div className="card space-y-4">
        <div className="text-center">
          <div className="text-xl glow-purple">View Passport</div>
          <div className="text-slate-400 text-sm mt-1">Enter your API key to view your chain</div>
        </div>
        {error && <div className="text-red-400 text-sm text-center">{error}</div>}
        <input
          className="input-field"
          placeholder="qrbtc_live_sk_..."
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          type="password"
        />
        <button className="btn-primary w-full" onClick={handleLookup} disabled={loading || !apiKey.trim()}>
          {loading ? 'Loading...' : 'View Chain'}
        </button>
      </div>
    );
  }

  const sessions = history?.sessions || [];
  const latest = sessions[sessions.length - 1];
  const score = latest?.score || 0;
  const degrees = latest?.total_degrees || 0;
  const tier = getTier(score);

  return (
    <div className="space-y-6">
      <div className="card text-center space-y-4">
        <div className="flex justify-center">
          <SpiralViz degrees={degrees} score={score} />
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: tier.color }}>{passport.username}</div>
          <span className="tier-badge mt-2" style={{ color: tier.color, background: tier.bg }}>
            {tier.name}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-400">{score}</div>
            <div className="text-xs text-slate-500">Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">{(degrees / 360).toFixed(1)}</div>
            <div className="text-xs text-slate-500">Revolutions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{sessions.length}</div>
            <div className="text-xs text-slate-500">Blocks</div>
          </div>
        </div>
        {chain && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className={chain.chain_intact ? 'text-emerald-400' : 'text-red-400'}>
              {chain.chain_intact ? '✓ Chain Verified' : '✗ Chain Broken'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500 font-mono text-xs">
              {chain.first_block?.slice(0, 8)}...{chain.last_block?.slice(-8)}
            </span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="text-sm font-semibold text-slate-400 mb-3">Session History</div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sessions.map((s, i) => {
            const t = getTier(s.score);
            return (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-6">#{i + 1}</span>
                  <span className="font-mono text-xs text-slate-500">{s.session_hash?.slice(0, 12)}...</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{s.degrees_delta?.toFixed(0)}°</span>
                  <span className="text-sm font-bold" style={{ color: t.color }}>{s.score}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <button className="text-sm text-slate-500 hover:text-slate-300" onClick={() => { setPassport(null); setChain(null); setHistory(null); setApiKey(''); }}>
          ← Back
        </button>
      </div>
    </div>
  );
}
