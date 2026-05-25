export default function NotFoundPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          backgroundColor: 'var(--color-surface-container-high)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '28px', color: 'var(--color-on-surface-variant)' }}
        >
          error_outline
        </span>
      </div>
      <h1
        style={{
          fontSize: '48px',
          fontWeight: 800,
          color: 'var(--color-on-surface)',
          marginBottom: '8px',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '-0.04em',
        }}
      >
        404
      </h1>
      <p
        style={{
          color: 'var(--color-on-surface-variant)',
          marginBottom: '24px',
          fontSize: '14px',
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/dashboard"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-on-primary)',
          padding: '9px 20px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '13px',
          fontFamily: "'Inter', sans-serif",
          textDecoration: 'none',
          transition: 'background-color 0.15s ease',
        }}
      >
        Return to Dashboard
      </a>
    </div>
  );
}
