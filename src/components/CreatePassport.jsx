import { useState } from 'react';
import { createPassport, createApiKey } from '../api';

export default function CreatePassport({ onCreated }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      const passport = await createPassport(username.trim());
      if (passport.error) {
        setError(passport.error);
        setLoading(false);
        return;
      }

      const key = await createApiKey(passport.id);
      setResult({
        passport_id: passport.id,
        username: passport.username,
        api_key: key.api_key,
        scopes: key.scopes,
        tier: key.tier
      });
      if (onCreated) onCreated(result);
    } catch (e) {
      setError('Failed to create passport. Try again.');
    }
    setLoading(false);
  }

  if (result) {
    return (
      <div className="card space-y-4">
        <div className="text-center">
          <div className="text-2xl glow-cyan">Passport Created</div>
          <div className="text-slate-400 text-sm mt-1">Save your API key — it will never be shown again</div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Username</label>
            <div className="font-mono text-cyan-400">{result.username}</div>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Passport ID</label>
            <div className="font-mono text-xs text-slate-300 break-all">{result.passport_id}</div>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">API Key</label>
            <div className="font-mono text-xs text-amber-400 break-all bg-amber-400/5 p-3 rounded-lg border border-amber-400/20">
              {result.api_key}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Scopes</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {(result.scopes || []).map(s => (
                <span key={s} className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20">{s}</span>
              ))}
            </div>
          </div>
        </div>
        <button className="btn-primary w-full" onClick={() => {
          navigator.clipboard.writeText(result.api_key);
        }}>
          Copy API Key
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="text-center">
        <div className="text-xl glow-purple">Create Your Passport</div>
        <div className="text-slate-400 text-sm mt-1">Choose a username. Get a portable identity.</div>
      </div>
      {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      <input
        className="input-field"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
        maxLength={32}
      />
      <button
        className="btn-primary w-full"
        onClick={handleCreate}
        disabled={loading || !username.trim()}
      >
        {loading ? 'Creating...' : 'Mint Passport'}
      </button>
      <div className="text-xs text-slate-600 text-center">
        Free tier · 1,000 requests/day · No email required
      </div>
    </div>
  );
}
