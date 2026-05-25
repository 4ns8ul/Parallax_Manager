import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Receipt,
  Users,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { path: '/projects', label: 'Projects', icon: FolderKanban, roles: null },
  { path: '/tasks', label: 'Tasks', icon: ListTodo, roles: null },
  { path: '/expenses', label: 'Expenses', icon: Receipt, roles: null },
  { path: '/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.some((r) => user?.roles?.includes(r))
  );

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
  };

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '264px',
        backgroundColor: 'var(--color-surface-container-low)',
        borderRight: '1px solid var(--color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s cubic-bezier(0.2, 0, 0, 1)',
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '20px 16px' : '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--color-outline-variant)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '15px',
            fontFamily: "'Inter', sans-serif",
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}
        >
          PE
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <h1
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--color-on-surface)',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Enterprise Precision
            </h1>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--color-on-surface-variant)',
                lineHeight: 1.3,
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '0.01em',
              }}
            >
              {user?.roles?.[0] === 'ADMIN' ? 'Admin Management' : user?.roles?.[0] || 'User'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          gap: '2px',
          marginTop: '4px',
        }}
      >
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '10px' : '10px 14px',
              borderRadius: '8px',
              transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
              backgroundColor: isActive ? 'var(--color-secondary-container)' : 'transparent',
              color: isActive ? 'var(--color-on-secondary-container)' : 'var(--color-on-surface-variant)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.01em',
              textDecoration: 'none',
              justifyContent: collapsed ? 'center' : 'flex-start',
            })}
            className="sidebar-nav-item"
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: '1px solid var(--color-outline-variant)', padding: '8px 12px' }}>
        {/* Sign Out */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '10px' : '10px 14px',
            borderRadius: '8px',
            width: '100%',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-on-surface-variant)',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          className="sidebar-nav-item"
        >
          <LogOut size={20} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-on-surface-variant)',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
            marginTop: '2px',
          }}
          className="sidebar-nav-item"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <style>{`
        .sidebar-nav-item:hover {
          background-color: var(--color-surface-container-high) !important;
        }
      `}</style>
    </aside>
  );
}
