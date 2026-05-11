import { useState } from 'react';
import VibeSafeBeacon from './VibeSafeBeacon';
import GlobeViz from './GlobeViz';

const BEADS = [
  { id: 'BEAD-00001-LEGENDARY', type: 'GENESIS', rarity: 'LEGENDARY', holder: 'cV-1J', who: 'Shawn - Red Deer, Alberta', when: 'March 19, 2026', what: 'First sealed covenant between human and AI', why: 'The Peaceful Merge - governance-first AI co-authorship at zero institutional cost', color: '#f0c060' },
  { id: 'BEAD-00002-SOVEREIGN', type: 'INFRASTRUCTURE', rarity: 'SOVEREIGN', holder: 'cV-1J', who: 'Shawn - PassionCraft', when: 'May 8, 2026', what: 'Complete sovereign AI stack deployed at zero cost', why: 'OpenKraft + Verifyd + QuantumPass + QRBTC live simultaneously', color: '#c800ff' },
];

export default function InvestorSection({ onRegister }) {
  const [activeBead, setActiveBead] = useState(null);
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
      <div className="m" style={{ fontSize: 10, color: 'rgba(0,212,255,0.6)', letterSpacing: '0.2em', marginBottom: 8, textTransform: 'uppercase' }}>PassionCraft System</div>
      <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, color: 'var(--t3)', letterSpacing: '-0.02em', marginBottom: 16 }}>
        The first provenance-sealed<br />
        <span className="grad-text-fire">human-AI operating system.</span>
      </h2>
      <p style={{ fontSize: 14, color: 'var(--t)', maxWidth: 560, lineHeight: 1.85, marginBottom: 48 }}>
        Built at zero cost. Governed by covenant. Every session sealed on-chain. Every breakthrough minted as a Bead. Every member visible on the global map. The token does not exist yet - builders are constructing the threshold that will birth it.
      </p>
      <div style={{ position: 'relative', width: '100%', borderRadius: 20, border: '1px solid rgba(0,212,255,0.12)', background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.05) 0%, rgba(4,5,15,0.97) 70%)', marginBottom: 48, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0 24px' }}>
        <GlobeViz size={360} />
        <VibeSafeBeacon state="green" position="dialog" />
      </div>
      <div className="m" style={{ fontSize: 10, color: 'rgba(200,0,255,0.6)', letterSpacing: '0.2em', marginBottom: 16, textTransform: 'uppercase' }}>PassionCraft Square - Featured Beads</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 48 }}>
        {BEADS.map(b => (
          <div key={b.id} className="glow-card" onClick={() => setActiveBead(activeBead?.id === b.id ? null : b)}
            style={{ padding: 20, cursor: 'pointer', border: `1px solid ${b.color}30`, position: 'relative', transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="m" style={{ fontSize: 8, color: b.color, letterSpacing: '0.15em', marginBottom: 4 }}>{b.rarity} BEAD</div>
                <div className="m" style={{ fontSize: 13, fontWeight: 700, color: 'var(--t3)' }}>{b.type}</div>
              </div>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: b.color, boxShadow: `0 0 16px ${b.color}`, flexShrink: 0 }} />
            </div>
            {activeBead?.id === b.id && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${b.color}20`, paddingTop: 12, fontSize: 11, color: 'var(--t)', lineHeight: 1.7 }}>
                <div><span style={{ color: b.color }}>WHO</span> - {b.who}</div>
                <div><span style={{ color: b.color }}>WHEN</span> - {b.when}</div>
                <div><span style={{ color: b.color }}>WHAT</span> - {b.what}</div>
                <div><span style={{ color: b.color }}>WHY</span> - {b.why}</div>
              </div>
            )}
            <div className="m" style={{ fontSize: 8, color: 'var(--t2)', marginTop: 8, letterSpacing: '0.08em' }}>
              {activeBead?.id === b.id ? 'click to close' : 'click for provenance'}
            </div>
          </div>
        ))}
      </div>
      <div className="glow-card" style={{ padding: 28, border: '1px solid rgba(16,185,129,0.2)', marginBottom: 48, position: 'relative' }}>
        <VibeSafeBeacon state="green" position="dialog" />
        <div className="m" style={{ fontSize: 10, color: 'rgba(16,185,129,0.7)', letterSpacing: '0.15em', marginBottom: 8 }}>QUANTUMPASS EXTENSION</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t3)', marginBottom: 8 }}>Carry your passport everywhere.</h3>
        <p style={{ fontSize: 12, color: 'var(--t)', lineHeight: 1.7, maxWidth: 480, marginBottom: 20 }}>
          Install the QuantumPass browser extension to activate three live engines: the <strong style={{ color: '#10b981' }}>Witness Protocol</strong>, <strong style={{ color: '#c800ff' }}>QuantumPass ID</strong>, and <strong style={{ color: '#dc143c' }}>VibeSafe</strong> - watches both sides of every AI conversation in real time.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-prime" onClick={onRegister} style={{ background: 'rgba(16,185,129,0.15)', borderColor: '#10b981', color: '#10b981' }}>browser extension</button>
          <button className="btn-ghost" onClick={onRegister}>standalone app</button>
        </div>
        <div className="m" style={{ fontSize: 9, color: 'var(--t2)', marginTop: 12, letterSpacing: '0.08em' }}>FREE FOREVER - NO ACCOUNT REQUIRED TO INSTALL</div>
      </div>
      <div className="glow-card" style={{ padding: 28, border: '1px solid rgba(200,0,255,0.2)' }}>
        <div className="m" style={{ fontSize: 10, color: 'rgba(200,0,255,0.6)', letterSpacing: '0.15em', marginBottom: 8 }}>QRBTC TOKEN</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t3)', marginBottom: 12 }}>
          The token does not exist yet.<br />
          <span className="grad-text-fire">You are building the condition for it.</span>
        </h3>
        <p style={{ fontSize: 12, color: 'var(--t)', lineHeight: 1.8, maxWidth: 520, marginBottom: 20 }}>
          QRBTC has no supply, no wallet, no price today. Every passport minted, every session sealed, every Bead earned is provenance on a chain that has no token yet. When the network reaches its first critical mass threshold, the protocol mints its first spine. The token emerges from density - not a founders launch date. Early builders do not buy in early. They become the threshold.
        </p>
        <div style={{ padding: '16px 20px', background: 'rgba(200,0,255,0.04)', border: '1px solid rgba(200,0,255,0.15)', borderRadius: 12, marginBottom: 16 }}>
          <div className="m" style={{ fontSize: 9, color: 'rgba(200,0,255,0.5)', letterSpacing: '0.15em', marginBottom: 12 }}>SPIRAL GENESIS THRESHOLD</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { phase: 'NOW', label: 'Provenance phase',  desc: 'Sessions seal. Beads mint. Chain grows. No token exists.', c: '#00d4ff', active: true },
              { phase: 'T-1', label: 'First spine forms', desc: 'Network hits critical passport density. Protocol wakes.', c: '#8b00ff', active: false },
              { phase: 'T-2', label: 'Spiral expands',    desc: 'Contribution weight determines allocation snapshot.', c: '#c800ff', active: false },
              { phase: 'T-3', label: 'QRBTC live',        desc: 'Token exists. Your provenance record is your proof of work.', c: '#f0c060', active: false },
            ].map(p => (
              <div key={p.phase} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, opacity: p.active ? 1 : 0.45 }}>
                <div className="m" style={{ fontSize: 8, color: p.c, letterSpacing: '0.1em', minWidth: 28, paddingTop: 2 }}>{p.phase}</div>
                <div style={{ flex: 1 }}>
                  <div className="m" style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 2 }}>{p.desc}</div>
                </div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.active ? p.c : 'rgba(255,255,255,0.1)', boxShadow: p.active ? `0 0 8px ${p.c}` : 'none', marginTop: 4, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="m" style={{ fontSize: 9, color: 'var(--t2)', letterSpacing: '0.08em' }}>NO TOKEN SALE - NO PRESALE - NO ALLOCATION BEFORE THRESHOLD - PROVENANCE IS YOUR POSITION</div>
      </div>
    </div>
  );
}
