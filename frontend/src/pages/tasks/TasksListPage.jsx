import { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

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
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);

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

  const handleDragStart = (e, task) => {
    if (!isAdmin() && !isManager()) return;
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setDraggedTaskId(task.id), 0);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColId(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (dragOverColId === colId) {
      setDragOverColId(null);
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColId(null);
    setDraggedTaskId(null);
    
    if (!isAdmin() && !isManager()) return;

    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    const task = tasks.find(t => t.id === parseInt(taskId, 10));
    if (!task || task.status === newStatus) return;

    setTasks(prev => prev.map(t => t.id === parseInt(taskId, 10) ? { ...t, status: newStatus } : t));

    try {
      await tasksAPI.updateStatus(taskId, { status: newStatus });
      toast.success('Task status updated');
    } catch {
      toast.error('Failed to update task status');
      fetchTasks();
    }
  };

  const columns = [
    { id: 'TO_DO', title: 'To Do', dot: 'var(--color-outline)' },
    { id: 'IN_PROGRESS', title: 'In Progress', dot: 'var(--color-primary)' },
    { id: 'REVIEW', title: 'Review', dot: 'oklch(0.60 0.16 70)' },
    { id: 'DONE', title: 'Done', dot: 'var(--color-success)' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--color-outline-variant)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '9999px',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  // Inline select style helper
  const selectStyle = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid var(--color-outline-variant)',
    backgroundColor: 'var(--color-surface-container-lowest)',
    color: 'var(--color-on-surface)',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737686' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-on-surface-variant)',
    fontFamily: "'Public Sans', sans-serif",
    letterSpacing: '0.01em',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', flexShrink: 0 }}>
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--color-on-surface)',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.03em',
            }}
          >
            Task Workflow
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-on-surface-variant)',
              marginTop: '4px',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Manage high-priority engineering tasks across the global platform ecosystem with structured precision.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-outline)',
                fontSize: '16px',
              }}
            >
              search
            </span>
            <input
              style={{
                paddingLeft: '32px',
                paddingRight: '14px',
                paddingTop: '8px',
                paddingBottom: '8px',
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                border: '1px solid var(--color-outline-variant)',
                width: '240px',
                color: 'var(--color-on-surface)',
                fontFamily: "'Inter', sans-serif",
              }}
              placeholder="Search tasks..."
              type="text"
            />
          </div>
          {(isManager() || isAdmin()) && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                borderRadius: '9999px',
                padding: '9px 20px',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 1px 2px oklch(0.15 0.01 260 / 0.08)',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-brand-700)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-primary)'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', paddingTop: '8px' }}>
        <div style={{ display: 'flex', gap: '16px', height: '100%', alignItems: 'flex-start', minWidth: 'max-content', paddingBottom: '16px' }}>
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div 
                key={col.id} 
                style={{
                  width: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: dragOverColId === col.id ? 'oklch(0.96 0.02 260)' : 'var(--color-surface-container-low)',
                  borderRadius: '12px',
                  border: dragOverColId === col.id
                    ? '2px solid var(--color-primary)'
                    : '1px solid var(--color-outline-variant)',
                  transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                  maxHeight: '100%',
                  boxShadow: dragOverColId === col.id ? '0 0 0 3px oklch(0.37 0.18 260 / 0.10)' : 'none',
                }}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--color-outline-variant)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '9999px',
                        backgroundColor: col.dot,
                      }}
                    />
                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        color: 'var(--color-on-surface)',
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {col.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        backgroundColor: 'var(--color-surface-variant)',
                        color: 'var(--color-on-surface-variant)',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {colTasks.length}
                    </span>
                  </div>
                  {(isManager() || isAdmin()) && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-on-surface-variant)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    </button>
                  )}
                </div>
                
                {/* Cards */}
                <div 
                  style={{
                    padding: '10px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flex: 1,
                    scrollbarWidth: 'thin',
                  }}
                >
                  {colTasks.map(task => (
                    <div 
                      key={task.id} 
                      draggable={isAdmin() || isManager()}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      style={{
                        backgroundColor: 'var(--color-surface-container-lowest)',
                        borderRadius: '8px',
                        padding: '14px',
                        border: '1px solid var(--color-outline-variant)',
                        transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
                        cursor: (isAdmin() || isManager()) ? 'grab' : 'pointer',
                        opacity: draggedTaskId === task.id ? 0.4 : (col.id === 'DONE' ? 0.75 : 1),
                        transform: draggedTaskId === task.id ? 'scale(0.97)' : 'none',
                        boxShadow: draggedTaskId === task.id
                          ? '0 0 0 2px var(--color-primary), 0 4px 12px oklch(0.15 0.01 260 / 0.12)'
                          : '0 1px 2px oklch(0.15 0.01 260 / 0.03)',
                      }}
                      onClick={() => {
                        if (isAdmin() || isManager()) openEditModal(task);
                      }}
                      onMouseEnter={(e) => {
                        if (draggedTaskId !== task.id) {
                          e.currentTarget.style.boxShadow = '0 2px 8px oklch(0.15 0.01 260 / 0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (draggedTaskId !== task.id) {
                          e.currentTarget.style.boxShadow = '0 1px 2px oklch(0.15 0.01 260 / 0.03)';
                        }
                      }}
                    >
                      {/* Priority tag */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontFamily: "'Public Sans', sans-serif",
                            backgroundColor:
                              task.priority === 'HIGH' || task.priority === 'URGENT' ? 'oklch(0.94 0.04 25)' :
                              task.priority === 'MEDIUM' ? 'oklch(0.92 0.04 70)' :
                              'oklch(0.92 0.04 155)',
                            color:
                              task.priority === 'HIGH' || task.priority === 'URGENT' ? 'oklch(0.40 0.14 25)' :
                              task.priority === 'MEDIUM' ? 'oklch(0.40 0.14 70)' :
                              'oklch(0.35 0.12 155)',
                          }}
                        >
                          {task.priority}
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: '16px',
                            color: 'var(--color-on-surface-variant)',
                            opacity: 0,
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          more_horiz
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        style={{
                          fontWeight: 600,
                          fontSize: '13px',
                          color: col.id === 'DONE' ? 'var(--color-on-surface-variant)' : 'var(--color-on-surface)',
                          lineHeight: 1.4,
                          marginBottom: '10px',
                          textDecoration: col.id === 'DONE' ? 'line-through' : 'none',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {task.title}
                      </h4>
                      
                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {task.est_hours > 0 && (
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                color: 'var(--color-on-surface-variant)',
                                fontSize: '11px',
                                fontFamily: "'Public Sans', sans-serif",
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                              {task.est_hours}h
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '9999px',
                            backgroundColor: 'var(--color-primary-container)',
                            color: 'var(--color-on-primary-container)',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
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

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editTaskId ? "Edit Task" : "Create New Task"}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input id="title" label="Task Title" value={title} onChange={e => setTitle(e.target.value)} required />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Description</label>
            <textarea 
              style={{
                ...selectStyle,
                height: 'auto',
                resize: 'vertical',
                backgroundImage: 'none',
                paddingRight: '12px',
              }}
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Project</label>
              <select style={selectStyle} value={projectId} onChange={e => setProjectId(e.target.value)} required>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Assignee</label>
              <select style={selectStyle} value={assigneeId} onChange={e => setAssigneeId(e.target.value)} required>
                <option value="">Select Employee</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Status</label>
              <select style={selectStyle} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="TO_DO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Priority</label>
              <select style={selectStyle} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <Input id="estHours" type="number" step="0.5" label="Est. Hours" value={estHours} onChange={e => setEstHours(e.target.value)} />
            <Input id="dueDate" type="date" label="Due Date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)' }}>
            <Button variant="secondary" onClick={closeModal} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>{editTaskId ? 'Save Changes' : 'Create Task'}</Button>
          </div>
        </form>
      </Modal>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
