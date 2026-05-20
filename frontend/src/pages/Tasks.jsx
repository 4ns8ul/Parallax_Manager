import React, { useState, useEffect } from 'react';
import { useStitch } from '../context/StitchContext';
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Hourglass, 
  ListTodo,
  User 
} from 'lucide-react';

export default function Tasks() {
  const { role, projects, selectedProject, setSelectedProject, fetchSummary } = useStitch();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskEstHours, setTaskEstHours] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Log effort states
  const [logTaskId, setLogTaskId] = useState(null);
  const [logHours, setLogHours] = useState('');

  // Dropdown list
  const [usersList, setUsersList] = useState([]);

  const loadTasks = () => {
    if (!selectedProject) return;
    setLoading(true);
    fetch(`/api/v1/tasks?projectId=${selectedProject.id}`)
      .then(res => res.json())
      .then(data => {
        // Filter locally in case mock backend doesn't filter perfectly
        setTasks(data.filter(t => t.project_id === selectedProject.id));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTasks();

    // Load active staff members
    fetch('/api/v1/users')
      .then(res => res.ok ? res.json() : [])
      .then(data => setUsersList(data))
      .catch(err => console.error("Error loading user list:", err));
  }, [selectedProject]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !selectedProject || !taskAssigneeId) return;

    setError(null);
    try {
      const res = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          assignee_id: parseInt(taskAssigneeId),
          est_hours: parseFloat(taskEstHours || '0.00'),
          actual_hours: 0.00,
          due_date: taskDueDate || null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create task");
      }

      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('MEDIUM');
      setTaskEstHours('');
      setTaskAssigneeId('');
      setTaskDueDate('');
      setShowCreateModal(false);
      
      // Reload lists
      fetchSummary();
      const currentSelected = selectedProject;
      setSelectedProject(null);
      setTimeout(() => setSelectedProject(currentSelected), 10);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchSummary();
        const currentSelected = selectedProject;
        setSelectedProject(null);
        setTimeout(() => setSelectedProject(currentSelected), 10);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    if (!logTaskId || !logHours) return;

    try {
      const res = await fetch(`/api/v1/tasks/${logTaskId}/log-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours_to_add: parseFloat(logHours) })
      });

      if (res.ok) {
        setLogTaskId(null);
        setLogHours('');
        fetchSummary();
        const currentSelected = selectedProject;
        setSelectedProject(null);
        setTimeout(() => setSelectedProject(currentSelected), 10);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to log time");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Status indicators mapper
  const statusStyles = {
    'TO_DO': { bg: 'bg-slate-800/80 text-slate-300 border-slate-700', label: 'To Do', icon: ListTodo },
    'IN_PROGRESS': { bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20', label: 'In Progress', icon: Hourglass },
    'BLOCKED': { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Blocked', icon: AlertCircle },
    'DONE': { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Completed', icon: CheckCircle }
  };

  return (
    <div className="space-y-8 overflow-y-auto h-full pb-16 pr-2">
      {/* Upper Panel Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Workspace Task Board</h3>
          <p className="text-xs text-slate-400">Track progress checklists, log development hours, and assign milestones.</p>
        </div>
        {selectedProject && (role === 'ADMIN' || selectedProject.manager_id === parseInt(role)) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 text-white text-xs font-semibold hover:from-violet-500 hover:to-emerald-400 shadow-md active:scale-95 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Selected Project Warning Fallback */}
      {!selectedProject ? (
        <div className="glass-panel p-12 text-center max-w-md mx-auto space-y-4">
          <ListTodo className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Select Project Workspace</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please choose a project workspace from the selector in the top navigation bar to view its active tasks.
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-slate-400">
          <span>Loading task lists...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel p-12 text-center max-w-md mx-auto space-y-4">
          <ListTodo className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Tasks Configured</h3>
          <p className="text-xs text-slate-500">Initialize a new task card to populate the board checklist.</p>
        </div>
      ) : (
        /* Tasks Table/List */
        <div className="space-y-4">
          {tasks.map(task => {
            const statusCfg = statusStyles[task.status] || statusStyles['TO_DO'];
            const StatusIcon = statusCfg.icon;
            
            return (
              <div key={task.id} className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-violet-500/20 transition-all duration-200">
                
                {/* Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusCfg.bg} flex items-center space-x-1`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusCfg.label}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                      task.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {task.priority} Priority
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-base">{task.title}</h4>
                  <p className="text-sm text-slate-400">{task.description || 'No description provided.'}</p>
                </div>

                {/* Assignment & Hours */}
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
                  {/* Assignee */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Assignee</p>
                      <p className="text-slate-300 font-semibold">{task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Unassigned'}</p>
                    </div>
                  </div>

                  {/* Hours effort comparisons */}
                  <div className="flex items-center space-x-2">
                    <Clock className="w-8 h-8 text-slate-500 p-1.5 bg-slate-800/60 rounded-xl border border-slate-700/60" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Logged Hours</p>
                      <p className="text-slate-300 font-semibold">
                        <strong className="text-violet-400 font-bold">{task.actual_hours}</strong> / {task.est_hours} hrs
                      </p>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Due Date</p>
                    <p className="text-slate-300 font-semibold">{task.due_date ? task.due_date : 'No deadline'}</p>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="flex items-center space-x-2.5 pt-2 md:pt-0 border-t border-slate-800/60 md:border-none">
                  {/* State transition toggles */}
                  {task.status !== 'DONE' && (
                    <button
                      onClick={() => handleUpdateStatus(task.id, task.status === 'TO_DO' ? 'IN_PROGRESS' : 'DONE')}
                      className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-violet-600/10 active:scale-95"
                    >
                      {task.status === 'TO_DO' ? 'Start Work' : 'Mark Done'}
                    </button>
                  )}
                  {task.status === 'DONE' && (
                    <span className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Done
                    </span>
                  )}
                  
                  {/* Log time triggers */}
                  {task.status !== 'DONE' && (
                    <button
                      onClick={() => setLogTaskId(task.id)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Log Effort Hours"
                    >
                      <Clock className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md p-6 glass-panel space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">Configure Task Card</h3>
                <p className="text-[10px] text-slate-500">Define estimates and allocate developers inside project: <strong className="text-violet-400 font-semibold">{selectedProject.name}</strong></p>
              </div>
            </div>

            {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{error}</p>}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OAuth JWT controllers"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  rows="3"
                  placeholder="Brief task notes..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Estimate (Hours)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 16.00"
                    value={taskEstHours}
                    onChange={(e) => setTaskEstHours(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assign Developer</label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200"
                  >
                    <option value="">-- Select --</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-205"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 text-white text-xs font-semibold hover:from-violet-500 hover:to-emerald-400"
                >
                  Allocate Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Log Time Modal */}
      {logTaskId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm p-6 glass-panel space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">Log Effort Hours</h3>
                <p className="text-[10px] text-slate-500">Record your actual completed development hours.</p>
              </div>
            </div>

            <form onSubmit={handleLogTime} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hours spent</label>
                <input
                  type="number"
                  step="0.25"
                  required
                  placeholder="e.g. 4.5"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200 focus:border-violet-500/50"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLogTaskId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 text-white text-xs font-semibold hover:from-violet-500 hover:to-emerald-400"
                >
                  Commit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
