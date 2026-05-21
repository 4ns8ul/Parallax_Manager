/**
 * Input component — with label, error display, and all 4 states.
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
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium"
          style={{ color: 'var(--color-charcoal)' }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
        </label>
      )}
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm rounded-md border transition-default focus:outline-none"
        style={{
          borderColor: error ? 'var(--color-danger)' : 'var(--color-mist)',
          color: disabled ? 'var(--color-ash)' : 'var(--color-ink)',
          backgroundColor: disabled ? 'var(--color-cloud)' : 'white',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = 'var(--color-brand-500)';
            e.target.style.boxShadow = '0 0 0 3px oklch(0.50 0.12 250 / 0.1)';
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-mist)';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
