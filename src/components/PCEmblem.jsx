
export default function PCEmblem({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="pcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c8c8e0" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#9090b8" />
        </linearGradient>
        <filter id="pcGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* X shape */}
      <line x1="7" y1="7" x2="25" y2="25" stroke="url(#pcGrad)" strokeWidth="2.5"
        strokeLinecap="round" filter="url(#pcGlow)" />
      <line x1="7" y1="25" x2="25" y2="7" stroke="url(#pcGrad)" strokeWidth="2.5"
        strokeLinecap="round" filter="url(#pcGlow)" />
      {/* P curve */}
      <path d="M 17 7 L 17 18 M 17 7 Q 26 7 26 12 Q 26 18 17 18"
        stroke="url(#pcGrad)" strokeWidth="2.5" strokeLinecap="round"
        strokeLinejoin="round" fill="none" filter="url(#pcGlow)" />
      {/* Outer subtle ring */}
      <circle cx="16" cy="16" r="14" stroke="rgba(139,0,255,0.15)" strokeWidth="1" />
    </svg>
  );
}
