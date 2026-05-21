export default function Select({ label, id, options, error, required, disabled, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>
          {label}
          {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
        </label>
      )}
      <select
        id={id}
        name={id}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm rounded-md border transition-default focus:outline-none appearance-none bg-white"
        style={{
          borderColor: error ? 'var(--color-danger)' : 'var(--color-mist)',
          color: disabled ? 'var(--color-ash)' : 'var(--color-ink)',
          backgroundColor: disabled ? 'var(--color-cloud)' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '36px',
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
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}
