import { useState, useEffect } from 'react';
import { expensesAPI, tasksAPI } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Plus, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

export default function ExpensesListPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isManager, isAdmin } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('TRAVEL');
  const [description, setDescription] = useState('');
  const [billFile, setBillFile] = useState(null);

  useEffect(() => {
    fetchExpenses();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await tasksAPI.list({ pageSize: 100 });
      setTasks(data.tasks || []);
    } catch {
      // Ignore
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data } = await expensesAPI.list({ pageSize: 50 });
      setExpenses(data.expenses || []);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, isApprove) => {
    try {
      await expensesAPI.approve(id, { 
        action: isApprove ? 'APPROVED' : 'REJECTED',
        rejection_reason: isApprove ? null : 'Rejected by manager'
      });
      toast.success(`Expense ${isApprove ? 'approved' : 'rejected'}`);
      fetchExpenses();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!amount) return toast.error('Amount is required');
    if (!taskId) return toast.error('Related Task is required');
    if (!description.trim()) return toast.error('Description / Reason is required');
    
    setFormLoading(true);
    try {
      const res = await expensesAPI.create({
        task_id: parseInt(taskId, 10) || null,
        amount: parseFloat(amount),
        currency,
        category,
        description
      });
      
      if (billFile) {
        await expensesAPI.uploadBill(res.data.id, billFile);
      }

      toast.success('Expense submitted successfully');
      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      setTaskId('');
      setBillFile(null);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit expense');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Expenses</h1>
          <p className="text-sm text-ash mt-1">Review and submit expense claims</p>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin() && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Submit Expense
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[12px] border overflow-hidden flex-1" style={{ borderColor: 'var(--color-cloud)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-canvas border-b" style={{ borderColor: 'var(--color-cloud)' }}>
              <tr>
                <th className="px-6 py-3 font-semibold text-charcoal">Employee</th>
                <th className="px-6 py-3 font-semibold text-charcoal">Category</th>
                <th className="px-6 py-3 font-semibold text-charcoal">Amount</th>
                <th className="px-6 py-3 font-semibold text-charcoal">Status</th>
                <th className="px-6 py-3 font-semibold text-charcoal">Date</th>
                {isManager() && <th className="px-6 py-3 font-semibold text-charcoal text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: 'var(--color-cloud)' }}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-ash">
                    Loading...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ash">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-canvas transition-colors">
                    <td className="px-6 py-4 font-medium text-ink">
                      <div className="flex flex-col">
                        <span>{e.employee_name}</span>
                        <span className="text-xs text-ash font-normal truncate max-w-[200px]">{e.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-charcoal">{e.category}</td>
                    <td className="px-6 py-4 font-semibold text-ink">
                      <div className="flex items-center gap-2">
                        <span>{e.currency} {parseFloat(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        {e.bill_image_url && (
                          <a href={e.bill_image_url} target="_blank" rel="noreferrer" className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full hover:bg-brand-100 transition-colors">
                            Bill
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={e.status}>{e.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-ash">{format(new Date(e.created_at), 'MMM dd, yyyy')}</td>
                    {isManager() && (
                      <td className="px-6 py-4 text-right">
                        {e.status === 'SUBMITTED' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleApprove(e.id, true)}
                              className="p-1.5 text-success hover:bg-success/10 rounded-md transition-colors"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleApprove(e.id, false)}
                              className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-ash">Resolved</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Expense Claim">
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <Input id="amount" type="number" step="0.01" min="0" label="Amount" value={amount} onChange={e => setAmount(e.target.value)} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal">Currency</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500" style={{ borderColor: 'var(--color-mist)' }} value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal">Category</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500" style={{ borderColor: 'var(--color-mist)' }} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="TRAVEL">Travel</option>
                <option value="SUPPLIES">Supplies</option>
                <option value="SOFTWARE">Software</option>
                <option value="MEALS">Meals</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal">Related Task</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500" style={{ borderColor: 'var(--color-mist)' }} value={taskId} onChange={e => setTaskId(e.target.value)} required>
                <option value="">Select Task</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">Description / Reason</label>
            <textarea 
              className="w-full px-3 py-2.5 text-sm rounded-md border focus:outline-none focus:border-brand-500"
              style={{ borderColor: 'var(--color-mist)' }}
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">Upload Bill (Optional)</label>
            <input 
              type="file" 
              className="w-full text-sm text-ash file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100 cursor-pointer"
              onChange={e => setBillFile(e.target.files[0])}
              accept="image/*,.pdf"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-cloud)' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Submit Claim</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
