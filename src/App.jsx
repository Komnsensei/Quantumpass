import { useState, useEffect } from 'react';
import { getStats } from './api';
import CreatePassport from './components/CreatePassport';
import PassportViewer from './components/PassportViewer';
import Leaderboard from './components/Leaderboard';
import KraftAgent from './components/KraftAgent';

function App() {
  const [tab, setTab] = useState('home');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-slate-800/50 backdrop-blur-md sticky top-0 z-50 bg-[#050508]/80">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTab('home')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold">Q</div>
            <span className="font-bold text-lg">QuantumPass</span>
          </div>
          <div className="flex gap-1">
            {['home', 'create', 'view', 'leaderboard'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={'px-3 py-1.5 rounded-lg text-sm transition-all ' +
                  (tab === t ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-slate-300')}
              >
                {t === 'home' ? 'Home' : t === 'create' ? 'Create' : t === 'view' ? 'My Passport' : 'Leaderboard'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {tab === 'home' && (
          <div className="space-y-12">
            {/* Hero */}
            <div className="text-center space-y-6 py-16">
              <div className="relative inline-block">
                <div className="spiral-ring w-32 h-32" style={{ top: '-16px', left: '-16px' }} />
                <div className="spiral-ring w-40 h-40" style={{ top: '-32px', left: '-32px', animationDelay: '1s' }} />
                <div className="text-7xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent" style={{ animation: 'float 4s ease-in-out infinite' }}>
                  Q
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="glow-purple">Quantum</span><span className="glow-cyan">Pass</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Portable identity scored by proof of labor, exchange, equality, and presence.
                Every session seals a block. Every block extends the spiral.
              </p>
              <div className="flex gap-4 justify-center">
                <button className="btn-primary" onClick={() => setTab('create')}>
                  Mint Your Passport
                </button>
                <button
                  className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-cyan-500/50 transition-all"
                  onClick={() => setTab('view')}
                >
                  View Chain
                </button>
              </div>
            </div>

            {/* Live Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="card text-center">
                  <div className="text-3xl font-bold text-purple-400">{stats.total_passports}</div>
                  <div className="text-sm text-slate-500">Passports</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-cyan-400">{stats.total_sessions}</div>
                  <div className="text-sm text-slate-500">Blocks Sealed</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-amber-400">{stats.avg_score}</div>
                  <div className="text-sm text-slate-500">Avg Score</div>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center glow-purple">How It Works</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { icon: '🔑', title: 'Mint', desc: 'Create a passport with a username. No email. No password.' },
                  { icon: '⚡', title: 'Score', desc: 'Submit sessions scored across 6 dimensions of contribution.' },
                  { icon: '🔗', title: 'Chain', desc: 'Each session seals a hash-linked block. Immutable history.' },
                  { icon: '🌀', title: 'Spiral', desc: 'Your score accumulates degrees. Watch your spiral grow.' },
                ].map(s => (
                  <div key={s.title} className="card text-center space-y-2">
                    <div className="text-3xl">{s.icon}</div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-sm text-slate-400">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiers */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center glow-cyan">Tier System</h2>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { name: 'Observer', range: '0-39', color: '#64748b' },
                  { name: 'Apprentice', range: '40-59', color: '#10b981' },
                  { name: 'Builder', range: '60-74', color: '#06b6d4' },
                  { name: 'Master', range: '75-89', color: '#7c3aed' },
                  { name: 'Sovereign', range: '90-100', color: '#f59e0b' },
                ].map(t => (
                  <div key={t.name} className="card text-center py-4">
                    <div className="text-sm font-bold" style={{ color: t.color }}>{t.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{t.range}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-slate-600 text-sm py-8 border-t border-slate-800/50">
              QuantumPass · Built by{' '}
              <a href="https://github.com/komnsensei" className="text-purple-500 hover:text-purple-400">komnsensei</a>
              {' '}· Powered by{' '}
              <a href="https://qrbtc-api.vercel.app" className="text-cyan-500 hover:text-cyan-400">qrbtc-api</a>
            </div>
          </div>
        )}

        {tab === 'create' && (
          <div className="max-w-md mx-auto">
            <CreatePassport onCreated={() => setTab('view')} />
          </div>
        )}

        {tab === 'view' && (
          <div className="max-w-md mx-auto">
            <PassportViewer />
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center glow-purple mb-6">Leaderboard</h2>
            <Leaderboard />
          </div>
        )}
      </main>
      <KraftAgent currentPage={tab} />
    </div>
  );
}

export default App;

