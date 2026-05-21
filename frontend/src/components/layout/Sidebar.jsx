import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Receipt,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { path: '/projects', label: 'Projects', icon: FolderKanban, roles: null },
  { path: '/tasks', label: 'Tasks', icon: ListTodo, roles: null },
  { path: '/expenses', label: 'Expenses', icon: Receipt, roles: null },
  { path: '/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.some((r) => user?.roles?.includes(r))
  );

  return (
    <aside
      className={`bg-surface-container-low border-r border-outline-variant flex flex-col transition-all duration-200 ease-out ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Header */}
      <div className={`p-6 flex items-center gap-4 border-b border-outline-variant ${collapsed ? 'justify-center p-4' : ''}`}>
        <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg flex-shrink-0">
          P
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-headline font-black tracking-tight text-on-surface truncate">Parallax</h1>
            <p className="text-xs text-on-surface-variant font-medium truncate">{user?.roles?.[0] === 'ADMIN' ? 'Enterprise Admin' : user?.roles?.[0] || 'User'}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto flex flex-col p-4 gap-2 mt-4 font-body text-sm font-medium tracking-tight">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              } ${collapsed ? 'justify-center px-2' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-14 border-t border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </aside>
  );
}
