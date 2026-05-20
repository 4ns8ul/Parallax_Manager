import React from 'react';
import { useStitch } from '../../context/StitchContext';
import { 
  LayoutDashboard, 
  FolderGit2, 
  CheckSquare, 
  Receipt, 
  Bell, 
  History, 
  User, 
  LogOut 
} from 'lucide-react';

export const Sidebar = ({ activePage, setActivePage }) => {
  const { role, logout, notifications } = useStitch();

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { id: 'projects', label: 'Projects', icon: FolderGit2, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { id: 'expenses', label: 'Expenses', icon: Receipt, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'], badge: unreadCount },
    { id: 'audit-logs', label: 'Audit Logs', icon: History, roles: ['ADMIN'] },
    { id: 'profile', label: 'My Profile', icon: User, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-violet-500/20">
          T
        </div>
        <div>
          <h1 className="font-semibold text-lg tracking-wide bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">TEMS Suite</h1>
          <span className="text-xs text-slate-500 font-medium">Apex Consulting</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems
          .filter(item => item.roles.includes(role))
          .map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-violet-600/20 to-emerald-500/5 text-violet-400 border border-violet-500/20 shadow-inner' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700">
              {role?.slice(0, 1)}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Active Role</p>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/10 text-violet-400 uppercase tracking-wide border border-violet-500/20">
                {role}
              </span>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
