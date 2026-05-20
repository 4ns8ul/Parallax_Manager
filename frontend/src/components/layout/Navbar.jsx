import React from 'react';
import { useStitch } from '../../context/StitchContext';
import { Briefcase, ChevronDown } from 'lucide-react';

export const Navbar = ({ activePage }) => {
  const { user, projects, selectedProject, setSelectedProject } = useStitch();

  // Page titles map
  const pageTitles = {
    'dashboard': 'Analytics Dashboard',
    'projects': 'Project Workspaces',
    'tasks': 'Task Board',
    'expenses': 'Expense Receipts',
    'notifications': 'System Notifications',
    'audit-logs': 'Security Audit Trail',
    'profile': 'My Settings'
  };

  return (
    <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 z-10">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-wide">
          {pageTitles[activePage] || 'TEMS'}
        </h2>
      </div>

      {/* Right-Side Actions */}
      <div className="flex items-center space-x-6">
        {/* Workspace/Project Selector */}
        {projects.length > 0 && (
          <div className="relative flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 hover:border-violet-500/40 transition-colors">
            <Briefcase className="w-4 h-4 text-violet-400 mr-2" />
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const proj = projects.find(p => p.id === parseInt(e.target.value));
                if (proj) setSelectedProject(proj);
              }}
              className="bg-transparent text-sm font-medium text-slate-200 outline-none pr-6 appearance-none cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-800 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
          </div>
        )}

        {/* Hello Profile Greetings */}
        {user && (
          <div className="flex items-center space-x-3 border-l border-slate-800 pl-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-200">
                {user.firstName || 'Developer'}
              </p>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                {user.email}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
