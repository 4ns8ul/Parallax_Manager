import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import { notificationsAPI } from '../../api';
import toast from 'react-hot-toast';

export default function Header() {
  const { user } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsAPI.list();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const clearAll = async () => {
    try {
      await notificationsAPI.clearAll();
      setUnreadCount(0);
      setNotifications([]);
      setNotifOpen(false);
      toast.success('Notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-outline-variant)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        fontFamily: "'Inter', sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Page label */}
      <div
        style={{
          fontWeight: 700,
          fontSize: '14px',
          color: 'var(--color-primary)',
          letterSpacing: '-0.01em',
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        {user?.roles?.[0] === 'ADMIN' ? 'Parallax Enterprises' : 'Project Management'}
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: '400px', margin: '0 24px' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            height: '36px',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            overflow: 'hidden',
            transition: 'box-shadow 0.15s ease',
          }}
        >
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              width: '40px',
              color: 'var(--color-on-surface-variant)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
          </div>
          <input
            style={{
              height: '100%',
              width: '100%',
              outline: 'none',
              fontSize: '13px',
              color: 'var(--color-on-surface)',
              paddingRight: '12px',
              backgroundColor: 'transparent',
              border: 'none',
              fontFamily: "'Inter', sans-serif",
            }}
            placeholder="Search resources..."
            type="text"
          />
        </div>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-on-surface-variant)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              position: 'relative',
            }}
            className="header-icon-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 800,
                  color: 'var(--color-on-error)',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-error)',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '44px',
                width: '320px',
                maxHeight: '384px',
                overflowY: 'auto',
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: '12px',
                border: '1px solid var(--color-outline-variant)',
                zIndex: 50,
                boxShadow: '0 4px 16px oklch(0.15 0.01 260 / 0.10)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-outline-variant)',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                  Notifications
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {notifications.length === 0 ? (
                <p style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
                  No notifications
                </p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--color-outline-variant)',
                      backgroundColor: n.status === 'UNREAD' ? 'var(--color-surface-container-high)' : 'transparent',
                    }}
                  >
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>{n.title}</p>
                    <p style={{ fontSize: '11px', marginTop: '2px', color: 'var(--color-on-surface-variant)' }}>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-primary-container)',
              color: 'var(--color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div style={{ display: 'none' }} className="sm-show">
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)', lineHeight: 1.2 }}>
              {user?.first_name} {user?.last_name}
            </p>
            <p
              style={{
                fontSize: '10px',
                color: 'var(--color-on-surface-variant)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                lineHeight: 1.2,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {user?.roles?.[0]}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .header-icon-btn:hover {
          background-color: var(--color-surface-container-high) !important;
        }
        @media (min-width: 640px) {
          .sm-show { display: block !important; }
        }
      `}</style>
    </header>
  );
}
