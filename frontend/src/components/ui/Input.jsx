/**
 * Input — with label, error display, and all 4 states.
 * 8px border-radius, OKLCH focus ring.
 */

export default function Input({
  label,
  id,
  error,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} className={className}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-on-surface-variant)',
            fontFamily: "'Public Sans', sans-serif",
            letterSpacing: '0.01em',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-error)', marginLeft: '2px' }}> *</span>}
        </label>
      )}
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '9px 12px',
          fontSize: '13px',
          borderRadius: '8px',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-outline-variant)'}`,
          color: disabled ? 'var(--color-ash)' : 'var(--color-on-surface)',
          backgroundColor: disabled ? 'var(--color-surface-container-high)' : 'var(--color-surface-container-lowest)',
          cursor: disabled ? 'not-allowed' : 'text',
          outline: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          fontFamily: "'Inter', sans-serif",
          opacity: disabled ? 0.7 : 1,
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = 'var(--color-primary)';
            e.target.style.boxShadow = '0 0 0 3px oklch(0.37 0.18 260 / 0.12)';
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-outline-variant)';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <p style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 500 }}>
          {error}
        </p>
      )}
    </div>
  );
}
