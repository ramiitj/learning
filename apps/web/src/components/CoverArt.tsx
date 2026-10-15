/**
 * Cover illustration for Issue 1: messages fall through a filter, past a
 * threshold line, into an inbox or a junk tray. Inline SVG (a few KB, no
 * request), drawn only with theme colours, and with no words in the picture,
 * so it works in every language (docs/07: no text baked into images).
 */
export function CoverArt() {
  const msg = (x: number, y: number, w: number, tone: string, rot = 0) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect width={w} height="34" rx="10" fill="var(--color-surface)" stroke={tone} strokeWidth="3" />
      <rect x="12" y="10" width={w * 0.55} height="5" rx="2.5" fill={tone} opacity="0.85" />
      <rect x="12" y="20" width={w * 0.35} height="5" rx="2.5" fill="var(--color-border-strong)" opacity="0.6" />
    </g>
  );
  return (
    <svg className="cover-art" viewBox="0 0 360 360" role="presentation" aria-hidden="true" focusable="false">
      <circle cx="180" cy="170" r="160" fill="var(--stage-predict-soft)" />
      {msg(40, 36, 96, "var(--stage-manipulate)", -8)}
      {msg(150, 18, 110, "var(--stage-hook)", 6)}
      {msg(232, 70, 92, "var(--stage-break-it)", -4)}
      {msg(96, 92, 104, "var(--stage-manipulate)", 3)}
      {/* the filter */}
      <path d="M70 150h220l-70 78v44h-80v-44z" fill="var(--color-accent)" />
      <path d="M92 164h176" stroke="var(--color-accent-ink)" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 12" opacity="0.7" />
      {/* the threshold line */}
      <line x1="40" y1="196" x2="320" y2="196" stroke="var(--stage-hook)" strokeWidth="5" strokeDasharray="14 10" strokeLinecap="round" />
      <circle cx="40" cy="196" r="9" fill="var(--stage-hook)" />
      {/* inbox and junk trays */}
      <path d="M180 272c-20 18-60 22-92 26" stroke="var(--stage-manipulate)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M180 272c20 18 60 22 92 26" stroke="var(--stage-break-it)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="30" y="286" width="110" height="46" rx="12" fill="var(--stage-manipulate-soft)" stroke="var(--stage-manipulate)" strokeWidth="3" />
      <path d="M68 309l10 10 20-20" stroke="var(--stage-manipulate)" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="220" y="286" width="110" height="46" rx="12" fill="var(--stage-break-it-soft)" stroke="var(--stage-break-it)" strokeWidth="3" />
      <path d="M262 299l22 22M284 299l-22 22" stroke="var(--stage-break-it)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
