import React, { useState, useEffect } from 'react';
import { useStitch } from '../context/StitchContext';
import { 
  Plus, 
  Check, 
  X, 
  Receipt, 
  Tag, 
  FileText, 
  AlertCircle 
} from 'lucide-react';

export default function Expenses() {
  const { role, projects, selectedProject, setSelectedProject, fetchSummary } = useStitch();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('TRAVEL');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseTaskId, setExpenseTaskId] = useState('');

  // Project tasks list for optional expense attachment
  const [tasksList, setTasksList] = useState([]);

  // Rejection state modal
  const [rejectExpenseId, setRejectExpenseId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadExpenses = () => {
    setLoading(true);
    fetch('/api/v1/expenses')
      .then(res => res.json())
      .then(data => {
        // Filter locally by selected project if selected
        if (selectedProject) {
          setExpenses(data.filter(e => e.project_id === selectedProject.id));
        } else {
          setExpenses(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadExpenses();

    if (selectedProject) {
      // Fetch tasks for optional link
      fetch(`/api/v1/tasks?projectId=${selectedProject.id}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setTasksList(data.filter(t => t.project_id === selectedProject.id)))
        .catch(err => console.error(err));
    }
  }, [selectedProject]);

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!expenseAmount || !selectedProject || !expenseDesc) return;

    setError(null);
    try {
      const res = await fetch('/api/v1/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          task_id: expenseTaskId ? parseInt(expenseTaskId) : null,
          amount: parseFloat(expenseAmount),
          currency: 'USD',
          category: expenseCategory,
          description: expenseDesc
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to submit expense");
      }

      setExpenseAmount('');
      setExpenseDesc('');
      setExpenseTaskId('');
      setShowSubmitModal(false);
      
      // Reload states
      fetchSummary();
      const currentSelected = selectedProject;
      setSelectedProject(null);
      setTimeout(() => setSelectedProject(currentSelected), 10);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProcessApproval = async (expenseId, approveStatus, reason = '') => {
    try {
      const res = await fetch(`/api/v1/expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: approveStatus, // APPROVED or REJECTED
          rejected_reason: reason || null
        })
      });

      if (res.ok) {
        setRejectExpenseId(null);
        setRejectReason('');
        fetchSummary();
        const currentSelected = selectedProject;
        setSelectedProject(null);
        setTimeout(() => setSelectedProject(currentSelected), 10);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to process expense status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Status mapping colors
  const expenseStatusStyles = {
    'SUBMITTED': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'APPROVED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'REJECTED': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };

  return (
    <div className="space-y-8 overflow-y-auto h-full pb-16 pr-2">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Expense Audit Panel</h3>
          <p className="text-xs text-slate-400">File business travel, lodging, or meal receipt claims and review employee submissions.</p>
        </div>
        {selectedProject && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 text-white text-xs font-semibold hover:from-violet-500 hover:to-emerald-400 shadow-md active:scale-95 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>File Receipt Claim</span>
          </button>
        )}
      </div>

      {/* Fallsback warnings if no selected Project */}
      {!selectedProject ? (
        <div className="glass-panel p-12 text-center max-w-md mx-auto space-y-4">
          <Receipt className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Select Project Workspace</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please select a project workspace in the top navigation bar to view or file its corresponding expense records.
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-slate-400">
          <span>Retrieving receipts ledger...</span>
        </div>
      ) : expenses.length === 0 ? (
        <div className="glass-panel p-12 text-center max-w-md mx-auto space-y-4">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Expenses Filed</h3>
          <p className="text-xs text-slate-500">File a receipt claim to log financial details under this workspace.</p>
        </div>
      ) : (
        /* Expenses Listing Table */
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Submitted By</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Linked Task</th>
                  <th className="px-6 py-4">Amount (USD)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-400">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Submitter info */}
                    <td className="px-6 py-4 font-semibold text-slate-300">
                      {expense.employee ? `${expense.employee.first_name} ${expense.employee.last_name}` : `User ID: ${expense.employee_id}`}
                    </td>
                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-bold border border-slate-700 uppercase tracking-wide">
                        <Tag className="w-3 h-3 mr-1 text-slate-400" />
                        {expense.category}
                      </span>
                    </td>
                    {/* Description */}
                    <td className="px-6 py-4 max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </td>
                    {/* Linked task */}
                    <td className="px-6 py-4 text-xs font-semibold">
                      {expense.task ? (
                        <span className="text-violet-400">{expense.task.title}</span>
                      ) : (
                        <span className="text-slate-500 font-medium">Global Project</span>
                      )}
                    </td>
                    {/* Amount */}
                    <td className="px-6 py-4 font-bold text-slate-200">
                      ${Number(expense.amount).toFixed(2)}
                    </td>
                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        expenseStatusStyles[expense.status] || 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    {/* Actions process limits */}
                    <td className="px-6 py-4 text-right">
                      {expense.status === 'SUBMITTED' && (role === 'ADMIN' || selectedProject.manager_id === parseInt(role)) ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleProcessApproval(expense.id, 'APPROVED')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-colors"
                            title="Approve Expense Claim"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectExpenseId(expense.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
                            title="Reject Expense Claim"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. File Claim Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md p-6 glass-panel space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">File Receipt Claim</h3>
                <p className="text-[10px] text-slate-500">File corporate operational expenditures for auditing and manager verification.</p>
              </div>
            </div>

            {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{error}</p>}

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200"
                  >
                    <option value="TRAVEL">Travel</option>
                    <option value="MEALS">Meals</option>
                    <option value="ACCOMMODATION">Accommodation</option>
                    <option value="SOFTWARE">Software License</option>
                    <option value="HARDWARE">Equipment Hardware</option>
                    <option value="OTHER">Other Operational</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200 focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Business Description / Justification</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Justify this expense category for manager auditing..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200 resize-none focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Link to Action Task (Optional)</label>
                <select
                  value={expenseTaskId}
                  onChange={(e) => setExpenseTaskId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200"
                >
                  <option value="">-- No Task Link --</option>
                  {tasksList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 text-white text-xs font-semibold hover:from-violet-500 hover:to-emerald-400 shadow-lg shadow-violet-600/10"
                >
                  File Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Rejection Modal for Reasons */}
      {rejectExpenseId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm p-6 glass-panel space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">Reject Expense Claim</h3>
                <p className="text-[10px] text-slate-500">Provide an audit reason for rejecting this claim.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Reason</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Over budget threshold, missing documentation..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-sm text-slate-200 resize-none focus:border-rose-500/50"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setRejectExpenseId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProcessApproval(rejectExpenseId, 'REJECTED', rejectReason)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold active:scale-95 transition-transform"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
