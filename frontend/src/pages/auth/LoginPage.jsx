import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (!email.toLowerCase().endsWith('@prlx.com')) {
      setErrorMsg('Only @prlx.com company emails are allowed.');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Invalid email or wrong password. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-page-wrapper {
          background-color: var(--color-background);
          background-image: 
            radial-gradient(at 0% 0%, color-mix(in srgb, var(--color-primary) 3%, transparent) 0px, transparent 50%),
            radial-gradient(at 100% 100%, color-mix(in srgb, var(--color-primary) 3%, transparent) 0px, transparent 50%);
          min-height: 100vh;
        }
        .login-card {
          box-shadow: 0 10px 25px -5px color-mix(in srgb, var(--color-primary) 10%, transparent), 0 8px 10px -6px color-mix(in srgb, var(--color-primary) 10%, transparent);
        }
        .btn-primary-tactile {
          border-bottom: 2px solid color-mix(in srgb, var(--color-primary-fixed) 30%, transparent);
        }
        .btn-primary-tactile:active {
          border-bottom: 0px solid transparent;
          transform: translateY(2px);
        }
      `}</style>
      <div className="login-page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <main style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-on-primary)', fontSize: '32px' }}>shield_person</span>
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', lineHeight: '40px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--color-primary)' }}>
              Parallax Enterprises
            </h1>
            <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '16px', lineHeight: '24px', color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
              Enter your credentials to access the management dashboard.
            </p>
          </div>

          <div className="login-card" style={{ width: '100%', backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {errorMsg && (
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-error-container)', border: '1px solid var(--color-error)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--color-on-error-container)', fontSize: '14px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', flexShrink: 0 }}>error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="email" style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '14px', lineHeight: '20px', fontWeight: 500, letterSpacing: '0.01em', color: 'var(--color-on-surface-variant)', padding: '0 4px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--color-outline)' }} className="input-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@enterprise.com"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 16px 8px 48px',
                      backgroundColor: 'var(--color-surface-container-low)',
                      border: 'none', borderBottom: '1px solid var(--color-outline)',
                      borderRadius: '8px 8px 0 0',
                      fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '16px', lineHeight: '24px', color: 'var(--color-on-surface)',
                      outline: 'none', transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'var(--color-surface-container-lowest)';
                      e.target.style.borderBottomColor = 'var(--color-primary)';
                      e.target.previousSibling.style.color = 'var(--color-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'var(--color-surface-container-low)';
                      e.target.style.borderBottomColor = 'var(--color-outline)';
                      e.target.previousSibling.style.color = 'var(--color-outline)';
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <label htmlFor="password" style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '14px', lineHeight: '20px', fontWeight: 500, letterSpacing: '0.01em', color: 'var(--color-on-surface-variant)' }}>
                    Password
                  </label>
                  <a href="#" style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '12px', lineHeight: '16px', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--color-primary)', textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                    Forgot Password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--color-outline)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 48px 8px 48px',
                      backgroundColor: 'var(--color-surface-container-low)',
                      border: 'none', borderBottom: '1px solid var(--color-outline)',
                      borderRadius: '8px 8px 0 0',
                      fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '16px', lineHeight: '24px', color: 'var(--color-on-surface)',
                      outline: 'none', transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'var(--color-surface-container-lowest)';
                      e.target.style.borderBottomColor = 'var(--color-primary)';
                      e.target.previousSibling.style.color = 'var(--color-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'var(--color-surface-container-low)';
                      e.target.style.borderBottomColor = 'var(--color-outline)';
                      e.target.previousSibling.style.color = 'var(--color-outline)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', top: 0, bottom: 0, right: 0, paddingRight: '16px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-outline)', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-outline)'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="remember" style={{ cursor: 'pointer', userSelect: 'none', fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '14px', lineHeight: '20px', fontWeight: 500, letterSpacing: '0.01em', color: 'var(--color-on-surface-variant)' }}>
                  Remember this device
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary-tactile"
                style={{
                  width: '100%', padding: '16px', backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)',
                  borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '14px', lineHeight: '20px', fontWeight: 500, letterSpacing: '0.01em',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={e => !loading && (e.currentTarget.style.filter = 'none')}
              >
                {loading ? 'Signing In...' : 'Sign In'}
                {!loading && <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>login</span>}
              </button>
            </form>

          </div>
        </main>

        <footer style={{ marginTop: '48px', display: 'flex', gap: '24px', opacity: 0.6 }}>
          <a href="#" style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '12px', lineHeight: '16px', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--color-on-surface-variant)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-surface-variant)'}>Privacy Policy</a>
          <a href="#" style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '12px', lineHeight: '16px', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--color-on-surface-variant)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-surface-variant)'}>Terms of Service</a>
          <a href="#" style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '12px', lineHeight: '16px', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--color-on-surface-variant)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-on-surface-variant)'}>Support</a>
        </footer>
      </div>
    </>
  );
}
