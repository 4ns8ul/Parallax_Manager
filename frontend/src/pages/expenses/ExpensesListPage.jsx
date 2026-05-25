import { useState, useEffect } from 'react';
import { expensesAPI, tasksAPI } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

const selectStyle = {
  width: '100%', padding: '9px 36px 9px 12px', fontSize: '13px', borderRadius: '8px',
  border: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-lowest)',
  color: 'var(--color-on-surface)', outline: 'none', fontFamily: "'Inter', sans-serif", appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737686' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};
const labelStyle = { fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)', fontFamily: "'Public Sans', sans-serif" };
const thStyle = { padding: '10px 20px', fontWeight: 700, fontSize: '12px', color: 'var(--color-on-surface-variant)', fontFamily: "'Public Sans'", letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const tdStyle = { padding: '14px 20px', fontSize: '13px', whiteSpace: 'nowrap', color: 'var(--color-on-surface)', fontFamily: "'Inter'" };

export default function ExpensesListPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isManager, isAdmin } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('TRAVEL');
  const [description, setDescription] = useState('');
  const [billFile, setBillFile] = useState(null);

  useEffect(() => { fetchExpenses(); fetchTasks(); }, []);

  const fetchTasks = async () => { try { const { data } = await tasksAPI.list({ pageSize: 100 }); setTasks(data.tasks || []); } catch {} };
  const fetchExpenses = async () => { try { const { data } = await expensesAPI.list({ pageSize: 50 }); setExpenses(data.expenses || []); } catch { toast.error('Failed to load expenses'); } finally { setLoading(false); } };

  const handleApprove = async (id, isApprove) => {
    try {
      await expensesAPI.approve(id, { action: isApprove ? 'APPROVED' : 'REJECTED', rejection_reason: isApprove ? null : 'Rejected by manager' });
      toast.success(`Expense ${isApprove ? 'approved' : 'rejected'}`);
      fetchExpenses();
    } catch { toast.error('Action failed'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!amount) return toast.error('Amount is required');
    if (!taskId) return toast.error('Related Task is required');
    if (!description.trim()) return toast.error('Description is required');
    setFormLoading(true);
    try {
      const res = await expensesAPI.create({ task_id: parseInt(taskId, 10) || null, amount: parseFloat(amount), currency, category, description });
      if (billFile) await expensesAPI.uploadBill(res.data.id, billFile);
      toast.success('Expense submitted');
      setIsModalOpen(false); setAmount(''); setDescription(''); setTaskId(''); setBillFile(null);
      fetchExpenses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-on-surface)', fontFamily: "'Inter'", letterSpacing: '-0.03em' }}>Expenses List</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginTop: '4px', fontFamily: "'Public Sans'" }}>Review, track, and manage employee reimbursement requests.</p>
        </div>
        {!isAdmin() && (
          <Button onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Submit Expense
          </Button>
        )}
      </div>

      <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', overflow: 'hidden', flex: 1 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-container)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                <th style={thStyle}>Employee</th><th style={thStyle}>Category</th><th style={thStyle}>Amount</th>
                <th style={thStyle}>Status</th><th style={thStyle}>Date</th>
                {isManager() && <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '32px', color: 'var(--color-on-surface-variant)' }}>Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '48px', color: 'var(--color-on-surface-variant)' }}>No expenses found.</td></tr>
              ) : expenses.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--color-outline-variant)', transition: 'background-color 0.1s' }}
                  onMouseEnter={(ev) => ev.currentTarget.style.backgroundColor = 'var(--color-surface-container)'}
                  onMouseLeave={(ev) => ev.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600 }}>{e.employee_name}</span><br/>
                    <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>{e.description}</span>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--color-on-surface-variant)' }}>{e.category}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{e.currency} {parseFloat(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      {e.bill_image_url && (
                        <a href={e.bill_image_url} target="_blank" rel="noreferrer" style={{ fontSize: '10px', backgroundColor: 'oklch(0.95 0.02 260)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, textDecoration: 'none' }}>Bill</a>
                      )}
                    </div>
                  </td>
                  <td style={tdStyle}><Badge variant={e.status}>{e.status}</Badge></td>
                  <td style={{ ...tdStyle, color: 'var(--color-on-surface-variant)' }}>{format(new Date(e.created_at), 'MMM dd, yyyy')}</td>
                  {isManager() && (
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {e.status === 'SUBMITTED' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button onClick={() => handleApprove(e.id, true)} style={{ padding: '6px', color: 'var(--color-success)', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex' }} title="Approve"><Check size={18} /></button>
                          <button onClick={() => handleApprove(e.id, false)} style={{ padding: '6px', color: 'var(--color-error)', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex' }} title="Reject"><X size={18} /></button>
                        </div>
                      ) : <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>Resolved</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Expense Claim">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input id="amount" type="number" step="0.01" min="0" label="Amount" value={amount} onChange={e => setAmount(e.target.value)} required />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Currency</label>
              <select style={selectStyle} value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option><option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Category</label>
              <select style={selectStyle} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="TRAVEL">Travel</option><option value="SUPPLIES">Supplies</option><option value="SOFTWARE">Software</option><option value="MEALS">Meals</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Related Task</label>
              <select style={selectStyle} value={taskId} onChange={e => setTaskId(e.target.value)} required>
                <option value="">Select Task</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Description / Reason</label>
            <textarea style={{ ...selectStyle, height: 'auto', resize: 'vertical', backgroundImage: 'none', paddingRight: '12px' }} rows={3} value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Upload Bill (Optional)</label>
            <input type="file" style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', fontFamily: "'Inter'" }} onChange={e => setBillFile(e.target.files[0])} accept="image/*,.pdf" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Submit Claim</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
