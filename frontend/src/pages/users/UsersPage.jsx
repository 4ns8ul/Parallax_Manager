import { useState, useEffect } from 'react';
import { usersAPI } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [roleId, setRoleId] = useState('3'); // Default Employee
  const [status, setStatus] = useState('ACTIVE');
  const [editUserId, setEditUserId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await usersAPI.list(1, 100);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.toLowerCase().endsWith('@prlx.com')) {
      return setErrorMsg("Only @prlx.com company emails are allowed.");
    }
    
    setFormLoading(true);
    try {
      await usersAPI.create({
        first_name: firstName,
        last_name: lastName,
        email: email,
        personal_email: personalEmail,
        phone_number: phoneNumber || null,
        role_ids: [parseInt(roleId, 10)],
      });
      toast.success("User successfully added! They will receive an email shortly.");
      setIsModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || "Failed to create user");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (user) => {
    setEditUserId(user.id);
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setPhoneNumber(user.phone_number || '');
    setStatus(user.status);
    
    // Reverse map role to ID (Simplified assuming one role for now)
    const role = user.roles[0];
    if (role === 'ADMIN') setRoleId('1');
    else if (role === 'MANAGER') setRoleId('2');
    else setRoleId('3');
    
    setErrorMsg('');
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await usersAPI.update(editUserId, {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber || null,
        role_ids: [parseInt(roleId, 10)],
        status: status,
      });
      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || "Failed to update user");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await usersAPI.delete(id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPersonalEmail('');
    setPhoneNumber('');
    setRoleId('3');
    setStatus('ACTIVE');
    setEditUserId(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">System Users</h1>
          <p className="text-sm text-ash mt-1">Manage roles and platform access</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          New User
        </Button>
      </div>

      <div className="bg-white rounded-[12px] border overflow-hidden flex-1" style={{ borderColor: 'var(--color-cloud)' }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-canvas border-b" style={{ borderColor: 'var(--color-cloud)' }}>
            <tr>
              <th className="px-6 py-3 font-semibold text-charcoal">User</th>
              <th className="px-6 py-3 font-semibold text-charcoal">Contact Details</th>
              <th className="px-6 py-3 font-semibold text-charcoal">Role</th>
              <th className="px-6 py-3 font-semibold text-charcoal">Status</th>
              <th className="px-6 py-3 font-semibold text-charcoal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ divideColor: 'var(--color-cloud)' }}>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-ash">Loading...</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-canvas transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs">
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-ink">{u.first_name} {u.last_name}</span>
                        <span className="text-xs text-ash">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-ink">{u.personal_email || 'No Personal Email'}</span>
                      <span className="text-xs text-ash">{u.phone_number || 'No Phone Number'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {u.roles.map(r => (
                        <span key={r} className="text-[10px] uppercase font-bold text-charcoal bg-cloud px-2 py-0.5 rounded-full">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={u.status === 'ACTIVE' ? 'APPROVED' : (u.status === 'SUSPENDED' ? 'REJECTED' : 'PENDING')}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(u)} className="p-1.5 text-ash hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors" title="Edit User">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-ash hover:text-danger hover:bg-danger/10 rounded-md transition-colors" title="Delete User">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New User">
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input id="first_name" label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <Input id="last_name" label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="email" type="email" label="Company Email (Login)" placeholder="name@prlx.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input id="personal_email" type="email" label="Personal Email (For Password)" placeholder="name@gmail.com" value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Input id="phone_number" type="tel" label="Phone Number" placeholder="+1 (555) 000-0000" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">System Role</label>
            <select 
              className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500"
              style={{ borderColor: 'var(--color-mist)' }}
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
            >
              <option value="3">Employee (Task Execution, Expense Submission)</option>
              <option value="2">Manager (Project Oversight, Expense Approvals)</option>
              <option value="1">System Admin (Full Access)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-cloud)' }}>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Create User</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetForm(); }} title="Edit User">
        <form onSubmit={handleUpdate} className="flex flex-col gap-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input id="edit_first_name" label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <Input id="edit_last_name" label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Input id="edit_phone_number" type="tel" label="Phone Number" placeholder="+1 (555) 000-0000" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal">System Role</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500" style={{ borderColor: 'var(--color-mist)' }} value={roleId} onChange={e => setRoleId(e.target.value)}>
                <option value="3">Employee</option>
                <option value="2">Manager</option>
                <option value="1">System Admin</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal">Account Status</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-md border bg-white focus:outline-none focus:border-brand-500" style={{ borderColor: 'var(--color-mist)' }} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-cloud)' }}>
            <Button variant="secondary" onClick={() => { setIsEditModalOpen(false); resetForm(); }} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
