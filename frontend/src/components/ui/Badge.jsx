export default function Badge({ children, variant = 'default', className = '' }) {
  const statusMap = {
    TO_DO:       { bg: 'oklch(0.94 0.005 260)', fg: 'oklch(0.38 0.03 260)' },
    IN_PROGRESS: { bg: 'oklch(0.92 0.03 260)',  fg: 'oklch(0.30 0.16 260)' },
    REVIEW:      { bg: 'oklch(0.92 0.04 70)',   fg: 'oklch(0.40 0.14 70)' },
    BLOCKED:     { bg: 'oklch(0.94 0.04 25)',   fg: 'oklch(0.40 0.14 25)' },
    DONE:        { bg: 'oklch(0.92 0.04 155)',  fg: 'oklch(0.35 0.12 155)' },
    SUBMITTED:   { bg: 'oklch(0.92 0.03 260)',  fg: 'oklch(0.30 0.16 260)' },
    APPROVED:    { bg: 'oklch(0.92 0.04 155)',  fg: 'oklch(0.35 0.12 155)' },
    REJECTED:    { bg: 'oklch(0.94 0.04 25)',   fg: 'oklch(0.40 0.14 25)' },
    LOW:         { bg: 'oklch(0.92 0.04 155)',  fg: 'oklch(0.35 0.12 155)' },
    MEDIUM:      { bg: 'oklch(0.92 0.04 70)',   fg: 'oklch(0.40 0.14 70)' },
    HIGH:        { bg: 'oklch(0.94 0.04 25)',   fg: 'oklch(0.40 0.14 25)' },
    PLANNING:    { bg: 'oklch(0.94 0.005 260)', fg: 'oklch(0.38 0.03 260)' },
    ACTIVE:      { bg: 'oklch(0.92 0.03 260)',  fg: 'oklch(0.30 0.16 260)' },
    COMPLETED:   { bg: 'oklch(0.92 0.04 155)',  fg: 'oklch(0.35 0.12 155)' },
    default:     { bg: 'oklch(0.94 0.005 260)', fg: 'oklch(0.38 0.03 260)' },
  };

  const colors = statusMap[variant] || statusMap.default;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: "'Public Sans', sans-serif",
        letterSpacing: '0.02em',
        borderRadius: '9999px',
        backgroundColor: colors.bg,
        color: colors.fg,
        lineHeight: 1.4,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}
