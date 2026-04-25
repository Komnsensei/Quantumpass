import { useState, useRef, useEffect } from 'react';

export default function KraftAgent({ currentPage }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Kraft-01 online. I monitor QuantumPass. Ask me anything — passports, scores, chain verification, errors. I'm here." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const r = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.filter(m => m.role !== 'assistant' || updated.indexOf(m) > 0).map(m => ({ role: m.role, content: m.content })),
          context: 'User is on page: ' + (currentPage || 'home')
        })
      });
      const data = await r.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'No response' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failed. Try again.' }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating Orb */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          border: 'none', cursor: 'pointer',
          boxShadow: open ? '0 0 30px rgba(124,58,237,0.6)' : '0 0 20px rgba(124,58,237,0.3)',
          transition: 'all 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24
        }}
      >
        {open ? '✕' : '⚡'}
      </button>

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 9998,
          width: 380, maxHeight: 500,
          background: '#0a0a0f', border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(124,58,237,0.2)',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.05))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)'
              }} />
              <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>Kraft-01</span>
              <span style={{ color: '#64748b', fontSize: 11 }}>QuantumPass Support</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 16px',
            maxHeight: 340, display: 'flex', flexDirection: 'column', gap: 10
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))'
                  : 'rgba(255,255,255,0.05)',
                color: '#e2e8f0',
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start', padding: '10px 14px',
                borderRadius: '14px 14px 14px 4px',
                background: 'rgba(255,255,255,0.05)',
                color: '#64748b', fontSize: 13
              }}>
                ⚡ thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid rgba(124,58,237,0.2)',
            display: 'flex', gap: 8
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask Kraft-01..."
              style={{
                flex: 1, background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 10, padding: '10px 14px',
                color: '#e2e8f0', fontSize: 13, outline: 'none'
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                border: 'none', borderRadius: 10,
                padding: '0 16px', cursor: 'pointer',
                color: 'white', fontWeight: 600, fontSize: 13,
                opacity: loading || !input.trim() ? 0.5 : 1
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
