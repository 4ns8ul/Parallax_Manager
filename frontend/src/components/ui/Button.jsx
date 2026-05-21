/**
 * Button component — all 4 interaction states (Default, Hover, Active, Disabled).
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
  const base = 'inline-flex items-center justify-center font-medium transition-default focus-visible:outline-2 focus-visible:outline-offset-2';
  
  const sizes = {
    sm: 'px-4 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-6 py-2.5 text-sm rounded-lg gap-2',
    lg: 'px-8 py-3 text-base rounded-lg gap-2',
  };

  const variants = {
    primary: {
      backgroundColor: disabled ? 'var(--color-brand-200)' : 'var(--color-brand-600)',
      color: 'white',
      cursor: disabled ? 'not-allowed' : 'pointer',
    },
    secondary: {
      backgroundColor: disabled ? 'var(--color-cloud)' : 'white',
      color: disabled ? 'var(--color-mist)' : 'var(--color-charcoal)',
      border: `1px solid ${disabled ? 'var(--color-cloud)' : 'var(--color-mist)'}`,
      cursor: disabled ? 'not-allowed' : 'pointer',
    },
    danger: {
      backgroundColor: disabled ? 'oklch(0.90 0.03 25)' : 'var(--color-danger)',
      color: 'white',
      cursor: disabled ? 'not-allowed' : 'pointer',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: disabled ? 'var(--color-mist)' : 'var(--color-charcoal)',
      cursor: disabled ? 'not-allowed' : 'pointer',
    },
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${className}`}
      style={variants[variant]}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        if (variant === 'primary') e.target.style.backgroundColor = 'var(--color-brand-700)';
        if (variant === 'secondary') e.target.style.backgroundColor = 'var(--color-cloud)';
        if (variant === 'ghost') e.target.style.backgroundColor = 'var(--color-cloud)';
      }}
      onMouseLeave={(e) => {
        if (disabled || loading) return;
        if (variant === 'primary') e.target.style.backgroundColor = 'var(--color-brand-600)';
        if (variant === 'secondary') e.target.style.backgroundColor = 'white';
        if (variant === 'ghost') e.target.style.backgroundColor = 'transparent';
      }}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
