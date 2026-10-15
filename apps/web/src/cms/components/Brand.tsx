/** The console carries the platform's name, not the CMS vendor's. */
export function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Mark size={40} />
      <div>
        <div style={{ fontWeight: 800, fontSize: 22 }}>Learning Magazine</div>
        <div style={{ opacity: 0.7 }}>Creator Console</div>
      </div>
    </div>
  );
}

export function Icon() {
  return <Mark size={24} />;
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#4338CA" />
      <circle cx="16" cy="13" r="6" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M16 19v8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
