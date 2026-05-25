import { useState, useEffect } from 'react';
import { projectsAPI, usersAPI } from '../../api';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Edit2, Trash2 } from 'lucide-react';

const selectStyle = {
  width: '100%', padding: '9px 36px 9px 12px', fontSize: '13px', borderRadius: '8px',
  border: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-lowest)',
  color: 'var(--color-on-surface)', outline: 'none', fontFamily: "'Inter', sans-serif", appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737686' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};
const labelStyle = { fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)', fontFamily: "'Public Sans', sans-serif" };
const thStyle = { padding: '10px 20px', fontWeight: 700, fontSize: '12px', color: 'var(--color-on-surface-variant)', fontFamily: "'Public Sans', sans-serif", letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const tdStyle = { padding: '14px 20px', fontSize: '13px', whiteSpace: 'nowrap', color: 'var(--color-on-surface)', fontFamily: "'Inter', sans-serif" };

export default function ProjectsListPage() {
  const { isManager, isAdmin } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [managerId, setManagerId] = useState('');
  const [memberIds, setMemberIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);

  useEffect(() => { fetchProjects(); if (isManager() || isAdmin()) fetchUsers(); }, []);

  const fetchProjects = async () => { try { const { data } = await projectsAPI.list(); setProjects(data.projects || []); } catch { toast.error('Failed to load projects'); } finally { setLoading(false); } };
  const fetchUsers = async () => { try { const { data } = await usersAPI.list(1, 100); setUsers(data.users); setManagers(data.users.filter((u) => u.roles.includes('MANAGER') || u.roles.includes('ADMIN'))); } catch {} };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Project Name is required');
    if (!budget) return toast.error('Total Budget is required');
    setFormLoading(true);
    try {
      const payload = { name, description, total_budget: parseFloat(budget), manager_id: parseInt(managerId, 10) || null };
      if (editProjectId) { const ep = projects.find(p => p.id === editProjectId); if (ep) payload.status = ep.status; await projectsAPI.update(editProjectId, payload); toast.success('Project updated'); }
      else { await projectsAPI.create(payload); toast.success('Project created'); }
      closeModal(); fetchProjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
  };

  const openEditModal = (p, e) => { if (e) e.stopPropagation(); setIsViewMode(false); setEditProjectId(p.id); setName(p.name); setDescription(p.description||''); setBudget(p.total_budget||''); setManagerId(p.manager_id||''); setIsModalOpen(true); };
  const openViewModal = (p) => { setIsViewMode(true); setEditProjectId(p.id); setName(p.name); setDescription(p.description||''); setBudget(p.total_budget||''); setManagerId(p.manager_id||''); setIsModalOpen(true); };
  const handleDelete = async (id, e) => { if (e) e.stopPropagation(); if (!window.confirm('Delete this project?')) return; try { await projectsAPI.delete(id); toast.success('Deleted'); fetchProjects(); } catch { toast.error('Failed'); } };
  const openTeamModal = (p) => { setActiveProjectId(p.id); setMemberIds(p.member_ids ? p.member_ids.map(String) : []); setIsTeamModalOpen(true); };
  const closeTeamModal = () => { setIsTeamModalOpen(false); setActiveProjectId(null); setMemberIds([]); };
  const handleSaveTeam = async (e) => { e.preventDefault(); setFormLoading(true); try { await projectsAPI.addMembers(activeProjectId, memberIds.map(id => parseInt(id, 10))); toast.success('Team updated'); closeTeamModal(); fetchProjects(); } catch { toast.error('Failed'); } finally { setFormLoading(false); } };
  const closeModal = () => { setIsModalOpen(false); setEditProjectId(null); setName(''); setDescription(''); setBudget(''); setManagerId(''); };
  const toggleMember = (userId) => { const idStr = String(userId); setMemberIds(prev => prev.includes(idStr) ? prev.filter(id => id !== idStr) : [...prev, idStr]); };

  return (
    <div className="p-xl space-y-xl max-w-[1440px] mx-auto" style={{ width: '100%', height: '100%' }}>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-6">
        <div className="space-y-sm">
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', lineHeight: '40px', fontWeight: 600, color: 'var(--color-on-surface)' }}>Projects Dashboard</h2>
          <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '18px', color: 'var(--color-on-surface-variant)' }}>Monitor and manage your organizational initiatives and resource allocation.</p>
        </div>
        {isAdmin() && (
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', 
              backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', 
              borderRadius: '8px', fontWeight: 600, fontSize: '14px', fontFamily: "'Hanken Grotesk', sans-serif",
              boxShadow: '0px 2px 0px 0px #1a1656', transition: 'all 0.15s', cursor: 'pointer'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.boxShadow = 'none'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0px 2px 0px 0px #1a1656'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Stats Overview - Bento Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--color-primary-fixed)', borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>analytics</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>+12% vs LW</span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Hanken Grotesk', sans-serif" }}>Total Active</p>
          <p style={{ fontSize: '32px', fontWeight: 600, color: 'var(--color-on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{projects.length}</p>
        </div>
        <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary-fixed)', borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>trending_up</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>On Track</span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Hanken Grotesk', sans-serif" }}>In Progress</p>
          <p style={{ fontSize: '32px', fontWeight: 600, color: 'var(--color-on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{projects.filter(p => p.status === 'IN_PROGRESS').length}</p>
        </div>
        <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--color-tertiary-fixed)', borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)' }}>monetization_on</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-error)' }}>-3.4%</span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Hanken Grotesk', sans-serif" }}>Total Budget</p>
          <p style={{ fontSize: '32px', fontWeight: 600, color: 'var(--color-on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
            ${projects.reduce((sum, p) => sum + parseFloat(p.total_budget || 0), 0).toLocaleString()}
          </p>
        </div>
        <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--color-surface-container-highest)', borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface)' }}>pending_actions</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>Next: 48h</span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Hanken Grotesk', sans-serif" }}>Pending Review</p>
          <p style={{ fontSize: '32px', fontWeight: 600, color: 'var(--color-on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{projects.filter(p => p.status === 'REVIEW').length || 12}</p>
        </div>
      </div>

      {/* Table Section */}
      <section style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface-container-low)' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>Recent Projects</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button style={{ padding: '8px', border: '1px solid var(--color-outline-variant)', borderRadius: '4px', backgroundColor: 'transparent', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>filter_list</span></button>
            <button style={{ padding: '8px', border: '1px solid var(--color-outline-variant)', borderRadius: '4px', backgroundColor: 'transparent', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span></button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-container)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Hanken Grotesk', sans-serif" }}>Project Name</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Hanken Grotesk', sans-serif" }}>Manager</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Hanken Grotesk', sans-serif" }}>Budget</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Hanken Grotesk', sans-serif" }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Hanken Grotesk', sans-serif" }}>Timeline</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}><div style={{ display: 'flex', justifyContent: 'center' }}><div style={{ width: '24px', height: '24px', border: '2px solid var(--color-outline-variant)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div></td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-on-surface-variant)' }}>No projects found.</td></tr>
              ) : projects.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-outline-variant)', cursor: 'pointer', transition: 'background-color 0.15s' }}
                  onClick={() => openViewModal(p)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: 'var(--color-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-on-primary-container)' }}>corporate_fare</span>
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>{p.name}</p>
                        <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: 0 }}>{p.description || 'Infrastructure & Security'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', color: 'var(--color-on-secondary-container)' }}>
                        {p.manager_name ? p.manager_name.charAt(0) : '?'}
                      </div>
                      <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '16px', color: 'var(--color-on-surface)' }}>{p.manager_name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '16px', color: 'var(--color-on-surface)', margin: 0, marginBottom: '8px' }}>${parseFloat(p.total_budget || 0).toLocaleString()}</p>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-surface-container-highest)', borderRadius: '9999px' }}>
                      <div style={{ backgroundColor: 'var(--color-primary)', height: '100%', borderRadius: '9999px', width: p.status === 'DONE' ? '100%' : p.status === 'IN_PROGRESS' ? '65%' : '15%' }}></div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', width: 'fit-content', gap: '4px', padding: '4px 8px', backgroundColor: p.status === 'DONE' ? 'var(--color-secondary-container)' : p.status === 'IN_PROGRESS' ? 'var(--color-primary-fixed)' : 'var(--color-surface-container-highest)', color: p.status === 'DONE' ? 'var(--color-on-secondary-container)' : p.status === 'IN_PROGRESS' ? 'var(--color-on-primary-fixed-variant)' : 'var(--color-on-surface-variant)', borderRadius: '4px', fontSize: '12px', fontWeight: 600, fontFamily: "'Hanken Grotesk', sans-serif" }}>
                      {p.status === 'DONE' ? <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span> : <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: p.status === 'IN_PROGRESS' ? 'var(--color-primary)' : 'var(--color-outline)' }}></span>}
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '16px', color: 'var(--color-on-surface)' }}>
                    {format(new Date(p.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      {isManager() && <button onClick={() => openTeamModal(p)} style={{ fontSize: '12px', backgroundColor: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)', padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: "'Hanken Grotesk', sans-serif" }}>Manage Team</button>}
                      {isAdmin() && <>
                        <button onClick={(e) => openEditModal(p, e)} style={{ padding: '8px', color: 'var(--color-outline)', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex' }} title="Edit"><Edit2 size={16} /></button>
                        <button onClick={(e) => handleDelete(p.id, e)} style={{ padding: '8px', color: 'var(--color-outline)', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex' }} title="Delete"><Trash2 size={16} /></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isViewMode ? "View Project" : (editProjectId ? "Edit Project" : "Create Project")}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input id="name" label="Project Name" value={name} onChange={e => setName(e.target.value)} required disabled={isViewMode} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...selectStyle, height: 'auto', resize: 'vertical', backgroundImage: 'none', paddingRight: '12px', opacity: isViewMode ? 0.7 : 1 }} rows={3} value={description} onChange={e => setDescription(e.target.value)} disabled={isViewMode} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input id="budget" label="Total Budget ($)" type="number" step="0.01" min="0" value={budget} onChange={e => setBudget(e.target.value)} required disabled={isViewMode} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Project Manager</label>
              <select style={{ ...selectStyle, opacity: isViewMode ? 0.7 : 1 }} value={managerId} onChange={e => setManagerId(e.target.value)} disabled={isViewMode}>
                <option value="">Unassigned</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)' }}>
            {isViewMode ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal} disabled={formLoading}>Cancel</Button><Button type="submit" loading={formLoading}>{editProjectId ? 'Save Changes' : 'Create Project'}</Button></>}
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTeamModalOpen} onClose={closeTeamModal} title="Manage Team">
        <form onSubmit={handleSaveTeam} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Assign Members</label>
            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--color-outline-variant)', borderRadius: '8px', padding: '6px', backgroundColor: 'var(--color-surface-container)' }}>
              {users.map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-on-surface)' }}>
                  <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} checked={memberIds.includes(String(u.id))} onChange={() => toggleMember(u.id)} />
                  <span>{u.first_name} {u.last_name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginLeft: 'auto', fontFamily: "'Public Sans'" }}>{u.roles[0]}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)' }}>
            <Button variant="secondary" onClick={closeTeamModal} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Save Team</Button>
          </div>
        </form>
      </Modal>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
