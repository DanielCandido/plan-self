export function PlanSelfLogo() {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-xl"
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
        boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="6" height="14" rx="1.5" fill="white" fillOpacity="0.9" />
        <rect x="11" y="3" width="6" height="8" rx="1.5" fill="white" fillOpacity="0.6" />
      </svg>
    </div>
  );
}
