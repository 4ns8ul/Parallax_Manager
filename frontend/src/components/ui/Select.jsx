export default function Select({ label, id, options, error, required, disabled, className = '', ...props }) {
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
      <select
        id={id}
        name={id}
        required={required}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '9px 36px 9px 12px',
          fontSize: '13px',
          borderRadius: '8px',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-outline-variant)'}`,
          color: disabled ? 'var(--color-ash)' : 'var(--color-on-surface)',
          backgroundColor: disabled ? 'var(--color-surface-container-high)' : 'var(--color-surface-container-lowest)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          appearance: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          fontFamily: "'Inter', sans-serif",
          opacity: disabled ? 0.7 : 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737686' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
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
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 500 }}>
          {error}
        </p>
      )}
    </div>
  );
}
