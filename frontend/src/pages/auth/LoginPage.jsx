import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="flex items-center justify-center min-h-screen bg-canvas p-4">
      <div 
        className="w-full max-w-[420px] bg-white rounded-[12px] p-8 border"
        style={{
          borderColor: 'var(--color-cloud)',
          boxShadow: '0 8px 32px oklch(0.15 0.01 250 / 0.04)',
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-xl text-white text-xl font-bold mb-4"
            style={{ backgroundColor: 'var(--color-brand-600)' }}
          >
            P
          </div>
          <h1 className="text-[24px] font-semibold text-ink text-center tracking-tight">
            Sign in to Parallax Enterprises
          </h1>
          <p className="text-sm mt-2 text-ash text-center">
            Enterprise Task & Expense Management
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            id="email"
            label="Work Email"
            type="email"
            placeholder="name@prlx.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-cloud text-center text-xs text-ash">
          <p>Secure Enterprise Portal</p>
        </div>
      </div>
    </div>
  );
}
