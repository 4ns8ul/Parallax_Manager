import { useState, useEffect } from 'react';
import { projectsAPI, usersAPI } from '../../api';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Search, Plus } from 'lucide-react';

export default function ProjectsListPage() {
  const { isManager, isAdmin } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [managerId, setManagerId] = useState('');
  const [memberIds, setMemberIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);

  useEffect(() => {
    fetchProjects();
    if (isManager() || isAdmin()) {
      fetchUsers();
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await projectsAPI.list();
      setProjects(data.projects || []);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await usersAPI.list(1, 100);
      setUsers(data.users);
      setManagers(data.users.filter((u) => u.roles.includes('MANAGER') || u.roles.includes('ADMIN')));
    } catch {
      // Ignore
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Project Name is required');
    if (!budget) return toast.error('Total Budget is required');
    
    setFormLoading(true);
    try {
      const payload = {
        name,
        description,
        total_budget: parseFloat(budget),
        manager_id: parseInt(managerId, 10) || null,
      };

      if (editProjectId) {
        // Keep original status
        const existingProject = projects.find(p => p.id === editProjectId);
        if (existingProject) payload.status = existingProject.status;
        await projectsAPI.update(editProjectId, payload);
        toast.success('Project updated successfully');
      } else {
        await projectsAPI.create(payload);
        toast.success('Project created successfully');
      }

      closeModal();
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${editProjectId ? 'update' : 'create'} project`);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (project) => {
    setEditProjectId(project.id);
    setName(project.name);
    setDescription(project.description || '');
    setBudget(project.total_budget || '');
    setManagerId(project.manager_id || '');
    setIsModalOpen(true);
  };

  const openTeamModal = (project) => {
    setActiveProjectId(project.id);
    setMemberIds(project.member_ids ? project.member_ids.map(String) : []);
    setIsTeamModalOpen(true);
  };

  const closeTeamModal = () => {
    setIsTeamModalOpen(false);
    setActiveProjectId(null);
    setMemberIds([]);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await projectsAPI.addMembers(activeProjectId, memberIds.map(id => parseInt(id, 10)));
      toast.success('Team updated successfully');
      closeTeamModal();
      fetchProjects();
    } catch (err) {
      toast.error('Failed to update team');
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditProjectId(null);
    setName('');
    setDescription('');
    setBudget('');
    setManagerId('');
  };

  const toggleMember = (userId) => {
    const idStr = String(userId);
    setMemberIds(prev => 
      prev.includes(idStr) ? prev.filter(id => id !== idStr) : [...prev, idStr]
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Projects</h1>
          <p className="text-sm text-ash mt-1">Manage project portfolios and budgets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" size={16} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="pl-9 pr-4 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              style={{ borderColor: 'var(--color-cloud)' }}
            />
          </div>
          {isAdmin() && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              New Project
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[12px] border overflow-hidden flex-1" style={{ borderColor: 'var(--color-cloud)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-canvas border-b" style={{ borderColor: 'var(--color-cloud)' }}>
              <tr>
                <th className="px-6 py-3 font-semibold text-charcoal">Project Name</th>
                <th className="px-6 py-3 font-semibold text-charcoal">Manager</th>
                <th className="px-6 py-3 font-semibold text-charcoal">Status</th>
                <th className="px-6 py-3 font-semibold text-charcoal text-right">Budget</th>
                <th className="px-6 py-3 font-semibold text-charcoal text-right">Members</th>
                <th className="px-6 py-3 font-semibold text-charcoal">Created</th>
                {isManager() && <th className="px-6 py-3 font-semibold text-charcoal text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: 'var(--color-cloud)' }}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-ash">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ash">
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr 
                    key={p.id} 
                    className="hover:bg-canvas transition-colors cursor-pointer"
                    onClick={(e) => {
                      if (isAdmin()) openEditModal(p);
                    }}
                  >
                    <td className="px-6 py-4 font-medium text-ink">
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-xs text-ash font-normal truncate max-w-[200px]">{p.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-charcoal">{p.manager_name || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={p.status}>{p.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-charcoal">${parseFloat(p.total_budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right text-charcoal">{p.member_count}</td>
                    <td className="px-6 py-4 text-ash">{format(new Date(p.created_at), 'MMM dd, yyyy')}</td>
                    {isManager() && (
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => openTeamModal(p)}
                          className="text-xs bg-brand-50 text-brand-600 px-3 py-1.5 rounded-md hover:bg-brand-100 transition-colors font-medium"
                        >
                          Manage Team
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editProjectId ? "Edit Project" : "Create Project"}>
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <Input id="name" label="Project Name" value={name} onChange={e => setName(e.target.value)} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">Description</label>
            <textarea 
              className="w-full px-3 py-2.5 text-sm rounded-md border focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              style={{ borderColor: 'var(--color-mist)' }}
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="budget" label="Total Budget ($)" type="number" step="0.01" min="0" value={budget} onChange={e => setBudget(e.target.value)} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal">Project Manager</label>
              <select 
                className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500"
                style={{ borderColor: 'var(--color-mist)' }}
                value={managerId}
                onChange={e => setManagerId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-cloud)' }}>
            <Button variant="secondary" onClick={closeModal} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>{editProjectId ? 'Save Changes' : 'Create Project'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTeamModalOpen} onClose={closeTeamModal} title="Manage Team">
        <form onSubmit={handleSaveTeam} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">Assign Members (Select multiple)</label>
            <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-canvas" style={{ borderColor: 'var(--color-mist)' }}>
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="rounded border-mist text-brand-600 focus:ring-brand-500"
                    checked={memberIds.includes(String(u.id))}
                    onChange={() => toggleMember(u.id)}
                  />
                  <span className="text-sm text-ink">{u.first_name} {u.last_name}</span>
                  <span className="text-xs text-ash ml-auto">{u.roles[0]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-cloud)' }}>
            <Button variant="secondary" onClick={closeTeamModal} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Save Team</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
