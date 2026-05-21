export default function Badge({ children, variant = 'default', className = '' }) {
  const statusMap = {
    TO_DO: 'badge-todo',
    IN_PROGRESS: 'badge-in-progress',
    BLOCKED: 'badge-blocked',
    DONE: 'badge-done',
    SUBMITTED: 'badge-submitted',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
    LOW: 'badge-low',
    MEDIUM: 'badge-medium',
    HIGH: 'badge-high',
    PLANNING: 'badge-todo',
    ACTIVE: 'badge-in-progress',
    COMPLETED: 'badge-done',
    default: 'badge-todo',
  };

  const badgeClass = statusMap[variant] || statusMap.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${badgeClass} ${className}`}>
      {children}
    </span>
  );
}
