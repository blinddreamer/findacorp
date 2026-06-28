/**
 * Public/Private segmented toggle for a profile or corp listing. When private, the
 * profile is hidden from search and direct access (enforced server-side).
 */
export default function VisibilityToggle({
  isPublic, onChange, label = 'Visibility',
}: {
  isPublic: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="stat-label">{label}</span>
      <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        {([['Public', true], ['Private', false]] as const).map(([lbl, val]) => (
          <button
            key={lbl}
            type="button"
            onClick={() => onChange(val)}
            style={{
              padding: '5px 12px', fontSize: 12, cursor: 'pointer', border: 'none',
              background: isPublic === val ? 'var(--accent-soft)' : 'var(--bg-elev)',
              color: isPublic === val ? 'var(--accent-text)' : 'var(--text-mute)',
            }}
          >
            {lbl}
          </button>
        ))}
      </div>
      <span className="muted" style={{ fontSize: 11.5 }}>
        {isPublic ? 'Visible in search & by link' : 'Hidden from search & direct links'}
      </span>
    </div>
  );
}
