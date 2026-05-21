import { Bell, LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import { notificationsAPI } from '../../api';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, logout } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
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

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

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
    <header className="h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-8 font-body text-base leading-6">
      <div className="font-bold text-primary tracking-tight truncate hidden sm:block">
        {user?.roles?.[0] === 'ADMIN' ? 'Admin Console' : 'Project Management'}
      </div>

      <div className="flex-1 max-w-md mx-4 sm:mx-8">
        <div className="relative flex items-center w-full h-10 rounded-full focus-within:shadow-sm bg-surface-container-lowest border border-outline-variant overflow-hidden">
          <div className="grid place-items-center h-full w-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-xl">search</span>
          </div>
          <input className="peer h-full w-full outline-none text-sm text-on-surface pr-2 bg-transparent" placeholder="Search resources..." type="text" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors duration-200 text-on-surface-variant hover:text-on-surface relative"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-on-error rounded-full bg-error">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-surface-container-lowest rounded-xl border border-outline-variant z-50 shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                <span className="text-sm font-bold text-on-surface font-headline">Notifications</span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-medium text-primary hover:text-primary-container">
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAll} className="text-xs font-medium text-on-surface-variant hover:text-error transition-colors">
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-on-surface-variant">No notifications</p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-outline-variant last:border-b-0 ${n.status === 'UNREAD' ? 'bg-surface-container-high' : ''}`}
                  >
                    <p className="text-sm font-bold text-on-surface">{n.title}</p>
                    <p className="text-xs mt-0.5 text-on-surface-variant">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-1 py-1 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="text-left hidden sm:block pr-2">
              <p className="text-sm font-medium text-on-surface leading-tight">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider leading-tight">
                {user?.roles?.[0]}
              </p>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-48 bg-surface-container-lowest rounded-xl border border-outline-variant z-50 shadow-sm overflow-hidden">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm font-bold text-error hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
