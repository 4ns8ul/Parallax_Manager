import React, { useState, useEffect } from 'react';
import { useStitch } from '../context/StitchContext';
import { 
  Plus, 
  UserPlus, 
  Trash2, 
  CircleDollarSign, 
  FolderPlus, 
  Briefcase 
} from 'lucide-react';

export default function Projects() {
  const { role, projects, fetchProjects } = useStitch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Create project form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [projectManagerId, setProjectManagerId] = useState('1'); // Default seed Admin ID
  
  // Member assignment state
  const [assignProjectId, setAssignProjectId] = useState(null);
  const [assignUserId, setAssignUserId] = useState('');

  // Fetch users for manager selector
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    fetchProjects();
    
    // Load employee list for project creation/assignments
    fetch('/api/v1/users')
      .then(res => res.ok ? res.json() : [])
      .then(data => setUsersList(data))
      .catch(err => console.error("Error loading user lists:", err));
  }, [fetchProjects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName || !projectBudget) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
          total_budget: parseFloat(projectBudget),
          manager_id: parseInt(projectManagerId)
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create project");
      }

      setProjectName('');
      setProjectDesc('');
      setProjectBudget('');
      setShowCreateModal(false);
      fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMember = async (e) => {
    e.preventDefault();
    if (!assignProjectId || !assignUserId) return;

    try {
      const res = await fetch(`/api/v1/projects/${assignProjectId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(assignUserId) })
      });

      if (res.ok) {
        setAssignProjectId(null);
        setAssignUserId('');
        fetchProjects();
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to assign member");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project workspace? All associated tasks will be permanently removed.")) return;

    try {
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 overflow-y-auto h-full pb-16 pr-2">
      {/* Title Header Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Active Workspaces</h3>
          <p className="text-xs text-slate-400">Configure corporate projects, allocate budget caps, and assign employee teams.</p>
        </div>
        {role === 'ADMIN' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 text-white text-xs font-semibold hover:from-violet-500 hover:to-emerald-400 shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 active:scale-95 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Initialize Workspace</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="glass-panel p-6 flex flex-col justify-between space-y-4 hover:border-violet-500/30 transition-all duration-300">
            {/* Upper Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">{project.name}</h4>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">ID: {project.id}</span>
                  </div>
                </div>
                {role === 'ADMIN' && (
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">{project.description || 'No description provided.'}</p>
            </div>

            {/* Middle Section: Financial Budget */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CircleDollarSign className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Allocated Budget</span>
              </div>
              <span className="text-base font-bold text-emerald-400">
                ${Number(project.total_budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Bottom Team Mappings */}
            <div className="space-y-3 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Manager: <strong className="text-slate-200">{project.manager ? `${project.manager.first_name} ${project.manager.last_name}` : 'Unassigned'}</strong></span>
                <span>Team Size: <strong className="text-slate-200">{project.members?.length ?? 0} members</strong></span>
              </div>

              {/* Members assignments block */}
              {project.members && project.members.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.members.map(member => (
                    <span key={member.id} className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-medium border border-slate-700">
                      {member.first_name} {member.last_name[0]}.
                    </span>
                  ))}
                </div>
              )}

              {/* Staff Assignment Trigger */}
              {(role === 'ADMIN' || project.manager_id === parseInt(role)) && (
                <button
                  onClick={() => setAssignProjectId(project.id)}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700/60 hover:text-slate-200 text-slate-400 text-xs font-semibold transition-colors mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Assign Staff Member</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 1. Project Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md p-6 glass-panel space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">Initialize Project Workspace</h3>
                <p className="text-[10px] text-slate-500">Seed the configuration parameters for client-focused budgets.</p>
              </div>
            </div>

            {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{error}</p>}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise CRM Integration"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200 placeholder-slate-600 focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  rows="3"
                  placeholder="Justification, milestones, and scope guidelines..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200 placeholder-slate-600 focus:border-violet-500/50 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Budget Cap (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50000.00"
                  value={projectBudget}
                  onChange={(e) => setProjectBudget(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200 placeholder-slate-600 focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assign Project Manager</label>
                <select
                  value={projectManagerId}
                  onChange={(e) => setProjectManagerId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200"
                >
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.roles[0]?.name || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 text-white text-xs font-semibold hover:from-violet-500 hover:to-emerald-400 disabled:opacity-50"
                >
                  {loading ? 'Initializing...' : 'Confirm Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Assign Member Modal */}
      {assignProjectId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm p-6 glass-panel space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">Assign Team Member</h3>
                <p className="text-[10px] text-slate-500">Grant an employee access to this project workspace.</p>
              </div>
            </div>

            <form onSubmit={handleAssignMember} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Employee</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200"
                >
                  <option value="">-- Choose Staff --</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignProjectId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 text-white text-xs font-semibold hover:from-violet-500 hover:to-emerald-400"
                >
                  Allocate Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
