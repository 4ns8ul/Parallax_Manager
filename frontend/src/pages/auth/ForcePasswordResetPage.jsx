import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, ShieldAlert, CheckCircle } from 'lucide-react';
import { authAPI } from '../../api';
import useAuthStore from '../../stores/authStore';

export default function ForcePasswordResetPage() {
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();
  const init = useAuthStore((s) => s.init);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.changePassword(tempPassword, newPassword);
      setSuccessMsg("Password successfully changed! Redirecting...");
      await init();
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Invalid temporary password or failed to update.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid var(--color-outline-variant)',
    color: 'var(--color-on-surface)',
    backgroundColor: 'var(--color-surface-container-lowest)',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: 'oklch(0.92 0.04 70)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid oklch(0.85 0.06 70)' }}>
            <ShieldAlert style={{ width: '24px', height: '24px', color: 'oklch(0.55 0.16 70)' }} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '8px', fontFamily: "'Inter'", letterSpacing: '-0.03em' }}>Security Action Required</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', textAlign: 'center', fontSize: '13px', fontFamily: "'Public Sans'" }}>
            Set a permanent strong password to continue.
          </p>
        </div>

        {errorMsg && (
          <div style={{ marginBottom: '20px', padding: '12px 14px', backgroundColor: 'var(--color-error-container)', border: '1px solid oklch(0.80 0.08 25)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--color-on-error-container)', fontSize: '13px', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ marginBottom: '20px', padding: '12px 14px', backgroundColor: 'var(--color-success-container)', border: '1px solid oklch(0.80 0.08 155)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'oklch(0.35 0.12 155)', fontSize: '13px', fontWeight: 500 }}>
            <CheckCircle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '1px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 32px oklch(0.15 0.01 260 / 0.06)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: '6px', fontFamily: "'Public Sans'" }}>Temporary Password</label>
              <input type={showPassword ? "text" : "password"} required value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} style={inputStyle} placeholder="Enter the password from your email" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: '6px', fontFamily: "'Public Sans'" }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} placeholder="At least 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-on-surface-variant)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: '6px', fontFamily: "'Public Sans'" }}>Confirm New Password</label>
              <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="Re-enter your new password" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                backgroundColor: 'oklch(0.55 0.16 70)', color: 'var(--color-on-primary)', fontWeight: 700,
                padding: '10px 16px', borderRadius: '9999px', border: 'none', fontSize: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1,
                transition: 'all 0.15s ease', fontFamily: "'Inter'",
              }}
            >
              {isLoading ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 0.6s linear infinite' }} /> : <Lock style={{ width: '16px', height: '16px' }} />}
              Set Permanent Password
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
