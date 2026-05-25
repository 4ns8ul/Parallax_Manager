import { useState, useEffect } from 'react';
import { usersAPI } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const selectStyle = {
  width: '100%', padding: '9px 36px 9px 12px', fontSize: '13px', borderRadius: '8px',
  border: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-lowest)',
  color: 'var(--color-on-surface)', outline: 'none', fontFamily: "'Inter'", appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737686' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};
const labelStyle = { fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)', fontFamily: "'Public Sans'" };
const thStyle = { padding: '10px 20px', fontWeight: 700, fontSize: '12px', color: 'var(--color-on-surface-variant)', fontFamily: "'Public Sans'", letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const tdStyle = { padding: '14px 20px', fontSize: '13px', whiteSpace: 'nowrap', color: 'var(--color-on-surface)', fontFamily: "'Inter'" };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [roleId, setRoleId] = useState('3');
  const [status, setStatus] = useState('ACTIVE');
  const [editUserId, setEditUserId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { fetchUsers(); }, []);
  const fetchUsers = async () => { try { const { data } = await usersAPI.list(1, 100); setUsers(data.users || []); } catch (err) { console.error(err); } finally { setLoading(false); } };

  const handleCreate = async (e) => {
    e.preventDefault(); setErrorMsg('');
    if (!email.toLowerCase().endsWith('@prlx.com')) return setErrorMsg("Only @prlx.com emails allowed.");
    setFormLoading(true);
    try {
      await usersAPI.create({ first_name: firstName, last_name: lastName, email, personal_email: personalEmail, phone_number: phoneNumber || null, role_ids: [parseInt(roleId, 10)] });
      toast.success("User added!"); setIsModalOpen(false); resetForm(); fetchUsers();
    } catch (err) { setErrorMsg(err.response?.data?.detail || "Failed"); } finally { setFormLoading(false); }
  };

  const openEditModal = (user) => {
    setEditUserId(user.id); setFirstName(user.first_name); setLastName(user.last_name);
    setPhoneNumber(user.phone_number || ''); setStatus(user.status);
    const role = user.roles[0];
    if (role === 'ADMIN') setRoleId('1'); else if (role === 'MANAGER') setRoleId('2'); else setRoleId('3');
    setErrorMsg(''); setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      await usersAPI.update(editUserId, { first_name: firstName, last_name: lastName, phone_number: phoneNumber || null, role_ids: [parseInt(roleId, 10)], status });
      toast.success("User updated"); setIsEditModalOpen(false); resetForm(); fetchUsers();
    } catch (err) { setErrorMsg(err.response?.data?.detail || "Failed"); } finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try { await usersAPI.delete(id); toast.success("Deleted"); fetchUsers(); } catch (err) { toast.error("Failed"); }
  };

  const resetForm = () => { setFirstName(''); setLastName(''); setEmail(''); setPersonalEmail(''); setPhoneNumber(''); setRoleId('3'); setStatus('ACTIVE'); setEditUserId(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-on-surface)', fontFamily: "'Inter'", letterSpacing: '-0.03em' }}>System Users</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginTop: '4px', fontFamily: "'Public Sans'" }}>Manage roles and platform access</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span> New User
        </Button>
      </div>

      <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', overflow: 'hidden', flex: 1 }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-container)', borderBottom: '1px solid var(--color-outline-variant)' }}>
              <th style={thStyle}>User</th><th style={thStyle}>Contact</th><th style={thStyle}>Role</th><th style={thStyle}>Status</th><th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '32px' }}>Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-outline-variant)', transition: 'background-color 0.1s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'oklch(0.95 0.02 260)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', fontFamily: "'Inter'" }}>{u.first_name[0]}{u.last_name[0]}</div>
                    <div><span style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</span><br/><span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>{u.email}</span></div>
                  </div>
                </td>
                <td style={tdStyle}><span style={{ fontSize: '12px' }}>{u.personal_email || '—'}</span><br/><span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>{u.phone_number || '—'}</span></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {u.roles.map(r => <span key={r} style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--color-on-surface-variant)', backgroundColor: 'var(--color-surface-container-high)', padding: '3px 8px', borderRadius: '9999px', fontFamily: "'Public Sans'", letterSpacing: '0.04em' }}>{r}</span>)}
                  </div>
                </td>
                <td style={tdStyle}><Badge variant={u.status === 'ACTIVE' ? 'APPROVED' : (u.status === 'SUSPENDED' ? 'REJECTED' : 'PENDING')}>{u.status}</Badge></td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                    <button onClick={() => openEditModal(u)} style={{ padding: '6px', color: 'var(--color-on-surface-variant)', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex' }} title="Edit"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(u.id)} style={{ padding: '6px', color: 'var(--color-on-surface-variant)', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex' }} title="Delete"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New User">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMsg && <div style={{ padding: '12px', backgroundColor: 'var(--color-error-container)', border: '1px solid oklch(0.80 0.08 25)', borderRadius: '8px', color: 'var(--color-on-error-container)', fontSize: '13px', fontWeight: 500 }}>{errorMsg}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input id="first_name" label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <Input id="last_name" label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input id="email" type="email" label="Company Email" placeholder="name@prlx.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input id="personal_email" type="email" label="Personal Email" placeholder="name@gmail.com" value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} required />
          </div>
          <Input id="phone_number" type="tel" label="Phone Number" placeholder="+1 (555) 000-0000" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>System Role</label>
            <select style={selectStyle} value={roleId} onChange={e => setRoleId(e.target.value)}>
              <option value="3">Employee</option><option value="2">Manager</option><option value="1">System Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)' }}>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Create User</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetForm(); }} title="Edit User">
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMsg && <div style={{ padding: '12px', backgroundColor: 'var(--color-error-container)', borderRadius: '8px', color: 'var(--color-on-error-container)', fontSize: '13px' }}>{errorMsg}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input id="edit_fn" label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <Input id="edit_ln" label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
          <Input id="edit_phone" type="tel" label="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>System Role</label>
              <select style={selectStyle} value={roleId} onChange={e => setRoleId(e.target.value)}>
                <option value="3">Employee</option><option value="2">Manager</option><option value="1">System Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Account Status</label>
              <select style={selectStyle} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)' }}>
            <Button variant="secondary" onClick={() => { setIsEditModalOpen(false); resetForm(); }} disabled={formLoading}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
