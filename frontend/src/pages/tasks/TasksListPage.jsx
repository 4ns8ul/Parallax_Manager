import { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import { Clock, Plus } from 'lucide-react';

export default function TasksListPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isManager, isAdmin } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TO_DO');
  const [estHours, setEstHours] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);

  useEffect(() => {
    fetchTasks();
    if (isManager() || isAdmin()) {
      fetchProjectsAndUsers();
    }
  }, []);

  const fetchProjectsAndUsers = async () => {
    try {
      const [projRes, userRes] = await Promise.all([
        projectsAPI.list(),
        usersAPI.list(1, 100)
      ]);
      const allUsers = userRes.data.users || [];
      setProjects(projRes.data.projects || []);
      setUsers(allUsers.filter(u => u.roles && u.roles.includes('EMPLOYEE')));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await tasksAPI.list({ pageSize: 100 });
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Task title is required');
    if (!projectId) return toast.error('Project is required');
    if (!assigneeId) return toast.error('Assignee is required');
    
    setFormLoading(true);
    try {
      const payload = {
        project_id: parseInt(projectId),
        title,
        description,
        status: status,
        priority,
        assignee_id: parseInt(assigneeId),
        est_hours: parseFloat(estHours) || 0,
        actual_hours: 0,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };

      if (editTaskId) {
        await tasksAPI.update(editTaskId, payload);
        toast.success('Task updated successfully');
      } else {
        await tasksAPI.create(payload);
        toast.success('Task created successfully');
      }

      closeModal();
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${editTaskId ? 'update' : 'create'} task`);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (task) => {
    setEditTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setProjectId(task.project_id);
    setAssigneeId(task.assignee_id || '');
    setPriority(task.priority);
    setStatus(task.status || 'TO_DO');
    setEstHours(task.est_hours || '');
    setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditTaskId(null);
    setTitle('');
    setDescription('');
    setProjectId('');
    setAssigneeId('');
    setStatus('TO_DO');
    setEstHours('');
    setDueDate('');
  };

  const columns = [
    { id: 'TO_DO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'REVIEW', title: 'Review' },
    { id: 'DONE', title: 'Done' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="hidden md:flex justify-between items-center pb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">Tasks Board</h2>
          <p className="text-sm text-on-surface-variant mt-1">Manage and track your ongoing work items.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
            <input className="pl-10 pr-4 py-2 bg-surface-container-lowest rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant w-64 text-on-surface" placeholder="Search tasks..." type="text" />
          </div>
          {(isManager() || isAdmin()) && (
            <button onClick={() => setIsModalOpen(true)} className="bg-primary text-on-primary rounded-full py-2 px-6 font-medium text-sm hover:bg-primary-container transition-colors active:scale-[0.98] shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Task
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pt-4">
        <div className="flex gap-6 h-full items-start min-w-max pb-4">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="w-80 flex flex-col bg-surface-container-low rounded-xl border border-outline-variant max-h-full">
                <div className="p-4 border-b border-outline-variant flex justify-between items-center flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      col.id === 'TO_DO' ? 'bg-outline' :
                      col.id === 'IN_PROGRESS' ? 'bg-primary' :
                      col.id === 'REVIEW' ? 'bg-secondary' : 'bg-outline-variant'
                    }`}></span>
                    <h3 className="font-semibold text-on-surface">{col.title}</h3>
                    <span className="text-xs bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full ml-1">{colTasks.length}</span>
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                
                <div className="p-3 overflow-y-auto flex flex-col gap-3 flex-1" style={{ scrollbarWidth: 'thin' }}>
                  {colTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`bg-surface rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow cursor-pointer group ${
                        col.id === 'DONE' ? 'opacity-80 border-outline-variant/20' : 'border-outline-variant/40'
                      }`}
                      onClick={() => {
                        if (isAdmin() || isManager()) openEditModal(task);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          task.priority === 'HIGH' || task.priority === 'URGENT' ? 'text-error bg-error-container/50' :
                          task.priority === 'MEDIUM' ? 'text-secondary bg-secondary-container/30' :
                          'text-tertiary bg-tertiary-container/20'
                        }`}>
                          {task.priority}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 text-on-surface-variant transition-opacity">
                          <span className="material-symbols-outlined text-sm">more_horiz</span>
                        </button>
                      </div>
                      <h4 className={`font-medium text-sm text-on-surface leading-snug mb-3 ${col.id === 'DONE' ? 'line-through text-on-surface-variant' : ''}`}>{task.title}</h4>
                      
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-2">
                          {task.est_hours > 0 && (
                            <span className="flex items-center gap-1 text-on-surface-variant text-xs">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {task.est_hours}h
                            </span>
                          )}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-medium border border-surface">
                          {task.assignee_name ? task.assignee_name.charAt(0) : '?'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editTaskId ? "Edit Task" : "Create New Task"}>
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <Input id="title" label="Task Title" value={title} onChange={e => setTitle(e.target.value)} required />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">Description</label>
            <textarea 
              className="w-full px-3 py-2.5 text-sm rounded-md border focus:outline-none focus:border-brand-500"
              style={{ borderColor: 'var(--color-mist)' }}
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal">Project</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500" style={{ borderColor: 'var(--color-mist)' }} value={projectId} onChange={e => setProjectId(e.target.value)} required>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal">Assignee</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500" style={{ borderColor: 'var(--color-mist)' }} value={assigneeId} onChange={e => setAssigneeId(e.target.value)} required>
                <option value="">Select Employee</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal">Status</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500" style={{ borderColor: 'var(--color-mist)' }} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="TO_DO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal">Priority</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500" style={{ borderColor: 'var(--color-mist)' }} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <Input id="estHours" type="number" step="0.5" label="Est. Hours" value={estHours} onChange={e => setEstHours(e.target.value)} />
            <Input id="dueDate" type="date" label="Due Date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-cloud)' }}>
            <Button variant="secondary" onClick={closeModal} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>{editTaskId ? 'Save Changes' : 'Create Task'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
