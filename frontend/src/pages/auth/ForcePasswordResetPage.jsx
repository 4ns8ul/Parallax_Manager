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
      
      // Re-fetch user profile to clear the must_change_password flag in the store
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 border border-amber-500/20">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Security Action Required</h1>
          <p className="text-cloud text-center text-sm">
            Since this is your first time logging in or your account was reset, you must set a permanent strong password to continue.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3 text-emerald-500 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cloud mb-1">
                Temporary Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-cloud/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  placeholder="Enter the password from your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cloud mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-cloud/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cloud hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cloud mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-cloud/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  placeholder="Re-enter your new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium py-2.5 px-4 rounded-lg hover:from-amber-500 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Set Permanent Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
