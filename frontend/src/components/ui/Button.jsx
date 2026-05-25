/**
 * Button — all 4 interaction states (Default, Hover, Active, Disabled).
 * Pill shape for primary. 8px radius for secondary/ghost.
 * Horizontal padding 2-3x vertical (anti-vibe-coding rule).
 */

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const sizeStyles = {
    sm: { padding: '6px 16px', fontSize: '12px', gap: '6px', borderRadius: '6px' },
    md: { padding: '9px 22px', fontSize: '13px', gap: '8px', borderRadius: '9999px' },
    lg: { padding: '11px 28px', fontSize: '14px', gap: '8px', borderRadius: '9999px' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: disabled ? 'var(--color-brand-200)' : 'var(--color-primary)',
      color: 'var(--color-on-primary)',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 700,
      boxShadow: disabled ? 'none' : '0 1px 2px oklch(0.15 0.01 260 / 0.08)',
    },
    secondary: {
      backgroundColor: disabled ? 'var(--color-cloud)' : 'var(--color-surface-container-lowest)',
      color: disabled ? 'var(--color-mist)' : 'var(--color-charcoal)',
      border: `1px solid ${disabled ? 'var(--color-cloud)' : 'var(--color-outline-variant)'}`,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 600,
    },
    danger: {
      backgroundColor: disabled ? 'oklch(0.90 0.03 25)' : 'var(--color-error)',
      color: 'var(--color-on-error)',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 700,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: disabled ? 'var(--color-mist)' : 'var(--color-charcoal)',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 500,
    },
  };

  const hoverStyles = {
    primary: { backgroundColor: 'var(--color-brand-700)' },
    secondary: { backgroundColor: 'var(--color-surface-container-high)' },
    danger: { backgroundColor: 'oklch(0.38 0.18 25)' },
    ghost: { backgroundColor: 'var(--color-surface-container-high)' },
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '-0.01em',
    transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
    outline: 'none',
    opacity: disabled ? 0.6 : 1,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        const hover = hoverStyles[variant];
        if (hover?.backgroundColor) e.target.style.backgroundColor = hover.backgroundColor;
      }}
      onMouseLeave={(e) => {
        if (disabled || loading) return;
        e.target.style.backgroundColor = variantStyles[variant].backgroundColor;
      }}
      onMouseDown={(e) => {
        if (disabled || loading) return;
        e.target.style.transform = 'scale(0.97)';
      }}
      onMouseUp={(e) => {
        if (disabled || loading) return;
        e.target.style.transform = 'scale(1)';
      }}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '9999px',
            animation: 'spin 0.6s linear infinite',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  );
}
